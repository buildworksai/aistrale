"""Integration tests for LLM providers."""

import pytest
from services.llm_providers.factory import get_provider


class TestProviderIntegration:
    """Integration tests for providers."""

    @pytest.mark.asyncio
    @pytest.mark.skip(reason="Requires actual API keys")
    async def test_openai_provider_integration(self):
        """Test OpenAI provider with real API (requires key)."""
        provider = get_provider("openai", token="test_key")
        # This would require a real API key to test

    @pytest.mark.asyncio
    @pytest.mark.skip(reason="Requires actual API keys")
    async def test_anthropic_provider_integration(self):
        """Test Anthropic provider with real API (requires key)."""
        provider = get_provider("anthropic", token="test_key")
        # This would require a real API key to test

    def test_provider_factory_all_providers(self):
        """Test factory can create all providers."""
        providers = ["openai", "anthropic", "gemini", "groq", "huggingface"]
        for provider_name in providers:
            provider = get_provider(provider_name, token="test_token")
            assert provider is not None
            assert provider.get_provider_name() == provider_name
