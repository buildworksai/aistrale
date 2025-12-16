from services.quality_service import QualityScoringService
from models.cost_optimization import ProviderPerformance


def test_calculate_quality_score():
    service = QualityScoringService()

    # Feedback 5 stars -> 1.0
    assert service.calculate_quality_score("foo", user_feedback=5) == 1.0
    # Feedback 1 star -> 0.0
    assert service.calculate_quality_score("bar", user_feedback=1) == 0.0
    # Feedback 3 stars -> 0.5
    assert service.calculate_quality_score("baz", user_feedback=3) == 0.5

    # Heuristic (len 100 / 500 = 0.2)
    text = "a" * 100
    assert service.calculate_quality_score(text) == 0.2


def test_analyze_tradeoff():
    service = QualityScoringService()

    p1 = ProviderPerformance(
        provider="cheap",
        model="v1",
        quality_score=0.85,
        avg_cost_per_1k_tokens=0.01)
    p2 = ProviderPerformance(
        provider="expensive",
        model="v2",
        quality_score=0.95,
        avg_cost_per_1k_tokens=0.10,
    )
    p3 = ProviderPerformance(
        provider="bad",
        model="v3",
        quality_score=0.50,
        avg_cost_per_1k_tokens=0.005)

    providers = [p1, p2, p3]

    analysis = service.analyze_tradeoff(providers, min_quality=0.8)

    assert analysis["best_quality"]["provider"] == "expensive"
    # 0.85 > 0.8 and much cheaper
    assert analysis["best_value"]["provider"] == "cheap"

    # Recommendation should favor value because cheap is 10x cheaper (0.01 vs
    # 0.10) which is < 0.5 * 0.10
    assert analysis["recommendation"] == "cheap"
