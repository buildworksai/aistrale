import pytest
from unittest.mock import MagicMock, AsyncMock, patch
from backend.services.failover_service import FailoverService
from backend.models.multi_provider import ProviderHealth

@pytest.fixture
def health_service_mock():
    mock = MagicMock()
    # By default, everyone is healthy
    mock.get_latest_health.return_value = ProviderHealth(provider="openai", status="healthy")
    return mock

@pytest.mark.asyncio
async def test_execution_success_primary(health_service_mock):
    service = FailoverService(health_service_mock)
    
    # Mock simulate to succeed immediately
    service._simulate_inference = AsyncMock(return_value="Success")
    
    result = await service.execute_with_failover("chat", "hello")
    assert result["status"] == "success"
    assert result["provider"] == "openai"

@pytest.mark.asyncio
async def test_failover_to_secondary(health_service_mock):
    service = FailoverService(health_service_mock)
    
    # Mock simulate to fail first, then succeed
    async def side_effect(provider):
        if provider == "openai":
            raise Exception("Fail")
        return "Success from Anthropic"
        
    service._simulate_inference = AsyncMock(side_effect=side_effect)
    
    result = await service.execute_with_failover("chat", "hello")
    assert result["status"] == "success"
    assert result["provider"] == "anthropic"
    assert result["attempts"] == 2

@pytest.mark.asyncio
async def test_skip_down_provider(health_service_mock):
    # Mock primary as DOWN
    health_service_mock.get_latest_health.side_effect = lambda p: ProviderHealth(provider=p, status="down") if p == "openai" else ProviderHealth(provider=p, status="healthy")
    
    service = FailoverService(health_service_mock)
    service._simulate_inference = AsyncMock(return_value="Success")
    
    result = await service.execute_with_failover("chat", "hello")
    # Should flip to anthropic because openai was skipped
    assert result["provider"] == "anthropic"
