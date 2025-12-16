"""Base provider interface for LLM providers."""

from abc import ABC, abstractmethod
from typing import Optional, Dict, Any, TypedDict


class InferenceResult(TypedDict, total=False):
    """Result from LLM inference."""

    output: Any  # Can be str, dict (for binary data), etc.
    input_tokens: Optional[int]
    output_tokens: Optional[int]


class LLMProvider(ABC):
    """Base class for LLM providers."""

    @abstractmethod
    async def run_inference(
            self,
            model: str,
            input_text: str,
            history: Optional[list] = None,
            **kwargs) -> InferenceResult:
        """
        Run inference and return result with token usage.

        Args:
            model: Model identifier
            input_text: Input text for inference
            history: Optional conversation history
            **kwargs: Additional provider-specific parameters

        Returns:
            InferenceResult with output and token counts
        """

    @abstractmethod
    def get_pricing(self, model: str) -> Dict[str, float]:
        """
        Get pricing per 1M tokens (input, output).

        Args:
            model: Model identifier

        Returns:
            Dict with 'input' and 'output' keys representing price per 1M tokens
        """

    @abstractmethod
    def get_provider_name(self) -> str:
        """Get the provider name (e.g., 'openai', 'anthropic')."""
