"""Pricing service for calculating LLM costs."""


from services.llm_providers.factory import get_provider


class PricingService:
    """Service for calculating LLM inference costs."""

    @staticmethod
    def get_pricing(provider: str, model: str) -> dict[str, float]:
        """
        Get pricing per 1M tokens for a provider/model.

        Args:
            provider: Provider name (huggingface, openai, groq, anthropic, gemini)
            model: Model identifier

        Returns:
            Dict with 'input' and 'output' keys representing price per 1M tokens
        """
        # Create a temporary provider instance to get pricing
        # We use a dummy token since we only need pricing info
        try:
            provider_instance = get_provider(provider, token="dummy")
            return provider_instance.get_pricing(model)
        except Exception:
            # Fallback to default pricing if provider not found
            return {"input": 0.1, "output": 0.1}

    @staticmethod
    def calculate_cost(
        provider: str,
        model: str,
        input_tokens: int | None,
        output_tokens: int | None,
    ) -> float:
        """
        Calculate cost in USD.

        Args:
            provider: Provider name
            model: Model identifier
            input_tokens: Number of input tokens
            output_tokens: Number of output tokens

        Returns:
            Cost in USD
        """
        if input_tokens is None or output_tokens is None:
            return 0.0

        pricing = PricingService.get_pricing(provider, model)

        cost = (input_tokens / 1_000_000 * pricing["input"]) + (
            output_tokens / 1_000_000 * pricing["output"]
        )

        return cost
