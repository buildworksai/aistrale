import pytest
from services.comparison_service import ComparisonService

def test_compare_providers_latency():
    service = ComparisonService()
    # OpenAI (500ms) vs Together (200ms)
    # Winner should be Together (lower is better)
    res = service.compare_providers("openai", "together", "avg_latency_ms")
    
    assert res["winner"] == "together"
    assert res["value1"] == 500
    assert res["value2"] == 200

def test_compare_providers_quality():
    service = ComparisonService()
    # OpenAI (0.95) vs Anthropic (0.92)
    # Winner should be OpenAI (higher is better)
    res = service.compare_providers("openai", "anthropic", "quality")
    
    assert res["winner"] == "openai"

def test_generate_ranking():
    service = ComparisonService()
    ranking = service.generate_ranking("quality")
    
    # Expect OpenAI first
    assert ranking[0]["provider"] == "openai"
    assert ranking[0]["rank"] == 1
    
    # Expect Together last or near last
    assert ranking[-1]["score"] < ranking[0]["score"]
