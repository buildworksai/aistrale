from fastapi import APIRouter, Depends
from typing import Dict, Any
from services.webhook_service import WebhookService

router = APIRouter()

def get_webhook_service():
    return WebhookService()

@router.post("/dispatch-test")
async def dispatch_test_event(
    workspace_id: int, 
    event_type: str, 
    payload: Dict[str, Any],
    service: WebhookService = Depends(get_webhook_service)
):
    """Trigger a webhook event dispatch manually."""
    await service.dispatch_event(workspace_id, event_type, payload)
    return {"status": "dispatched"}
