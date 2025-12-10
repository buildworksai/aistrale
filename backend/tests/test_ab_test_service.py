import pytest
from backend.services.ab_test_service import ABTestService

@pytest.mark.asyncio
async def test_start_test():
    service = ABTestService()
    test = await service.start_test("Test 1", "Hello", ["openai", "anthropic"])
    
    assert test.status == "completed"
    assert test.name == "Test 1"
    assert len(test.providers) == 2

def test_get_results_analysis():
    service = ABTestService()
    # Mock data inside get_results is:
    # OpenAI: 500ms, 0.9 quality
    # Anthropic: 1000ms, 0.95 quality
    
    analysis = service.get_results(1)
    
    # Fastest should be OpenAI (500 < 1000)
    assert analysis["fastest_provider"] == "openai"
    
    # Best quality should be Anthropic (0.95 > 0.9)
    assert analysis["best_quality_provider"] == "anthropic"
