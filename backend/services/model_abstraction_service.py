import logging
from typing import List, Dict, Any, Optional
from models.multi_provider import ModelMapping

logger = logging.getLogger(__name__)


class ModelAbstractionService:
    """
    Service to provide a unified interface for models across different providers.
    Resolves unified model names (e.g. "smart-fast") to specific provider models.
    """

    def __init__(self):
        # Simulation: Load mappings
        self.mappings = [
            ModelMapping(
                id=1,
                model_name="smart-fast",
                provider="openai",
                equivalent_models=["gpt-3.5-turbo", "claude-3-haiku", "gemini-pro"],
                capabilities={
                    "max_tokens": 4096,
                    "supports_streaming": True,
                    "supports_functions": False,
                    "context_window": 8192,
                },
                pricing={"input_per_1k": 0.0005, "output_per_1k": 0.0015},
            ),
            ModelMapping(
                id=2,
                model_name="smart-balanced",
                provider="openai",
                equivalent_models=["gpt-3.5-turbo", "claude-3-sonnet", "gemini-pro"],
                capabilities={
                    "max_tokens": 8192,
                    "supports_streaming": True,
                    "supports_functions": True,
                    "context_window": 16384,
                },
                pricing={"input_per_1k": 0.0015, "output_per_1k": 0.002},
            ),
            ModelMapping(
                id=3,
                model_name="smart-quality",
                provider="anthropic",
                equivalent_models=["gpt-4", "claude-3-opus", "gemini-ultra"],
                capabilities={
                    "max_tokens": 16384,
                    "supports_streaming": True,
                    "supports_functions": True,
                    "context_window": 200000,
                },
                pricing={"input_per_1k": 0.03, "output_per_1k": 0.06},
            ),
            ModelMapping(
                id=4,
                model_name="smart-cheap",
                provider="huggingface",
                equivalent_models=["llama-2-7b", "mistral-7b", "phi-2"],
                capabilities={
                    "max_tokens": 2048,
                    "supports_streaming": False,
                    "supports_functions": False,
                    "context_window": 4096,
                },
                pricing={"input_per_1k": 0.0, "output_per_1k": 0.0},
            ),
        ]

    def resolve_model(
        self, unified_name: str, preferred_provider: Optional[str] = None
    ) -> Dict[str, str]:
        """
        Resolve a unified model name to a specific provider and model ID.
        """
        mapping = next(
            (m for m in self.mappings if m.model_name == unified_name), None)

        if not mapping:
            # Fallback: treat unified_name as actual model name if no mapping
            # found
            return {
                "provider": preferred_provider or "openai",
                "model": unified_name}

        # If preferred provider is in equivalents (checking loosely by provider name matching conventions)
        # In reality, equivalents would be structured as {provider: model_id}
        # For this simulation/schema "equivalent_models" is a list of strings like ["gpt-3.5-turbo", ...]
        # Simple heuristic mapping for demo:

        target_provider = mapping.provider  # Default to primary
        # Default to primary model ID
        target_model = mapping.equivalent_models[0]

        if preferred_provider:
            # Try to find a model from that provider in the list
            # This is a bit fuzzy with the current simplified model, but
            # sufficient for V1 demo
            if preferred_provider == "anthropic" and "claude" in "".join(
                mapping.equivalent_models
            ):
                target_provider = "anthropic"
                target_model = next(
                    (m for m in mapping.equivalent_models if "claude" in m), None)
            elif preferred_provider == "together" and "llama" in "".join(
                mapping.equivalent_models
            ):
                target_provider = "together"
                target_model = next(
                    (m for m in mapping.equivalent_models if "llama" in m), None)

        return {
            "unified_name": unified_name,
            "provider": target_provider,
            "actual_model": target_model,
            "pricing": mapping.pricing,
        }

    def get_capabilities(self, unified_name: str) -> Dict[str, Any]:
        """
        Get capabilities for a unified model.
        """
        mapping = next(
            (m for m in self.mappings if m.model_name == unified_name), None)
        return mapping.capabilities if mapping else {}

    def list_mappings(self) -> List[Dict[str, Any]]:
        """
        Get all model mappings.
        """
        # Convert to dict format for JSON serialization
        result = []
        for mapping in self.mappings:
            result.append(
                {
                    "id": mapping.id,
                    "model_name": mapping.model_name,
                    "provider": mapping.provider,
                    "equivalent_models": mapping.equivalent_models,
                    "capabilities": mapping.capabilities,
                    "pricing": mapping.pricing,
                }
            )
        return result
