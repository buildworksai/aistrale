import pytest
from services.model_abstraction_service import ModelAbstractionService

def test_resolve_default():
    service = ModelAbstractionService()
    # Should resolve to default provider (Configured as OpenAI/gpt-3.5-turbo)
    result = service.resolve_model("smart-fast")
    
    assert result["provider"] == "openai"
    assert result["actual_model"] == "gpt-3.5-turbo"

def test_resolve_preferred_provider():
    service = ModelAbstractionService()
    # Request "smart-fast" but prefer Anthropic
    result = service.resolve_model("smart-fast", preferred_provider="anthropic")
    
    assert result["provider"] == "anthropic"
    assert "claude" in result["actual_model"]

def test_resolve_unknown():
    service = ModelAbstractionService()
    # Pass through unknown names
    result = service.resolve_model("custom-finetune-v1")
    
    assert result["model"] == "custom-finetune-v1"
    assert result["provider"] == "openai" # Default fallback
