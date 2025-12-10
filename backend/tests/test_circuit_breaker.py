import pytest
from datetime import datetime, timedelta
from backend.services.circuit_breaker_service import CircuitBreakerService

def test_circuit_trips():
    service = CircuitBreakerService(failure_threshold=3)
    provider = "test-provider"
    
    # 3 failures to trip
    service.record_failure(provider)
    assert service.is_open(provider) is False
    
    service.record_failure(provider)
    assert service.is_open(provider) is False
    
    service.record_failure(provider)
    assert service.is_open(provider) is True

def test_circuit_recovery():
    service = CircuitBreakerService(failure_threshold=1, recovery_timeout_sec=1)
    provider = "test-provider"
    
    # Trip it
    service.record_failure(provider)
    assert service.is_open(provider) is True
    
    # Wait for recovery timeout (mocking time by manipulating opened_at)
    breaker = service.get_breaker(provider)
    breaker.opened_at = datetime.utcnow() - timedelta(seconds=2)
    
    # Should move to half-open
    assert service.is_open(provider) is False
    assert breaker.state == "half-open"
    
    # Success closes it
    service.record_success(provider)
    assert breaker.state == "closed"
    assert breaker.failure_count == 0

def test_half_open_failure():
    service = CircuitBreakerService(failure_threshold=1, recovery_timeout_sec=1)
    provider = "test-provider"
    
    # Trip and recover to half-open
    service.record_failure(provider)
    breaker = service.get_breaker(provider)
    breaker.opened_at = datetime.utcnow() - timedelta(seconds=2)
    service.is_open(provider) # Trigger check to move to half-open
    assert breaker.state == "half-open"
    
    # Failure immediately re-opens
    service.record_failure(provider)
    assert breaker.state == "open"
    assert service.is_open(provider) is True
