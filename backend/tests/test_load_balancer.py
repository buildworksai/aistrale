from collections import Counter
from services.load_balancer_service import LoadBalancerService


def test_round_robin():
    service = LoadBalancerService()
    # "fallback" rule is round-robin with [anthropic, together]

    p1 = service.select_provider("fallback")
    p2 = service.select_provider("fallback")
    p3 = service.select_provider("fallback")

    assert p1 == "anthropic"
    assert p2 == "together"
    assert p3 == "anthropic"  # Cycles back


def test_weighted_distribution():
    service = LoadBalancerService()
    # "default" is weighted: openai 80, anthropic 10, together 10

    # Run 1000 times
    selections = [service.select_provider("default") for _ in range(1000)]
    counts = Counter(selections)

    # OpenAI should be roughly 80% (800)
    assert 750 < counts["openai"] < 850
    # Anthropic ~10% (100)
    assert 50 < counts["anthropic"] < 150
