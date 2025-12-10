"""Factory for creating LLM provider instances."""

from typing import Optional
from services.llm_providers.base import LLMProvider
from services.llm_providers.huggingface import HuggingFaceProvider
from services.llm_providers.openai import OpenAIProvider
from services.llm_providers.groq import GroqProvider
from services.llm_providers.anthropic import AnthropicProvider
from services.llm_providers.gemini import GeminiProvider


def get_provider(provider_name: str, token: str, **kwargs) -> LLMProvider:
    """
    Create a provider instance.
    
    Args:
        provider_name: Provider name (huggingface, openai, groq, anthropic, gemini)
        token: API token/key for the provider
        **kwargs: Additional provider-specific parameters
        
    Returns:
        LLMProvider instance
        
    Raises:
        ValueError: If provider name is not supported
    """
    provider_map = {
        "huggingface": HuggingFaceProvider,
        "openai": OpenAIProvider,
        "groq": GroqProvider,
        "anthropic": AnthropicProvider,
        "gemini": GeminiProvider,
    }
    
    provider_class = provider_map.get(provider_name.lower())
    if not provider_class:
        raise ValueError(
            f"Unsupported provider: {provider_name}. "
            f"Supported providers: {', '.join(provider_map.keys())}"
        )
    
    return provider_class(token=token, **kwargs)

