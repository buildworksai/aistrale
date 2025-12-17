import hashlib
import hmac
import json
import logging
import secrets
from datetime import UTC, datetime
from typing import Any

import httpx
from sqlalchemy import delete
from sqlmodel import Session, select

from models.webhook import Webhook, WebhookDelivery
from models.workspace import Workspace

logger = logging.getLogger(__name__)

HTTP_SUCCESS_MIN = 200
HTTP_SUCCESS_MAX_EXCLUSIVE = 300

WEBHOOK_CONNECT_TIMEOUT_S = 1.0
WEBHOOK_READ_TIMEOUT_S = 2.0
WEBHOOK_WRITE_TIMEOUT_S = 2.0
WEBHOOK_POOL_TIMEOUT_S = 1.0


class WebhookService:
    """
    Service to manage and dispatch webhooks.
    """

    def __init__(self, session: Session):
        self._session = session

    def _to_utc_aware(self, dt: datetime) -> datetime:
        if dt.tzinfo is None:
            return dt.replace(tzinfo=UTC)
        return dt.astimezone(UTC)

    async def dispatch_event(
        self, workspace_id: int, event_type: str, payload: dict[str, Any]
    ):
        """
        Find applicable webhooks and dispatch event.
        """
        webhooks = self._get_workspace_webhooks(workspace_id)

        for webhook in webhooks:
            if not webhook.enabled:
                continue
            if event_type in webhook.events or "*" in webhook.events:
                await self._send_webhook(webhook, event_type, payload)

    async def _send_webhook(
        self, webhook: Webhook, event_type: str, payload: dict[str, Any]
    ):
        """
        Send single webhook.
        """
        delivery = WebhookDelivery(
            webhook_id=webhook.id,
            event_type=event_type,
            payload=payload,
            status="pending",
        )
        self._session.add(delivery)
        self._session.commit()
        self._session.refresh(delivery)

        signature = self._generate_signature(webhook.secret, payload)

        headers = {
            "Content-Type": "application/json",
            "X-Aistrale-Event": event_type,
            "X-Aistrale-Signature": signature,
        }

        try:
            timeout = httpx.Timeout(
                connect=WEBHOOK_CONNECT_TIMEOUT_S,
                read=WEBHOOK_READ_TIMEOUT_S,
                write=WEBHOOK_WRITE_TIMEOUT_S,
                pool=WEBHOOK_POOL_TIMEOUT_S,
            )
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    webhook.url,
                    json=payload,
                    headers=headers,
                    timeout=timeout,
                )
                delivery.response_code = response.status_code
                delivery.status = (
                    "success"
                    if HTTP_SUCCESS_MIN
                    <= response.status_code
                    < HTTP_SUCCESS_MAX_EXCLUSIVE
                    else "failed"
                )
                delivery.delivered_at = datetime.now(UTC)
                self._session.add(delivery)
                self._session.commit()
                logger.info(
                    f"Webhook {webhook.id} dispatched: {delivery.status}")

        except Exception as e:
            logger.error(f"Webhook {webhook.id} failed: {e}")
            delivery.status = "failed"
            delivery.response_code = None
            delivery.delivered_at = datetime.now(UTC)
            self._session.add(delivery)
            self._session.commit()

    def _generate_signature(self, secret: str, payload: dict[str, Any]) -> str:
        """
        HMAC SHA256 signature.
        """
        data = json.dumps(payload, separators=(",", ":")).encode("utf-8")
        return hmac.new(
            secret.encode("utf-8"),
            data,
            hashlib.sha256).hexdigest()

    def list_webhooks(self, workspace_id: int | None = None) -> list[Webhook]:
        """
        List all webhooks, optionally filtered by workspace.
        """
        query = select(Webhook)
        if workspace_id is not None:
            query = query.where(Webhook.workspace_id == workspace_id)
        return self._session.exec(query).all()

    async def create_webhook(self, webhook_data: dict[str, Any]) -> Webhook:
        """
        Create a new webhook.
        """
        workspace_id = webhook_data.get("workspace_id")
        if workspace_id is None:
            raise ValueError("workspace_id is required")

        workspace = self._session.get(Workspace, workspace_id)
        if not workspace:
            raise ValueError("Workspace not found")

        events = webhook_data.get("events")
        if not isinstance(events, list) or len(events) == 0:
            raise ValueError("events must be a non-empty list")

        secret = webhook_data.get("secret")
        if not secret:
            secret = secrets.token_hex(24)

        webhook = Webhook(
            workspace_id=workspace_id,
            url=webhook_data.get("url", ""),
            events=events,
            secret=secret,
            enabled=bool(webhook_data.get("enabled", True)),
        )

        self._session.add(webhook)
        self._session.commit()
        self._session.refresh(webhook)
        return webhook

    def list_deliveries(self, workspace_id: int | None = None) -> list[WebhookDelivery]:
        """
        List webhook deliveries.
        """
        query = select(WebhookDelivery)
        if workspace_id is not None:
            webhook_ids = self._session.exec(
                select(Webhook.id).where(Webhook.workspace_id == workspace_id)
            ).all()
            if not webhook_ids:
                return []
            query = query.where(WebhookDelivery.webhook_id.in_(webhook_ids))
        query = query.order_by(WebhookDelivery.created_at.desc())
        return self._session.exec(query).all()

    def get_analytics(self, workspace_id: int | None = None) -> dict[str, Any]:
        """
        Get webhook analytics.
        """
        deliveries = self.list_deliveries(workspace_id=workspace_id)
        total = len(deliveries)
        if total == 0:
            return {
                "total_deliveries": 0,
                "success_rate": 0.0,
                "avg_delivery_time": 0.0,
                "recent_failures": 0,
            }

        success = len([d for d in deliveries if d.status == "success"])
        success_rate = success / total

        durations_ms: list[float] = []
        for d in deliveries:
            if d.delivered_at is None:
                continue
            created_at = self._to_utc_aware(d.created_at)
            delivered_at = self._to_utc_aware(d.delivered_at)
            durations_ms.append((delivered_at - created_at).total_seconds() * 1000.0)
        avg_delivery_time = (
            (sum(durations_ms) / len(durations_ms)) if durations_ms else 0.0
        )

        window = deliveries[:20]
        recent_failures = len([d for d in window if d.status == "failed"])

        return {
            "total_deliveries": total,
            "success_rate": success_rate,
            "avg_delivery_time": avg_delivery_time,
            "recent_failures": recent_failures,
        }

    def _get_workspace_webhooks(self, workspace_id: int):
        return self._session.exec(
            select(Webhook).where(Webhook.workspace_id == workspace_id)
        ).all()

    def delete_webhook(self, webhook_id: int) -> None:
        webhook = self._session.get(Webhook, webhook_id)
        if not webhook:
            raise ValueError("Webhook not found")

        self._session.exec(
            delete(WebhookDelivery).where(WebhookDelivery.webhook_id == webhook_id)
        )
        self._session.commit()

        self._session.exec(delete(Webhook).where(Webhook.id == webhook_id))
        self._session.commit()
