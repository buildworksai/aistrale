"""Groq provider implementation."""

from typing import Optional, Dict

from groq import AsyncGroq

from services.llm_providers.base import LLMProvider, InferenceResult


class GroqProvider(LLMProvider):
    """Groq provider."""

    def __init__(self, token: str, **kwargs):
        """
        Initialize Groq provider.
        
        Args:
            token: Groq API key
            **kwargs: Additional parameters
        """
        self.token = token
        self.client = AsyncGroq(api_key=token)

    async def run_inference(
        self,
        model: str,
        input_text: str,
        history: Optional[list] = None,
        **kwargs
    ) -> InferenceResult:
        """Run Groq inference."""
        history = history or []
        target_model = (
            model if model and model != "auto" else "llama-3.3-70b-versatile"
        )

        messages = [{"role": "system", "content": "You are a helpful assistant."}]
        for msg in history:
            messages.append({"role": msg["role"], "content": msg["content"]})
        messages.append({"role": "user", "content": input_text})

        stream = await self.client.chat.completions.create(
            model=target_model,
            messages=messages,
            stream=True,
        )

        full_content = []
        input_tokens = None
        output_tokens = None
        
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
                usage_data = chunk.x_groq["usage"]
                input_tokens = usage_data.get("prompt_tokens")
                output_tokens = usage_data.get("completion_tokens")

        result = "".join(full_content)

        return InferenceResult(
            output=result,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
        )

    def get_pricing(self, model: str) -> Dict[str, float]:
        """Get Groq pricing per 1M tokens."""
        # Pricing per 1M tokens
        pricing = {
            "llama-3.3-70b-versatile": {"input": 0.59, "output": 0.79},
            "llama-3.1-70b-versatile": {"input": 0.59, "output": 0.79},
            "llama-3.1-8b-instant": {"input": 0.05, "output": 0.08},
            "mixtral-8x7b-32768": {"input": 0.24, "output": 0.24},
            "gemma-7b-it": {"input": 0.07, "output": 0.07},
        }
        
        # Default pricing if model not found
        return pricing.get(model, {"input": 0.1, "output": 0.1})

    def get_provider_name(self) -> str:
        """Get provider name."""
        return "groq"

