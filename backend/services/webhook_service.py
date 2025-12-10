import logging
import httpx
import hashlib
import hmac
import json
import random
from datetime import datetime
from typing import Dict, Any, List
from models.webhook import Webhook, WebhookDelivery

logger = logging.getLogger(__name__)

class WebhookService:
    """
    Service to manage and dispatch webhooks.
    """

    async def dispatch_event(self, workspace_id: int, event_type: str, payload: Dict[str, Any]):
        """
        Find applicable webhooks and dispatch event.
        """
        # Simulation: Fetch webhooks
        webhooks = self._get_workspace_webhooks(workspace_id)
        
        for hooks in webhooks:
            if event_type in hooks.events or "*" in hooks.events:
                await self._send_webhook(hooks, event_type, payload)

    async def _send_webhook(self, webhook: Webhook, event_type: str, payload: Dict[str, Any]):
        """
        Send single webhook.
        """
        delivery = WebhookDelivery(
            webhook_id=webhook.id,
            event_type=event_type,
            payload=payload,
            status="pending"
        )
        # In real app: save delivery
        
        signature = self._generate_signature(webhook.secret, payload)
        
        headers = {
            "Content-Type": "application/json",
            "X-Aistrale-Event": event_type,
            "X-Aistrale-Signature": signature
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(webhook.url, json=payload, headers=headers, timeout=5.0)
                delivery.response_code = response.status_code
                delivery.status = "success" if 200 <= response.status_code < 300 else "failed"
                delivery.delivered_at = datetime.utcnow()
                logger.info(f"Webhook {webhook.id} dispatched: {delivery.status}")
                
        except Exception as e:
             logger.error(f"Webhook {webhook.id} failed: {e}")
             delivery.status = "failed"
             delivery.response_code = 0

    def _generate_signature(self, secret: str, payload: Dict[str, Any]) -> str:
        """
        HMAC SHA256 signature.
        """
        data = json.dumps(payload, separators=(',', ':')).encode('utf-8')
        return hmac.new(secret.encode('utf-8'), data, hashlib.sha256).hexdigest()

    def list_webhooks(self, user_id: int) -> List[Webhook]:
        """
        List all webhooks for a user.
        """
        # Mock: Return empty list
        return []

    async def create_webhook(self, user_id: int, webhook_data: Dict[str, Any]) -> Webhook:
        """
        Create a new webhook.
        """
        webhook = Webhook(
            id=random.randint(1, 1000),
            workspace_id=webhook_data.get("workspace_id", 1),
            url=webhook_data.get("url", ""),
            events=webhook_data.get("events", []),
            secret=webhook_data.get("secret", "secret123"),
            enabled=webhook_data.get("enabled", True)
        )
        return webhook

    def list_deliveries(self, user_id: int) -> List[WebhookDelivery]:
        """
        List webhook deliveries.
        """
        # Mock: Return empty list
        return []

    def get_analytics(self, user_id: int) -> Dict[str, Any]:
        """
        Get webhook analytics.
        """
        return {
            "total_deliveries": 0,
            "success_rate": 0.0,
            "avg_delivery_time": 0.0,
            "recent_failures": 0
        }

    def _get_workspace_webhooks(self, workspace_id: int):
        # Simulation: Return a mock webhook
        return [
            Webhook(
                id=1, 
                workspace_id=workspace_id, 
                url="http://localhost:9000/hook", # Dummy
                events=["inference.completed"],
                secret="secret123"
            )
        ]
