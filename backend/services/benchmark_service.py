import logging
from typing import Any

from models.cost_optimization import Benchmark

logger = logging.getLogger(__name__)

PERCENTILE_MEDIAN = 50
DIFF_PERCENT_HIGH = 10
DIFF_PERCENT_LOW = -10


class BenchmarkService:
    """
    Service to compare workspace metrics against industry benchmarks.
    """

    def __init__(self):
        # Simulation: Load mock benchmark data
        self.benchmarks = [
            Benchmark(
                metric="avg_cost_per_token", value=0.002, percentile=50, industry="tech"
            ),
            Benchmark(
                metric="avg_cost_per_token", value=0.001, percentile=25, industry="tech"
            ),  # Lower is better? or just distribution. Lower cost = better percentile usually reversed in cost.
            # Let's say percentile 25 means "cheaper than 75% of companies" (good) or "25th percentile of cost distribution" (cheap).
            # Usually strict percentile: 0.001 is 25th percentile value.
            Benchmark(metric="latency_ms", value=500, percentile=50, industry="tech"),
        ]

    def get_benchmark(
        self, metric: str, industry: str = "tech", percentile: int = 50
    ) -> Benchmark | None:
        """
        Retrieve specific benchmark.
        """
        return next(
            (
                b
                for b in self.benchmarks
                if b.metric == metric
                and b.industry == industry
                and b.percentile == percentile
            ),
            None,
        )

    def compare_to_industry(
        self, metric: str, user_value: float, industry: str = "tech"
    ) -> dict[str, Any]:
        """
        Compare user value to industry benchmarks.
        Returns context about standing.
        """
        relevant = [b for b in self.benchmarks if b.metric ==
                    metric and b.industry == industry]
        if not relevant:
            return {
                "status": "unknown",
                "message": "No benchmark data available"}

        # Find closest percentile
        closest = min(relevant, key=lambda b: abs(b.value - user_value))

        # Simple comparison against median (50th)
        median = next((b for b in relevant if b.percentile == PERCENTILE_MEDIAN), None)

        comparison = "avg"
        diff_pct = 0.0

        if median:
            diff_pct = ((user_value - median.value) / median.value) * 100
            if diff_pct > DIFF_PERCENT_HIGH:
                comparison = "higher"
            elif diff_pct < DIFF_PERCENT_LOW:
                comparison = "lower"
            else:
                comparison = "average"

        return {
            "user_value": user_value,
            "industry_median": median.value if median else None,
            "percentile_approx": closest.percentile,  # Very rough approx
            "comparison": comparison,
            "diff_percent": round(diff_pct, 1),
        }
