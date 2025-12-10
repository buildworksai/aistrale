import pytest
from unittest.mock import patch
from backend.services.health_service import HealthService

def test_check_health_structure():
    service = HealthService()
    health = service.check_health("openai")
    
    assert health.provider == "openai"
    assert health.status in ["healthy", "degraded", "down"]
    assert health.avg_latency_ms > 0

def test_monitor_all():
    service = HealthService()
    results = service.monitor_all()
    
    assert len(results) == 5
    assert all(h.provider in service.providers for h in results)

def test_get_latest_health():
    service = HealthService()
    service.check_health("anthropic")
    
    cached = service.get_latest_health("anthropic")
    assert cached is not None
    assert cached.provider == "anthropic"
