import logging
from typing import Any

logger = logging.getLogger(__name__)


class ComparisonService:
    """
    Service to compare provider performance metrics side-by-side.
    """

    def compare_providers(
        self, provider1: str, provider2: str, metric: str
    ) -> dict[str, Any]:
        """
        Compare two providers on a specific metric (e.g., 'avg_latency_ms',
        'cost_per_1k').
        """
        # Simulation: In real app, query historical data
        # Here we mock some data
        data = {
            "openai": {
                "avg_latency_ms": 500,
                "cost_per_1k": 0.03,
                "quality": 0.95},
            "anthropic": {
                "avg_latency_ms": 1200,
                "cost_per_1k": 0.01,
                "quality": 0.92},
            "together": {
                "avg_latency_ms": 200,
                "cost_per_1k": 0.001,
                "quality": 0.85},
        }

        v1 = data.get(provider1, {}).get(metric, 0)
        v2 = data.get(provider2, {}).get(metric, 0)

        if metric == "quality":
            winner = provider1 if v1 > v2 else provider2
        else:
            # Lower is better for latency/cost
            winner = provider1 if v1 < v2 else provider2

        diff = abs(v1 - v2)
        diff_pct = (diff / max(v1, v2) * 100) if max(v1, v2) > 0 else 0

        return {
            "provider1": provider1,
            "provider2": provider2,
            "metric": metric,
            "value1": v1,
            "value2": v2,
            "winner": winner,
            "diff_percent": round(diff_pct, 1),
        }

    def generate_ranking(
            self, metric: str = "quality") -> list[dict[str, Any]]:
        """
        Rank all providers by a metric.
        """
        data = {
            "openai": {"quality": 0.95},
            "anthropic": {"quality": 0.92},
            "together": {"quality": 0.85},
            "google": {"quality": 0.90},
        }

        ranked = sorted(
            data.items(), key=lambda item: item[1].get(metric, 0), reverse=True
        )
        return [
            {"rank": i + 1, "provider": k, "score": v.get(metric)}
            for i, (k, v) in enumerate(ranked)
        ]
