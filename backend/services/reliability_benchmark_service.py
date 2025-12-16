import logging
import statistics
from typing import List
from datetime import datetime
from models.reliability import PerformanceBenchmark

logger = logging.getLogger(__name__)


class ReliabilityBenchmarkService:
    """
    Manages performance baselines and tracks degradation.
    Distinct from Cost's BenchmarkService which compares to industry standards;
    this service compares against INTERNAL baselines.
    """

    def __init__(self):
        # Simulation: Store benchmarks in memory
        self._benchmarks = [
            PerformanceBenchmark(
                benchmark_name="p99_latency_chat",
                provider="openai",
                metric="latency_ms",
                value=500.0,
                baseline_value=450.0,
                benchmark_date=datetime.utcnow(),
            )
        ]

    def record_metric(self, provider: str, metric: str, value: float):
        """
        Record a new metric observation.
        In production, this would go to Prometheus.
        Here we just log and check against baseline.
        """
        # Find baseline
        baseline = next(
            (
                b
                for b in self._benchmarks
                if b.provider == provider and b.metric == metric
            ),
            None,
        )

        if baseline:
            deviation = (
                (value - baseline.baseline_value) / baseline.baseline_value
            ) * 100
            if deviation > 20:  # 20% degradation threshold
                logger.warning(
                    f"PERFORMANCE ALERT: {provider} {metric} is {value}, {deviation:.1f}% worse than baseline {baseline.baseline_value}"
                )

    def get_benchmarks(self, provider: str) -> List[PerformanceBenchmark]:
        return [b for b in self._benchmarks if b.provider == provider]

    def update_baseline(
            self,
            provider: str,
            metric: str,
            new_values: List[float]):
        """
        Update the baseline using recent data.
        """
        avg = statistics.mean(new_values)
        baseline = next(
            (
                b
                for b in self._benchmarks
                if b.provider == provider and b.metric == metric
            ),
            None,
        )

        if baseline:
            baseline.baseline_value = avg
            baseline.value = avg  # Update current observation too
            baseline.benchmark_date = datetime.utcnow()
            logger.info(f"Updated baseline for {provider} {metric} to {avg}")
        else:
            self._benchmarks.append(
                PerformanceBenchmark(
                    benchmark_name=f"auto_{metric}",
                    provider=provider,
                    metric=metric,
                    value=avg,
                    baseline_value=avg,
                    benchmark_date=datetime.utcnow(),
                )
            )
