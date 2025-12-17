from typing import Any

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlmodel import Session

from api.deps import get_current_user_id
from core.database import engine, get_session
from services.webhook_service import WebhookService

router = APIRouter()


def get_webhook_service(session: Session = Depends(get_session)):
    return WebhookService(session)


class DispatchTestRequest(BaseModel):
    workspace_id: int
    event_type: str
    payload: dict[str, Any]


async def _dispatch_event_background(
    workspace_id: int,
    event_type: str,
    payload: dict[str, Any],
) -> None:
    with Session(engine) as session:
        await WebhookService(session).dispatch_event(workspace_id, event_type, payload)


@router.get("/")
def list_webhooks(
    request: Request,
    user_id: int = Depends(get_current_user_id),
    service: WebhookService = Depends(get_webhook_service),
    workspace_id: int | None = None,
):
    """List all webhooks."""
    return service.list_webhooks(workspace_id=workspace_id)


@router.post("/")
async def create_webhook(
    request: Request,
    webhook_data: dict[str, Any],
    user_id: int = Depends(get_current_user_id),
    service: WebhookService = Depends(get_webhook_service),
):
    """Create a webhook."""
    try:
        return await service.create_webhook(webhook_data)
    except ValueError as e:
        detail = str(e)
        if "not found" in detail.lower():
            raise HTTPException(status_code=404, detail=detail) from e
        raise HTTPException(status_code=400, detail=detail) from e


@router.delete("/{webhook_id}", status_code=204)
def delete_webhook(
    request: Request,
    webhook_id: int,
    user_id: int = Depends(get_current_user_id),
    service: WebhookService = Depends(get_webhook_service),
):
    """Delete a webhook."""
    try:
        service.delete_webhook(webhook_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e


@router.get("/deliveries")
def list_deliveries(
    request: Request,
    user_id: int = Depends(get_current_user_id),
    service: WebhookService = Depends(get_webhook_service),
    workspace_id: int | None = None,
):
    """List webhook deliveries."""
    return service.list_deliveries(workspace_id=workspace_id)


@router.get("/analytics")
def get_webhook_analytics(
    request: Request,
    user_id: int = Depends(get_current_user_id),
    service: WebhookService = Depends(get_webhook_service),
    workspace_id: int | None = None,
):
    """Get webhook analytics."""
    return service.get_analytics(workspace_id=workspace_id)


@router.post("/dispatch-test")
async def dispatch_test_event(
    request: Request,
    body: DispatchTestRequest,
    background_tasks: BackgroundTasks,
    user_id: int = Depends(get_current_user_id),
    service: WebhookService = Depends(get_webhook_service),
):
    """Trigger a webhook event dispatch manually."""
    background_tasks.add_task(
        _dispatch_event_background,
        body.workspace_id,
        body.event_type,
        body.payload,
    )
    return {"status": "queued"}
