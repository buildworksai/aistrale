import logging
import random
from datetime import datetime
from typing import List, Dict
from models.multi_provider import ProviderHealth

logger = logging.getLogger(__name__)

class HealthService:
    """
    Service to monitor provider health.
    In a real system, this would make active ping/inference requests or check status pages.
    """

    def __init__(self):
        # Simulation: store in-memory health stats
        self._health_cache: Dict[str, ProviderHealth] = {}
        self.providers = ["openai", "anthropic", "together", "google", "mistral"]

    def check_health(self, provider: str) -> ProviderHealth:
        """
        Perform a health check on a specific provider.
        """
        # Simulation: Randomize health
        # 90% chance healthy, 5% degraded, 5% down
        r = random.random()
        status = "healthy"
        latency = random.uniform(200, 800)
        error_rate = 0.0
        
        if r > 0.95:
            status = "down"
            error_rate = 1.0
        elif r > 0.90:
            status = "degraded"
            latency = random.uniform(1000, 3000)
            error_rate = 0.1

        uptime = 99.9 if status == "healthy" else 99.5

        health = ProviderHealth(
            provider=provider,
            status=status,
            avg_latency_ms=latency,
            error_rate=error_rate,
            uptime_percentage=uptime,
            last_check=datetime.utcnow()
        )
        self._health_cache[provider] = health
        logger.info(f"Health check for {provider}: {status}")
        return health

    def monitor_all(self) -> List[ProviderHealth]:
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
