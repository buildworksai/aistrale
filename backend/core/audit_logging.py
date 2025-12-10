import logging
import functools
from typing import Optional, Any
from datetime import datetime
from fastapi import Request

# This is a simplified logger. In a real app, it would write to the DB via a service or async queue.
logger = logging.getLogger("security_audit")

def log_access(action: str, resource_type: str):
    """
    Decorator to log access to resources.
    """
    def decorator(func):
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            # Try to extract request from args if present
            request = next((arg for arg in args if isinstance(arg, Request)), None)
            
            user_id = "unknown"
            if request and hasattr(request, "state") and hasattr(request.state, "user"):
                user_id = getattr(request.state.user, "id", "unknown")
            
            logger.info(f"AUDIT: User={user_id} Action={action} Resource={resource_type}")
            
            # Here we would normally insert into SecurityAudit table
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator
