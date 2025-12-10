import logging
from typing import Callable, Awaitable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from services.pii_detection_service import PIIDetectionService
from services.field_encryption_service import FieldEncryptionService

logger = logging.getLogger(__name__)

class EncryptionMiddleware(BaseHTTPMiddleware):
    """
    Middleware to automatically detect and encrypt PII in request bodies or decrypt in responses.
    
    WARNING: This is a heavy-handed approach if applied globally. 
    It is recommended to use this selectively or on specific routes.
    
    Current implementation is a skeleton that can be enabled for specific paths.
    """
    
    def __init__(
        self, 
        app, 
        pii_service: PIIDetectionService, 
        encryption_service: FieldEncryptionService,
        monitor_paths: list[str] = []
    ):
        super().__init__(app)
        self.pii_service = pii_service
        self.encryption_service = encryption_service
        self.monitor_paths = monitor_paths

    async def dispatch(self, request: Request, call_next: Callable[[Request], Awaitable[Response]]) -> Response:
        # Skip if path is not monitored
        if request.url.path not in self.monitor_paths:
            return await call_next(request)

        # TODO: Implement full body inspection/interception. 
        # Streaming requests make this hard in middleware without buffering the whole body.
        # For Phase 1, we provide the hook but pass through.
        
        logger.info(f"EncryptionMiddleware processing request for {request.url.path}")
        
        # Pass through for now
        response = await call_next(request)
        
        return response
