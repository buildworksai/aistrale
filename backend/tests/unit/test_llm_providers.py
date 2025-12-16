"""Tests for LLM provider implementations."""

import pytest
from unittest.mock import AsyncMock, Mock, patch
from services.llm_providers.factory import get_provider
from services.llm_providers.openai import OpenAIProvider
from services.llm_providers.anthropic import AnthropicProvider
from services.llm_providers.gemini import GeminiProvider
from services.llm_providers.groq import GroqProvider
from services.llm_providers.huggingface import HuggingFaceProvider


class TestProviderFactory:
    """Test provider factory."""

    def test_get_provider_openai(self):
        """Test getting OpenAI provider."""
        provider = get_provider("openai", token="test_token")
        assert isinstance(provider, OpenAIProvider)

    def test_get_provider_anthropic(self):
        """Test getting Anthropic provider."""
        provider = get_provider("anthropic", token="test_token")
        assert isinstance(provider, AnthropicProvider)

    def test_get_provider_gemini(self):
        """Test getting Gemini provider."""
        provider = get_provider("gemini", token="test_token")
        assert isinstance(provider, GeminiProvider)

    def test_get_provider_groq(self):
        """Test getting Groq provider."""
        provider = get_provider("groq", token="test_token")
        assert isinstance(provider, GroqProvider)

    def test_get_provider_huggingface(self):
        """Test getting HuggingFace provider."""
        provider = get_provider("huggingface", token="test_token")
        assert isinstance(provider, HuggingFaceProvider)

    def test_get_provider_invalid(self):
        """Test getting invalid provider raises error."""
        with pytest.raises(ValueError, match="Unsupported provider"):
            get_provider("invalid", token="test_token")


class TestOpenAIProvider:
    """Test OpenAI provider."""

    @pytest.mark.asyncio
    async def test_run_inference(self):
        """Test OpenAI inference."""
        with patch("services.llm_providers.openai.AsyncOpenAI") as mock_openai:
            mock_client = AsyncMock()
            mock_openai.return_value = mock_client

            mock_response = Mock()
            mock_response.choices = [Mock()]
            mock_response.choices[0].message.content = "Test response"
            mock_response.usage = Mock()
            mock_response.usage.prompt_tokens = 10
            mock_response.usage.completion_tokens = 20

            mock_client.chat.completions.create = AsyncMock(
                return_value=mock_response)

            provider = OpenAIProvider(token="test_token")
            result = await provider.run_inference(
                model="gpt-3.5-turbo", input_text="Test input"
            )

            assert result["output"] == "Test response"
            assert result["input_tokens"] == 10
            assert result["output_tokens"] == 20

    def test_get_pricing(self):
        """Test OpenAI pricing."""
        provider = OpenAIProvider(token="test_token")
        pricing = provider.get_pricing("gpt-3.5-turbo")
        assert pricing["input"] == 0.5
        assert pricing["output"] == 1.5

    def test_get_provider_name(self):
        """Test provider name."""
        provider = OpenAIProvider(token="test_token")
        assert provider.get_provider_name() == "openai"


class TestAnthropicProvider:
    """Test Anthropic provider."""

    @pytest.mark.asyncio
    async def test_run_inference(self):
        """Test Anthropic inference."""
        with patch("services.llm_providers.anthropic.AsyncAnthropic") as mock_anthropic:
            mock_client = AsyncMock()
            mock_anthropic.return_value = mock_client

            mock_response = Mock()
            mock_response.content = [Mock()]
            mock_response.content[0].text = "Test response"
            mock_response.usage = Mock()
            mock_response.usage.input_tokens = 10
            mock_response.usage.output_tokens = 20

            mock_client.messages.create = AsyncMock(return_value=mock_response)

            provider = AnthropicProvider(token="test_token")
            result = await provider.run_inference(
                model="claude-3-5-sonnet-20241022", input_text="Test input"
            )

            assert result["output"] == "Test response"
            assert result["input_tokens"] == 10
            assert result["output_tokens"] == 20

    def test_get_pricing(self):
        """Test Anthropic pricing."""
        provider = AnthropicProvider(token="test_token")
        pricing = provider.get_pricing("claude-3-5-sonnet-20241022")
        assert pricing["input"] == 3.0
        assert pricing["output"] == 15.0

    def test_get_provider_name(self):
        """Test provider name."""
        provider = AnthropicProvider(token="test_token")
        assert provider.get_provider_name() == "anthropic"


class TestGeminiProvider:
    """Test Gemini provider."""

    @pytest.mark.asyncio
    async def test_run_inference(self):
        """Test Gemini inference."""
        with patch("services.llm_providers.gemini.genai") as mock_genai:
            mock_model = Mock()
            mock_chat = Mock()
            mock_response = Mock()
            mock_response.text = "Test response"

            mock_chat.send_message = Mock(return_value=mock_response)
            mock_model.start_chat = Mock(return_value=mock_chat)
            mock_genai.GenerativeModel = Mock(return_value=mock_model)

            provider = GeminiProvider(token="test_token")
            result = await provider.run_inference(
                model="gemini-pro", input_text="Test input"
            )

            assert result["output"] == "Test response"

    def test_get_pricing(self):
        """Test Gemini pricing."""
        provider = GeminiProvider(token="test_token")
        pricing = provider.get_pricing("gemini-pro")
        assert pricing["input"] == 0.5
        assert pricing["output"] == 1.5

    def test_get_provider_name(self):
        """Test provider name."""
        provider = GeminiProvider(token="test_token")
        assert provider.get_provider_name() == "gemini"


class TestGroqProvider:
    """Test Groq provider."""

    @pytest.mark.asyncio
    async def test_run_inference(self):
        """Test Groq inference."""
        with patch("services.llm_providers.groq.AsyncGroq") as mock_groq:
            mock_client = AsyncMock()
            mock_groq.return_value = mock_client

            # Mock streaming response
            mock_chunk1 = Mock()
            mock_chunk1.choices = [Mock()]
            mock_chunk1.choices[0].delta.content = "Test "
            mock_chunk1.usage = None

            mock_chunk2 = Mock()
            mock_chunk2.choices = [Mock()]
            mock_chunk2.choices[0].delta.content = "response"
            mock_chunk2.usage = Mock()
            mock_chunk2.usage.prompt_tokens = 10
            mock_chunk2.usage.completion_tokens = 20

            async def mock_stream():
                yield mock_chunk1
                yield mock_chunk2

            # Create an async generator properly
            async def async_stream():
                yield mock_chunk1
                yield mock_chunk2

            mock_client.chat.completions.create = AsyncMock(
                return_value=async_stream())

            provider = GroqProvider(token="test_token")
            result = await provider.run_inference(
                model="llama-3.3-70b-versatile", input_text="Test input"
            )

            assert result["output"] == "Test response"
            assert result["input_tokens"] == 10
            assert result["output_tokens"] == 20

    def test_get_pricing(self):
        """Test Groq pricing."""
        provider = GroqProvider(token="test_token")
        pricing = provider.get_pricing("llama-3.3-70b-versatile")
        assert pricing["input"] == 0.59
        assert pricing["output"] == 0.79

    def test_get_provider_name(self):
        """Test provider name."""
        provider = GroqProvider(token="test_token")
        assert provider.get_provider_name() == "groq"
