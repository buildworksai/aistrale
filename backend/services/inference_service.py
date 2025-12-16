import time
from typing import Optional

import sentry_sdk
from sqlmodel import Session

from opentelemetry import trace
from core.exceptions import InferenceError
from core.metrics import (
    INFERENCE_COUNT,
    INFERENCE_COST,
    INFERENCE_DURATION,
    INFERENCE_TOKENS,
)
from models.telemetry import Telemetry
from models.prompt import Prompt
from services.prompt_service import render_prompt
from services.llm_providers.factory import get_provider
from services.pricing_service import PricingService

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
                input_text = render_prompt(prompt, prompt_variables)

                # Also update model if prompt has a default model and none
                # provided
                if not model or model == "auto":
                    if prompt.model:
                        model = prompt.model

            # Get provider instance using factory
            provider_kwargs = {}
            if provider == "huggingface":
                provider_kwargs["hf_provider"] = hf_provider
                provider_kwargs["task"] = task

            provider_instance = get_provider(
                provider, token=token_value, **provider_kwargs
            )

            # Run inference using provider abstraction
            inference_result = await provider_instance.run_inference(
                model=model,
                input_text=input_text,
                history=history,
                task=task if provider == "huggingface" else None,
            )

            result = inference_result["output"]
            input_tokens = inference_result.get("input_tokens")
            output_tokens = inference_result.get("output_tokens")

        except Exception as e:
            status = "error"
            error_message = str(e)
            # Log the error but also raise a structured exception for the API
            # We need to ensure telemetry is still saved before raising
            # So we'll save telemetry in a finally block or before raising

        end_time = time.time()
        execution_time_ms = (end_time - start_time) * 1000

        # Calculate cost using pricing service
        cost = PricingService.calculate_cost(
            provider=provider,
            model=model or "auto",
            input_tokens=input_tokens,
            output_tokens=output_tokens,
        )

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
        INFERENCE_COUNT.labels(
            provider=provider, model=model or "auto", status=status
        ).inc()
        INFERENCE_DURATION.labels(
            provider=provider,
            model=model or "auto").observe(
            execution_time_ms / 1000.0)
        if input_tokens is not None:
            INFERENCE_TOKENS.labels(
                provider=provider, model=model or "auto", type="input"
            ).observe(input_tokens)
            span.set_attribute("llm.usage.input_tokens", input_tokens)
        if output_tokens is not None:
            INFERENCE_TOKENS.labels(
                provider=provider, model=model or "auto", type="output"
            ).observe(output_tokens)
            span.set_attribute("llm.usage.output_tokens", output_tokens)

        if cost > 0:
            INFERENCE_COST.labels(
                provider=provider,
                model=model or "auto").observe(cost)
            span.set_attribute("llm.cost", cost)

        if status == "error":
            span.set_status(trace.Status(trace.StatusCode.ERROR))
            span.record_exception(Exception(error_message))

            # Capture exception with context in Sentry
            with sentry_sdk.push_scope() as scope:
                scope.set_tag("provider", provider)
                scope.set_tag("model", model or "auto")
                scope.set_user({"id": user_id})
                scope.set_context(
                    "inference",
                    {
                        "input_text_length": len(input_text) if input_text else 0,
                        "token_value_masked": (
                            token_value[:4] + "***" if token_value else None
                        ),
                        "hf_provider": hf_provider,
                        "task": task,
                    },
                )
                sentry_sdk.capture_exception(Exception(error_message))

            raise InferenceError(error_message)
        else:
            span.set_status(trace.Status(trace.StatusCode.OK))

        return result
