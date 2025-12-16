import logging
import random
from datetime import datetime
from typing import List, Dict, Any
from models.multi_provider import ABTest, ABTestResult

logger = logging.getLogger(__name__)


class ABTestService:
    """
    Service to execute and analyze A/B tests across multiple providers.
    """

    async def start_test(
            self,
            name: str,
            prompt: str,
            providers: List[str]) -> ABTest:
        """
        Create and start a new A/B test.
        In reality, this would likely queue a background job.
        For simulation, we'll execute immediately.
        """
        test = ABTest(
            name=name,
            prompt=prompt,
            providers=providers,
            status="running")
        # Save to DB (mock)
        test.id = random.randint(1, 1000)

        results = await self._run_test_execution(test)
        test.status = "completed"

        return test

    async def _run_test_execution(self, test: ABTest) -> List[ABTestResult]:
        """
        Execute the prompt against all configured providers.
        """
        results = []
        for provider in test.providers:
            # Simulate execution
            latency = random.uniform(200, 1500)
            result = ABTestResult(
                ab_test_id=test.id,
                provider=provider,
                response=f"Response from {provider} for '{test.prompt}'",
                latency_ms=latency,
                cost=0.01 * (latency / 1000),  # Dummy cost logic
                quality_score=random.uniform(0.7, 1.0),
            )
            results.append(result)
        return results

    def list_tests(self) -> List[ABTest]:
        """
        List all A/B tests.
        """
        # Mock: Return empty list or sample tests
        return []

    def get_results(self, test_id: int) -> Dict[str, Any]:
        """
        Analyze results of a completed test.
        """
        # Mock retrieval of results
        # In reality, fetch ABTestResult where ab_test_id=test_id

        # Simulating data for test_id 1
        results = [
            ABTestResult(
                ab_test_id=test_id,
                provider="openai",
                response="A",
                latency_ms=500,
                cost=0.02,
                quality_score=0.9,
            ),
            ABTestResult(
                ab_test_id=test_id,
                provider="anthropic",
                response="B",
                latency_ms=1000,
                cost=0.01,
                quality_score=0.95,
            ),
        ]

        best_quality = max(results, key=lambda r: r.quality_score)
        fastest = min(results, key=lambda r: r.latency_ms)

        return {
            "test": {
                "id": test_id,
                "name": "Sample Test",
                "prompt": "Test prompt",
                "providers": ["openai", "anthropic"],
                "status": "completed",
                "created_at": datetime.utcnow().isoformat(),
            },
            "results": results,
            "fastest_provider": fastest.provider,
            "best_quality_provider": best_quality.provider,
            "statistics": {
                "openai": {
                    "avg_latency": 500,
                    "avg_cost": 0.02,
                    "avg_quality": 0.9,
                    "total_responses": 1,
                },
                "anthropic": {
                    "avg_latency": 1000,
                    "avg_cost": 0.01,
                    "avg_quality": 0.95,
                    "total_responses": 1,
                },
            },
        }
