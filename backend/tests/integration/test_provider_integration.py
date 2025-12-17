"""Integration tests for LLM providers."""

from unittest.mock import AsyncMock

import pytest

from services.llm_providers.factory import get_provider


class TestProviderIntegration:
    """Integration tests for providers."""

    @pytest.mark.asyncio
    async def test_openai_provider_integration(self):
        """Test OpenAI provider wiring without calling external APIs."""
        provider = get_provider("openai", token="test_key")
        assert provider.get_provider_name() == "openai"

        provider.run_inference = AsyncMock(
            return_value={"output": "ok", "input_tokens": None, "output_tokens": None}
        )
        result = await provider.run_inference(model="auto", input_text="hello")
        assert result["output"] == "ok"

    @pytest.mark.asyncio
    async def test_anthropic_provider_integration(self):
        """Test Anthropic provider wiring without calling external APIs."""
        provider = get_provider("anthropic", token="test_key")
        assert provider.get_provider_name() == "anthropic"

        provider.run_inference = AsyncMock(
            return_value={"output": "ok", "input_tokens": None, "output_tokens": None}
        )
        result = await provider.run_inference(model="auto", input_text="hello")
        assert result["output"] == "ok"

    def test_provider_factory_all_providers(self):
        """Test factory can create all providers."""
        providers = ["openai", "anthropic", "gemini", "groq", "huggingface"]
        for provider_name in providers:
            provider = get_provider(provider_name, token="test_token")
            assert provider is not None
            assert provider.get_provider_name() == provider_name
