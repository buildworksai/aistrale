"""Tests for HuggingFace provider."""

import pytest
from unittest.mock import AsyncMock, Mock, patch
from services.llm_providers.huggingface import HuggingFaceProvider


class TestHuggingFaceProvider:
    """Test HuggingFace provider."""

    @pytest.mark.asyncio
    async def test_run_inference_text_generation(self):
        """Test HuggingFace text generation."""
        with patch(
            "services.llm_providers.huggingface.AsyncInferenceClient"
        ) as mock_client_cls:
            mock_client = AsyncMock()
            mock_client_cls.return_value = mock_client
            mock_client.text_generation = AsyncMock(
                return_value="Generated text")

            provider = HuggingFaceProvider(
                token="test_token", hf_provider="auto", task="text-generation"
            )
            result = await provider.run_inference(
                model="gpt2", input_text="Hello", task="text-generation"
            )

            assert result["output"] == "Generated text"

    @pytest.mark.asyncio
    async def test_run_inference_chat_completion(self):
        """Test HuggingFace chat completion."""
        with patch(
            "services.llm_providers.huggingface.AsyncInferenceClient"
        ) as mock_client_cls:
            mock_client = AsyncMock()
            mock_client_cls.return_value = mock_client

            mock_response = Mock()
            mock_response.choices = [Mock()]
            mock_response.choices[0].message.content = "Chat response"
            mock_client.chat_completion = AsyncMock(return_value=mock_response)

            provider = HuggingFaceProvider(
                token="test_token", task="chat-completion")
            result = await provider.run_inference(
                model="gpt2",
                input_text="Hello",
                history=[{"role": "user", "content": "Hi"}],
                task="chat-completion",
            )

            assert result["output"] == "Chat response"

    def test_get_pricing(self):
        """Test HuggingFace pricing (free)."""
        provider = HuggingFaceProvider(token="test_token")
        pricing = provider.get_pricing("any-model")
        assert pricing["input"] == 0.0
        assert pricing["output"] == 0.0

    def test_get_provider_name(self):
        """Test provider name."""
        provider = HuggingFaceProvider(token="test_token")
        assert provider.get_provider_name() == "huggingface"
