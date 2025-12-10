import pytest
from backend.services.queue_service import QueueService

@pytest.mark.asyncio
async def test_enqueue_dequeue_priority():
    service = QueueService()
    
    # Add normal priority
    r1 = await service.enqueue({"task": "normal"}, priority=1)
    
    # Add high priority
    r2 = await service.enqueue({"task": "high"}, priority=0)
    
    # Add low priority
    r3 = await service.enqueue({"task": "low"}, priority=2)
    
    # Should dequeue high priority first
    d1 = await service.dequeue()
    assert d1.id == r2.id
    assert d1.request_data["task"] == "high"
    
    # Then normal
    d2 = await service.dequeue()
    assert d2.id == r1.id
    
    # Then low
    d3 = await service.dequeue()
    assert d3.id == r3.id

@pytest.mark.asyncio
async def test_complete():
    service = QueueService()
    r1 = await service.enqueue({"task": "test"})
    
    await service.complete(r1.id)
    assert r1.status == "completed"
    assert r1.processed_at is not None
