import logging
import random

from models.reliability import LoadBalanceRule

logger = logging.getLogger(__name__)


class LoadBalancerService:
    """
    Distributes requests across providers.
    """

    def __init__(self):
        # Simulation: In-memory counters for round-robin
        self._counters: dict[str, int] = {}

        # Mock Rule
        self.rules = {
            "default": LoadBalanceRule(
                name="default",
                algorithm="weighted",
                providers=["openai", "anthropic", "together"],
                weights={"openai": 80, "anthropic": 10, "together": 10},
                enabled=True,
            ),
            "fallback": LoadBalanceRule(
                name="fallback",
                algorithm="round-robin",
                providers=["anthropic", "together"],
                enabled=True,
            ),
        }

    def select_provider(self, rule_name: str = "default") -> str:
        """
        Select a provider based on the named rule.
        """
        rule = self.rules.get(rule_name)
        if not rule or not rule.enabled:
            # Fallback default logic if no rule
            return "openai"

        if rule.algorithm == "round-robin":
            return self._round_robin(rule.name, rule.providers)
        elif rule.algorithm == "weighted":
            return self._weighted(rule.providers, rule.weights)

        return rule.providers[0]

    def _round_robin(self, key: str, providers: list[str]) -> str:
        idx = self._counters.get(key, 0)
        provider = providers[idx % len(providers)]
        self._counters[key] = idx + 1
        return provider

    def _weighted(self, providers: list[str], weights: dict[str, int]) -> str:
        # Create weighted pool (simple list expansion)
        # Optimziation: Use cumulative weights for binary search if pool is
        # huge
        pool = []
        for p in providers:
            w = weights.get(p, 1)
            pool.extend([p] * w)
        return random.choice(pool)
