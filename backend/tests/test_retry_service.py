import pytest
import asyncio
from backend.services.retry_service import RetryService

@pytest.mark.asyncio
async def test_retry_success():
    service = RetryService()
    
    # Mock function that succeeds immediately
    async def success_func():
        return "success"
        
    result = await service.execute_with_retry(success_func)
    assert result == "success"

@pytest.mark.asyncio
async def test_retry_eventual_success():
    service = RetryService()
    
    # Mock fail then succeed
    attempts = 0
    async def flaky_func():
        nonlocal attempts
        attempts += 1
        if attempts < 2:
            raise Exception("Fail")
        return "success"
        
    result = await service.execute_with_retry(flaky_func)
    assert result == "success"
    assert attempts == 2

@pytest.mark.asyncio
async def test_retry_exhaustion():
    service = RetryService()
    
    # Always fail
    async def fail_func():
        raise Exception("Fatal")
        
    with pytest.raises(Exception) as exc:
        await service.execute_with_retry(fail_func)
    assert "Fatal" in str(exc.value)
