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
                model_name="smart-fast",
                provider="openai",
                equivalent_models=["gpt-3.5-turbo", "claude-instant-1", "llama-2-70b"],
                capabilities={"context_window": 16000, "streaming": True},
                pricing={"input": 0.0015, "output": 0.002}
            ),
             ModelMapping(
                model_name="reasoning-heavy",
                provider="openai",
                equivalent_models=["gpt-4", "claude-2"],
                capabilities={"context_window": 32000, "streaming": True},
                pricing={"input": 0.03, "output": 0.06}
            ),
        ]

    def resolve_model(self, unified_name: str, preferred_provider: Optional[str] = None) -> Dict[str, str]:
        """
        Resolve a unified model name to a specific provider and model ID.
        """
        mapping = next((m for m in self.mappings if m.model_name == unified_name), None)
        
        if not mapping:
             # Fallback: treat unified_name as actual model name if no mapping found
            return {"provider": preferred_provider or "openai", "model": unified_name}

        # If preferred provider is in equivalents (checking loosely by provider name matching conventions)
        # In reality, equivalents would be structured as {provider: model_id}
        # For this simulation/schema "equivalent_models" is a list of strings like ["gpt-3.5-turbo", ...]
        # Simple heuristic mapping for demo:
        
        target_provider = mapping.provider # Default to primary
        target_model = mapping.equivalent_models[0] # Default to primary model ID
        
        if preferred_provider:
             # Try to find a model from that provider in the list
             # This is a bit fuzzy with the current simplified model, but sufficient for V1 demo
             if preferred_provider == "anthropic" and "claude" in "".join(mapping.equivalent_models):
                 target_provider = "anthropic"
                 target_model = next((m for m in mapping.equivalent_models if "claude" in m), None)
             elif preferred_provider == "together" and "llama" in "".join(mapping.equivalent_models):
                 target_provider = "together"
                 target_model = next((m for m in mapping.equivalent_models if "llama" in m), None)

        return {
            "unified_name": unified_name,
            "provider": target_provider,
            "actual_model": target_model,
            "pricing": mapping.pricing
        }

    def get_capabilities(self, unified_name: str) -> Dict[str, Any]:
        """
        Get capabilities for a unified model.
        """
        mapping = next((m for m in self.mappings if m.model_name == unified_name), None)
        return mapping.capabilities if mapping else {}
