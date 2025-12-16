"""HuggingFace provider implementation."""

import base64
import io
from typing import Optional, Dict, Any

import httpx
from huggingface_hub import AsyncInferenceClient

from services.llm_providers.base import LLMProvider, InferenceResult


class HuggingFaceProvider(LLMProvider):
    """HuggingFace Hub provider."""

    def __init__(self, token: str, hf_provider: str = "auto", **kwargs):
        """
        Initialize HuggingFace provider.

        Args:
            token: HuggingFace API token
            hf_provider: HuggingFace provider (auto, fal-ai, replicate, etc.)
            **kwargs: Additional parameters
        """
        self.token = token
        self.hf_provider = hf_provider
        self.client = AsyncInferenceClient(token=token, provider=hf_provider)

    async def run_inference(
        self,
        model: str,
        input_text: str,
        history: Optional[list] = None,
        task: str = "auto",
        **kwargs,
    ) -> InferenceResult:
        """Run HuggingFace inference."""
        history = history or []
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

        result: Any = None
        input_tokens = None
        output_tokens = None

        # Explicit Task Routing
        if task == "text-generation":
            result = await self.client.text_generation(full_input, model=target_model)

        elif task == "text-to-image":
            image = await self.client.text_to_image(input_text, model=target_model)
            buffered = io.BytesIO()
            image.save(buffered, format="PNG")
            b64_data = base64.b64encode(buffered.getvalue()).decode("utf-8")
            result = {"binary_data": b64_data, "mime_type": "image/png"}

        elif task == "text-to-video":
            video_bytes = await self.client.text_to_video(
                input_text, model=target_model
            )
            b64_data = base64.b64encode(video_bytes).decode("utf-8")
            result = {"binary_data": b64_data, "mime_type": "video/mp4"}

        elif task == "image-to-video":
            raise NotImplementedError(
                "Image-to-video requires image input support")

        elif task == "chat-completion":
            messages = []
            for msg in history:
                messages.append(
                    {"role": msg["role"], "content": msg["content"]})
            messages.append({"role": "user", "content": input_text})

            response = await self.client.chat_completion(messages, model=target_model)
            result = response.choices[0].message.content

        else:
            # Auto/Fallback Logic
            try:
                result = await self.client.text_generation(
                    full_input, model=target_model
                )
            except Exception as e:
                error_str = str(e).lower()
                if "text-to-video" in error_str or (
                    target_model and "video" in target_model.lower()
                ):
                    try:
                        video_bytes = await self.client.text_to_video(
                            input_text, model=target_model
                        )
                        b64_data = base64.b64encode(
                            video_bytes).decode("utf-8")
                        result = {
                            "binary_data": b64_data,
                            "mime_type": "video/mp4"}
                    except AttributeError:
                        raise e
                elif "conversational" in error_str and (
                    "supported task" in error_str or "available tasks" in error_str
                ):
                    messages = []
                    for msg in history:
                        messages.append(
                            {"role": msg["role"], "content": msg["content"]}
                        )
                    messages.append({"role": "user", "content": input_text})

                    response = await self.client.chat_completion(
                        messages, model=target_model
                    )
                    result = response.choices[0].message.content
                elif "Task" in str(e) and "not supported" in str(e):
                    # Generic fallback
                    api_url = f"https://router.huggingface.co/models/{target_model}"
                    headers = {"Authorization": f"Bearer {self.token}"}
                    if self.hf_provider and self.hf_provider != "auto":
                        headers["X-Use-Cache"] = "false"

                    async with httpx.AsyncClient() as http_client:
                        response = await http_client.post(
                            api_url, headers=headers, json={"inputs": input_text}
                        )

                    if response.status_code != 200:  # noqa: PLR2004
                        raise Exception(f"Inference failed: {response.text}")

                    try:
                        result = response.json()
                    except Exception:
                        b64_data = base64.b64encode(
                            response.content).decode("utf-8")
                        result = {"binary_data": b64_data}
                else:
                    raise e

        return InferenceResult(
            output=result,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
        )

    def get_pricing(self, model: str) -> Dict[str, float]:
        """Get HuggingFace pricing (typically free for inference endpoints)."""
        # HuggingFace inference endpoints are typically free
        # Paid inference endpoints would have pricing here
        return {"input": 0.0, "output": 0.0}

    def get_provider_name(self) -> str:
        """Get provider name."""
        return "huggingface"
