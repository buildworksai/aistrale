import logging
import random
from datetime import datetime

from models.multi_provider import ProviderHealth

logger = logging.getLogger(__name__)

PROBABILITY_DOWN_THRESHOLD = 0.95
PROBABILITY_DEGRADED_THRESHOLD = 0.90
LATENCY_HEALTHY_MIN_MS = 200
LATENCY_HEALTHY_MAX_MS = 800
LATENCY_DEGRADED_MIN_MS = 1000
LATENCY_DEGRADED_MAX_MS = 3000


class HealthService:
    """
    Service to monitor provider health.
    In a real system, this would make active ping/inference requests or check status
    pages.
    """

    def __init__(self):
        # Simulation: store in-memory health stats
        self._health_cache: dict[str, ProviderHealth] = {}
        self.providers = [
            "openai",
            "anthropic",
            "together",
            "google",
            "mistral"]

    def check_health(self, provider: str) -> ProviderHealth:
        """
        Perform a health check on a specific provider.
        """
        # Simulation: Randomize health
        # 90% chance healthy, 5% degraded, 5% down
        r = random.random()
        status = "healthy"
        latency = random.uniform(LATENCY_HEALTHY_MIN_MS, LATENCY_HEALTHY_MAX_MS)
        error_rate = 0.0

        if r > PROBABILITY_DOWN_THRESHOLD:
            status = "down"
            error_rate = 1.0
        elif r > PROBABILITY_DEGRADED_THRESHOLD:
            status = "degraded"
            latency = random.uniform(LATENCY_DEGRADED_MIN_MS, LATENCY_DEGRADED_MAX_MS)
            error_rate = 0.1

        uptime = 99.9 if status == "healthy" else 99.5

        health = ProviderHealth(
            provider=provider,
            status=status,
            avg_latency_ms=latency,
            error_rate=error_rate,
            uptime_percentage=uptime,
            last_check=datetime.utcnow(),
        )
        self._health_cache[provider] = health
        logger.info(f"Health check for {provider}: {status}")
        return health

    def monitor_all(self) -> list[ProviderHealth]:
        """
        Check health for all configured providers.
        """
        results = []
        for p in self.providers:
            results.append(self.check_health(p))
        return results

    def get_latest_health(self, provider: str) -> ProviderHealth:
        """
        Get cached health status.
        """
        return self._health_cache.get(provider)
