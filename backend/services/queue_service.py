import logging
import asyncio
from typing import Dict, Any, Optional
from datetime import datetime
from models.reliability import RequestQueue

logger = logging.getLogger(__name__)

class QueueService:
    """
    Simulation of a Redis-backed request queue using in-memory list.
    """
    
    def __init__(self):
        # Simulated persistence
        self._queue = [] 
        self._db_mirror = {} # Dictionary simulation of DB for ID lookup

    async def enqueue(self, request_data: Dict[str, Any], priority: int = 1) -> RequestQueue:
        """
        Add a request to the queue.
        """
        # Create record
        record = RequestQueue(
            id=len(self._db_mirror) + 1,
            request_data=request_data,
            priority=priority,
            status="pending"
        )
        self._db_mirror[record.id] = record
        
        # Add to in-memory queue (simple list for demo)
        # In reality, this would be `redis.lpush`
        self._queue.append(record)
        
        # Sort by priority (0 is highest)
        self._queue.sort(key=lambda x: x.priority)
        
        logger.info(f"Enqueued request {record.id} with priority {priority}")
        return record

    async def dequeue(self) -> Optional[RequestQueue]:
        """
        Get next request to process.
        """
        if not self._queue:
            return None
        
        # Pop highest priority (first element due to sort)
        record = self._queue.pop(0)
        record.status = "processing"
        return record

    async def complete(self, request_id: int):
        """
        Mark request as completed.
        """
        record = self._db_mirror.get(request_id)
        if record:
            record.status = "completed"
            record.processed_at = datetime.utcnow()
            logger.info(f"Completed request {request_id}")

    def get_queue_depth(self) -> int:
        return len(self._queue)
