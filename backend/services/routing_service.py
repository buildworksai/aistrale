import logging
from typing import Dict
from models.cost_optimization import ProviderPerformance, RoutingRule

logger = logging.getLogger(__name__)


class RoutingService:
    """
    Service to route AI tasks to the best provider based on cost, latency, and quality.
    """

    def __init__(self):
        # Simulation: Load mock data
        self.performances = [
            ProviderPerformance(
                provider="openai",
                model="gpt-4",
                avg_cost_per_1k_tokens=0.03,
                avg_latency_ms=1000,
                quality_score=0.95,
            ),
            ProviderPerformance(
                provider="openai",
                model="gpt-3.5-turbo",
                avg_cost_per_1k_tokens=0.002,
                avg_latency_ms=500,
                quality_score=0.85,
            ),
            ProviderPerformance(
                provider="anthropic",
                model="claude-2",
                avg_cost_per_1k_tokens=0.01,
                avg_latency_ms=2000,
                quality_score=0.92,
            ),
            ProviderPerformance(
                provider="together",
                model="llama-2-70b",
                avg_cost_per_1k_tokens=0.0009,
                avg_latency_ms=300,
                quality_score=0.80,
            ),
        ]

        self.rules = [
            RoutingRule(
                name="Cheap Chat",
                strategy="cheapest",
                task_type="chat",
                quality_threshold=0.8,
            ),
            RoutingRule(
                name="High Quality Code",
                strategy="quality",
                task_type="code_generation",
                quality_threshold=0.9,
            ),
        ]

    def route_request(self,
                      task_type: str,
                      quality_req: float = 0.0,
                      latency_req_ms: int = None) -> Dict[str,
                                                          str]:
        """
        Determines the best provider/model for the given requirements.
        Returns dict with "provider" and "model".
        """
        logger.info(
            f"Routing request for task={task_type} quality>={quality_req}")

        candidates = self.performances[:]

        # 1. Filter by specific rule for task type if exists
        rule = next((r for r in self.rules if r.task_type ==
                     task_type and r.enabled), None)

        strategy = "balanced"
        if rule:
            strategy = rule.strategy
            quality_req = max(quality_req, rule.quality_threshold)
            logger.debug(
                f"Applied rule '{rule.name}' with strategy '{strategy}'")

        # 2. Filter by constraints
        candidates = [p for p in candidates if p.quality_score >= quality_req]
        if latency_req_ms:
            candidates = [
                p for p in candidates if p.avg_latency_ms <= latency_req_ms]

        if not candidates:
            # Fallback to safest high quality if filtering removed everything, or throw
            # For resilience, return the "best" available generally or the
            # first one
            logger.warning(
                "No candidates matched requirements. Returning default.")
            return {"provider": "openai", "model": "gpt-3.5-turbo"}

        # 3. Apply Strategy
        if strategy == "cheapest":
            best = min(candidates, key=lambda p: p.avg_cost_per_1k_tokens)
        elif strategy == "fastest":
            best = min(candidates, key=lambda p: p.avg_latency_ms)
        elif strategy == "quality":
            best = max(candidates, key=lambda p: p.quality_score)
        else:  # balanced (heuristic: quality / cost)
            # avoid div by zero
            best = max(candidates, key=lambda p: p.quality_score /
                       (p.avg_cost_per_1k_tokens + 1e-6), )

        return {"provider": best.provider, "model": best.model}
