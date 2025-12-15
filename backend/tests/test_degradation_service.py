import pytest
from services.degradation_service import DegradationService

def test_activate_strategy():
    service = DegradationService()
    
    # Simulate high error rate for OpenAI
    service.check_conditions({"provider": "openai", "error_rate": 0.6})
    
    # Should activate
    assert "openai" in service.active_degradations
    
    # Check fallback handling
    actions = service.get_fallback_handling("openai")
    assert actions["fallback_provider"] == "anthropic"

def test_execute_fallback():
    service = DegradationService()
    service.check_conditions({"provider": "openai", "error_rate": 0.6})
    
    result = service.execute_fallback("openai", "hello")
    assert result["action"] == "reroute"
    assert result["target"] == "anthropic"

def test_no_degradation():
    service = DegradationService()
    # Low error rate
    service.check_conditions({"provider": "openai", "error_rate": 0.1})
    
    assert "openai" not in service.active_degradations
    assert service.execute_fallback("openai", "hello") is None
