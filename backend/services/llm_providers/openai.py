"""OpenAI provider implementation."""

from typing import Optional, Dict

from openai import AsyncOpenAI

from services.llm_providers.base import LLMProvider, InferenceResult


class OpenAIProvider(LLMProvider):
    """OpenAI provider."""

    def __init__(self, token: str, **kwargs):
        """
        Initialize OpenAI provider.

        Args:
            token: OpenAI API key
            **kwargs: Additional parameters
        """
        self.token = token
        self.client = AsyncOpenAI(api_key=token)

    async def run_inference(
            self,
            model: str,
            input_text: str,
            history: Optional[list] = None,
            **kwargs) -> InferenceResult:
        """Run OpenAI inference."""
        history = history or []
        target_model = model if model and model != "auto" else "gpt-3.5-turbo"

        messages = [{"role": "system",
                     "content": "You are a helpful assistant."}]
        for msg in history:
            messages.append({"role": msg["role"], "content": msg["content"]})
        messages.append({"role": "user", "content": input_text})

        response = await self.client.chat.completions.create(
            model=target_model, messages=messages
        )

        result = response.choices[0].message.content
        input_tokens = response.usage.prompt_tokens if response.usage else None
        output_tokens = response.usage.completion_tokens if response.usage else None

        return InferenceResult(
            output=result,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
        )

    def get_pricing(self, model: str) -> Dict[str, float]:
        """Get OpenAI pricing per 1M tokens."""
        # Pricing per 1M tokens
        pricing = {
            "gpt-4o": {"input": 5.0, "output": 15.0},
            "gpt-4o-mini": {"input": 0.15, "output": 0.6},
            "gpt-4-turbo": {"input": 10.0, "output": 30.0},
            "gpt-4": {"input": 30.0, "output": 60.0},
            "gpt-3.5-turbo": {"input": 0.5, "output": 1.5},
            "gpt-3.5-turbo-16k": {"input": 3.0, "output": 4.0},
        }

        # Default to gpt-3.5-turbo pricing if model not found
        return pricing.get(model, {"input": 0.5, "output": 1.5})

    def get_provider_name(self) -> str:
        """Get provider name."""
        return "openai"
