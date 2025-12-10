"""Anthropic provider implementation."""

from typing import Optional, Dict

from anthropic import AsyncAnthropic

from services.llm_providers.base import LLMProvider, InferenceResult


class AnthropicProvider(LLMProvider):
    """Anthropic Claude provider."""

    def __init__(self, token: str, **kwargs):
        """
        Initialize Anthropic provider.
        
        Args:
            token: Anthropic API key
            **kwargs: Additional parameters
        """
        self.token = token
        self.client = AsyncAnthropic(api_key=token)

    async def run_inference(
        self,
        model: str,
        input_text: str,
        history: Optional[list] = None,
        **kwargs
    ) -> InferenceResult:
        """Run Anthropic inference."""
        history = history or []
        target_model = model if model and model != "auto" else "claude-3-5-sonnet-20241022"

        # Convert history to Anthropic message format
        messages = []
        for msg in history:
            # Anthropic uses "user" and "assistant" roles
            role = msg["role"] if msg["role"] in ["user", "assistant"] else "user"
            messages.append({"role": role, "content": msg["content"]})
        
        # Add current user message
        messages.append({"role": "user", "content": input_text})

        response = await self.client.messages.create(
            model=target_model,
            messages=messages,
            max_tokens=4096,
        )
        
        result = response.content[0].text if response.content else ""
        input_tokens = response.usage.input_tokens if response.usage else None
        output_tokens = response.usage.output_tokens if response.usage else None

        return InferenceResult(
            output=result,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
        )

    def get_pricing(self, model: str) -> Dict[str, float]:
        """Get Anthropic pricing per 1M tokens."""
        # Pricing per 1M tokens
        pricing = {
            "claude-3-5-sonnet-20241022": {"input": 3.0, "output": 15.0},
            "claude-3-5-sonnet-20240620": {"input": 3.0, "output": 15.0},
            "claude-3-opus-20240229": {"input": 15.0, "output": 75.0},
            "claude-3-sonnet-20240229": {"input": 3.0, "output": 15.0},
            "claude-3-haiku-20240307": {"input": 0.25, "output": 1.25},
        }
        
        # Default to sonnet pricing if model not found
        return pricing.get(model, {"input": 3.0, "output": 15.0})

    def get_provider_name(self) -> str:
        """Get provider name."""
        return "anthropic"

