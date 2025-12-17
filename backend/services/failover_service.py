import logging
import random
from typing import Any

from models.multi_provider import FailoverConfig
from services.health_service import HealthService

logger = logging.getLogger(__name__)

SIMULATED_FAILURE_PROBABILITY = 0.5


class FailoverService:
    """
    Service to handle automatic provider failover during inference.
    """

    def __init__(self, health_service: HealthService):
        self.health_service = health_service
        # Simulation: In-memory config
        self.config = FailoverConfig(
            workspace_id=1,
            primary_provider="openai",
            fallback_providers=["anthropic", "together"],
            failover_conditions={"latency_ms": 2000, "retry_count": 2},
            enabled=True,
        )

    async def execute_with_failover(
            self, task: str, prompt: str) -> dict[str, Any]:
        """
        Execute an inference task with automatic failover logic.
        """
        providers = [
            self.config.primary_provider,
            *self.config.fallback_providers,
        ]
        errors = []

        for provider in providers:
            # Check health first
            health = self.health_service.get_latest_health(provider)
            if health and health.status == "down":
                logger.warning(
                    f"Skipping {provider} because it is marked DOWN.")
                continue

            try:
                # Simulation: Call provider
                response = await self._simulate_inference(provider)
                return {
                    "provider": provider,
                    "response": response,
                    "status": "success",
                    "attempts": len(errors) + 1,
                }
            except Exception as e:
                logger.error(f"Provider {provider} failed: {e}")
                errors.append({"provider": provider, "error": str(e)})

        # If we get here, all failed
        logger.critical("All providers failed.")
        return {"status": "failed", "errors": errors}

    async def _simulate_inference(self, provider: str) -> str:
        """
        Simulate an inference call.
        """
        # Force fail random providers for testing logic
        # For unit testing stability, we might need to mock this method
        # interaction instead
        if provider == "openai":
            # Simulate generic failure
            if random.random() > SIMULATED_FAILURE_PROBABILITY:
                raise Exception("Connection timeout")

        return f"Response from {provider}"
