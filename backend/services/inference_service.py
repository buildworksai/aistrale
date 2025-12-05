import base64
import io
import time
from typing import Optional

import httpx
import sentry_sdk
from groq import AsyncGroq
from huggingface_hub import AsyncInferenceClient
from openai import AsyncOpenAI
from sqlmodel import Session

from opentelemetry import trace
from core.exceptions import InferenceError
from core.metrics import INFERENCE_COUNT, INFERENCE_COST, INFERENCE_DURATION, INFERENCE_TOKENS
from models.telemetry import Telemetry
from models.prompt import Prompt
from services.prompt_service import render_prompt

tracer = trace.get_tracer(__name__)


async def run_inference(
    session: Session,
    user_id: int,
    provider: str,
    model: str,
    input_text: str,
    token_value: str,
    hf_provider: str = "auto",
    task: str = "auto",
    history: Optional[list] = None,
    prompt_id: Optional[int] = None,
    prompt_variables: Optional[dict] = None,
):
    history = history or []
    start_time = time.time()
    status = "success"
    error_message = None
    input_tokens = None
    output_tokens = None
    result = None

    with tracer.start_as_current_span("llm_inference") as span:
        span.set_attribute("llm.provider", provider)
        span.set_attribute("llm.model", model or "auto")
        span.set_attribute("user.id", user_id)

        try:
            # Handle Prompt Template
            if prompt_id:
                prompt = session.get(Prompt, prompt_id)
                if not prompt:
                    raise ValueError(f"Prompt with ID {prompt_id} not found")
                
                if not prompt_variables:
                    prompt_variables = {}
                    
                # Render prompt
                # If input_text is provided, it might be one of the variables, or we override it?
                # Let's assume input_text overrides a variable named 'input' or 'text' if not in variables?
                # Or better: if prompt_id is used, input_text is ignored unless it's part of variables.
                # Actually, typically input_text IS the main variable.
                # Let's check if 'input' or 'text' is in input_variables and not in prompt_variables
                
                # For simplicity, let's assume the rendered prompt BECOMES the input_text
                input_text = render_prompt(prompt, prompt_variables)
                
                # Also update model if prompt has a default model and none provided
                if not model or model == "auto":
                    if prompt.model:
                        model = prompt.model

            if provider == "huggingface":
                client = AsyncInferenceClient(token=token_value, provider=hf_provider)
                target_model = model if model and model != "auto" else None

                # Construct prompt with history for text generation/chat
                prompt_history = ""
                for msg in history:
                    role = "User" if msg["role"] == "user" else "Assistant"
                    prompt_history += f"{role}: {msg['content']}\n"

                full_input = (
                    prompt_history + f"User: {input_text}\nAssistant:"
                    if history
                    else input_text
                )

                # Explicit Task Routing
                if task == "text-generation":
                    result = await client.text_generation(full_input, model=target_model)

                elif task == "text-to-image":
                    image = await client.text_to_image(input_text, model=target_model)
                    # Convert PIL Image to base64
                    buffered = io.BytesIO()
                    image.save(buffered, format="PNG")
                    b64_data = base64.b64encode(buffered.getvalue()).decode("utf-8")
                    result = {"binary_data": b64_data, "mime_type": "image/png"}

                elif task == "text-to-video":
                    video_bytes = await client.text_to_video(input_text, model=target_model)
                    b64_data = base64.b64encode(video_bytes).decode("utf-8")
                    result = {"binary_data": b64_data, "mime_type": "video/mp4"}

                elif task == "image-to-video":
                    # Requires image input, which we don't have in this simple signature yet
                    # For now, raise not implemented or try to parse input_text as URL?
                    # Let's assume input_text is a URL for now if this task is selected
                    # Or just skip for now as user didn't explicitly ask for image input UI
                    raise NotImplementedError("Image-to-video requires image input support")

                elif task == "chat-completion":
                    messages = []
                    for msg in history:
                        messages.append({"role": msg["role"], "content": msg["content"]})
                    messages.append({"role": "user", "content": input_text})

                    response = await client.chat_completion(messages, model=target_model)
                    result = response.choices[0].message.content

                else:
                    # Auto/Fallback Logic (Legacy)
                    try:
                        # Try text generation first
                        result = await client.text_generation(full_input, model=target_model)
                    except Exception as e:
                        error_str = str(e).lower()
                        if "text-to-video" in error_str or (
                            target_model and "video" in target_model.lower()
                        ):
                            try:
                                video_bytes = await client.text_to_video(
                                    input_text, model=target_model
                                )
                                b64_data = base64.b64encode(video_bytes).decode("utf-8")
                                result = {"binary_data": b64_data, "mime_type": "video/mp4"}
                            except AttributeError as attr_err:
                                raise e from attr_err
                        elif "conversational" in error_str and (
                            "supported task" in error_str or "available tasks" in error_str
                        ):
                            messages = []
                            for msg in history:
                                messages.append(
                                    {"role": msg["role"], "content": msg["content"]}
                                )
                            messages.append({"role": "user", "content": input_text})

                            response = await client.chat_completion(messages, model=target_model)
                            result = response.choices[0].message.content
                        elif "Task" in str(e) and "not supported" in str(e):
                            # Generic fallback
                            api_url = f"https://router.huggingface.co/models/{target_model}"
                            headers = {"Authorization": f"Bearer {token_value}"}
                            if hf_provider and hf_provider != "auto":
                                headers["X-Use-Cache"] = "false"

                            async with httpx.AsyncClient() as http_client:
                                response = await http_client.post(
                                    api_url, headers=headers, json={"inputs": input_text}
                                )

                            if response.status_code != 200:  # noqa: PLR2004
                                raise Exception(
                                    f"Inference failed: {response.text}"
                                ) from None

                            try:
                                result = response.json()
                            except Exception:
                                b64_data = base64.b64encode(response.content).decode(
                                    "utf-8"
                                )
                                # Guess mime type?
                                result = {"binary_data": b64_data}
                        else:
                            raise e

            elif provider == "openai":
                client = AsyncOpenAI(api_key=token_value)
                target_model = model if model and model != "auto" else "gpt-3.5-turbo"

                messages = [{"role": "system", "content": "You are a helpful assistant."}]
                for msg in history:
                    messages.append({"role": msg["role"], "content": msg["content"]})
                messages.append({"role": "user", "content": input_text})

                response = await client.chat.completions.create(
                    model=target_model, messages=messages
                )
                result = response.choices[0].message.content
                if response.usage:
                    input_tokens = response.usage.prompt_tokens
                    output_tokens = response.usage.completion_tokens

            elif provider == "groq":
                client = AsyncGroq(api_key=token_value)
                target_model = (
                    model if model and model != "auto" else "llama-3.3-70b-versatile"
                )

                messages = [{"role": "system", "content": "You are a helpful assistant."}]
                for msg in history:
                    messages.append({"role": msg["role"], "content": msg["content"]})
                messages.append({"role": "user", "content": input_text})

                # User requested streaming pattern
                stream = await client.chat.completions.create(
                    model=target_model,
                    messages=messages,
                    stream=True,
                    # stream_options={"include_usage": True}
                    # Try to request usage if supported
                )

                full_content = []
                async for chunk in stream:
                    content = chunk.choices[0].delta.content
                    if content:
                        full_content.append(content)

                    # Attempt to capture usage from the chunk if available
                    if hasattr(chunk, "usage") and chunk.usage:
                        input_tokens = chunk.usage.prompt_tokens
                        output_tokens = chunk.usage.completion_tokens
                    elif (
                        hasattr(chunk, "x_groq")
                        and chunk.x_groq
                        and "usage" in chunk.x_groq
                    ):
                        # Fallback for Groq specific header if exposed in chunk object
                        usage_data = chunk.x_groq["usage"]
                        input_tokens = usage_data.get("prompt_tokens")
                        output_tokens = usage_data.get("completion_tokens")

                result = "".join(full_content)

            else:
                raise ValueError("Invalid provider")

        except Exception as e:
            status = "error"
            error_message = str(e)
            # Log the error but also raise a structured exception for the API
            # We need to ensure telemetry is still saved before raising
            # So we'll save telemetry in a finally block or before raising
            pass

        end_time = time.time()
        execution_time_ms = (end_time - start_time) * 1000

        # Calculate cost
        cost = 0.0
        if input_tokens is not None and output_tokens is not None:
            # Pricing per 1M tokens (approximate)
            pricing = {
                "gpt-4o": {"input": 5.0, "output": 15.0},
                "gpt-3.5-turbo": {"input": 0.5, "output": 1.5},
                "llama-3.3-70b-versatile": {"input": 0.59, "output": 0.79}, # Groq pricing
            }
            
            # Default pricing if model not found (fallback to cheap)
            model_pricing = pricing.get(model, {"input": 0.1, "output": 0.1})
            
            cost = (input_tokens / 1_000_000 * model_pricing["input"]) + \
                   (output_tokens / 1_000_000 * model_pricing["output"])

        # Log telemetry
        telemetry = Telemetry(
            user_id=user_id,
            model=model or "auto",
            sdk=provider,
            input_summary=input_text[:50],  # Truncate for summary
            execution_time_ms=execution_time_ms,
            status=status,
            error_message=error_message,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            cost=cost,
            prompt_id=prompt_id,
        )
        session.add(telemetry)
        session.commit()

        # Record metrics
        INFERENCE_COUNT.labels(provider=provider, model=model or "auto", status=status).inc()
        INFERENCE_DURATION.labels(provider=provider, model=model or "auto").observe(execution_time_ms / 1000.0)
        if input_tokens is not None:
            INFERENCE_TOKENS.labels(provider=provider, model=model or "auto", type="input").observe(input_tokens)
            span.set_attribute("llm.usage.input_tokens", input_tokens)
        if output_tokens is not None:
            INFERENCE_TOKENS.labels(provider=provider, model=model or "auto", type="output").observe(output_tokens)
            span.set_attribute("llm.usage.output_tokens", output_tokens)
        
        if cost > 0:
            INFERENCE_COST.labels(provider=provider, model=model or "auto").observe(cost)
            span.set_attribute("llm.cost", cost)

        if status == "error":
            span.set_status(trace.Status(trace.StatusCode.ERROR))
            span.record_exception(Exception(error_message))
            
            # Capture exception with context in Sentry
            with sentry_sdk.push_scope() as scope:
                scope.set_tag("provider", provider)
                scope.set_tag("model", model or "auto")
                scope.set_user({"id": user_id})
                scope.set_context("inference", {
                    "input_text_length": len(input_text) if input_text else 0,
                    "token_value_masked": token_value[:4] + "***" if token_value else None,
                    "hf_provider": hf_provider,
                    "task": task
                })
                sentry_sdk.capture_exception(Exception(error_message))

            raise InferenceError(error_message)
        else:
            span.set_status(trace.Status(trace.StatusCode.OK))

        return result

