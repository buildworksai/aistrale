from fastapi import APIRouter, Depends, Request
from typing import Dict, Any, List
from services.webhook_service import WebhookService
from api.deps import get_current_user_id

router = APIRouter()

def get_webhook_service():
    return WebhookService()

@router.get("/")
def list_webhooks(
    request: Request,
    user_id: int = Depends(get_current_user_id),
    service: WebhookService = Depends(get_webhook_service)
):
    """List all webhooks."""
    return service.list_webhooks(user_id)

@router.post("/")
async def create_webhook(
    request: Request,
    webhook_data: Dict[str, Any],
    user_id: int = Depends(get_current_user_id),
    service: WebhookService = Depends(get_webhook_service)
):
    """Create a webhook."""
    return await service.create_webhook(user_id, webhook_data)

@router.get("/deliveries")
def list_deliveries(
    request: Request,
    user_id: int = Depends(get_current_user_id),
    service: WebhookService = Depends(get_webhook_service)
):
    """List webhook deliveries."""
    return service.list_deliveries(user_id)

@router.get("/analytics")
def get_webhook_analytics(
    request: Request,
    user_id: int = Depends(get_current_user_id),
    service: WebhookService = Depends(get_webhook_service)
):
    """Get webhook analytics."""
    return service.get_analytics(user_id)

@router.post("/dispatch-test")
async def dispatch_test_event(
    request: Request,
    workspace_id: int, 
    event_type: str, 
    payload: Dict[str, Any],
    user_id: int = Depends(get_current_user_id),
    service: WebhookService = Depends(get_webhook_service)
):
    """Trigger a webhook event dispatch manually."""
    await service.dispatch_event(workspace_id, event_type, payload)
    return {"status": "dispatched"}
