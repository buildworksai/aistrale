import logging
from typing import Any

from models.reliability import DegradationStrategy

logger = logging.getLogger(__name__)

OPENAI_OUTAGE_ERROR_RATE_THRESHOLD = 0.5


class DegradationService:
    """
    Handles graceful degradation when providers fail.
    """

    def __init__(self):
        # Simulation: Define some strategies
        self.strategies = {
            "openai_outage": DegradationStrategy(
                name="openai_outage",
                trigger_conditions={
                    "provider": "openai",
                    "error_rate": 0.5},
                actions={
                    "fallback_provider": "anthropic",
                    "cache_only": False},
                enabled=True,
            ),
            "global_outage": DegradationStrategy(
                name="global_outage",
                trigger_conditions={
                    "global_error_rate": 0.8},
                actions={
                    "mode": "offline_mode",
                    "static_response": True},
                enabled=True,
            ),
        }
        self.active_degradations = {}

    def check_conditions(self, context: dict[str, Any]):
        """
        Check if any degradation strategy should be activated.
        """
        provider = context.get("provider")
        error_rate = context.get("error_rate", 0)

        # Simple check for openai outage simulation
        if provider == "openai" and error_rate > OPENAI_OUTAGE_ERROR_RATE_THRESHOLD:
            strategy = self.strategies.get("openai_outage")
            if strategy and strategy.enabled:
                self.active_degradations["openai"] = strategy
                logger.warning(
                    f"Activated degradation strategy: {strategy.name}")

    def get_fallback_handling(self, provider: str) -> dict[str, Any] | None:
        """
        Get fallback actions if degradation applies.
        """
        strategy = self.active_degradations.get(provider)
        if strategy:
            return strategy.actions
        return None

    def execute_fallback(self, provider: str, prompt: str) -> dict[str, Any]:
        """
        Execute fallback logic explicitly.
        """
        actions = self.get_fallback_handling(provider)
        if not actions:
            return None

        if "fallback_provider" in actions:
            # In real system, would call that provider. Here we return
            # instruction.
            return {
                "action": "reroute",
                "target": actions["fallback_provider"],
                "reason": "Degradation active",
            }
        elif actions.get("static_response"):
            return {
                "action": "static",
                "content": (
                    "System maintains limited functionality. Please try again later."
                ),
            }
        return None
