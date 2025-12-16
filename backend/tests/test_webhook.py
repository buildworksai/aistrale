import pytest
import json
from unittest.mock import AsyncMock, patch
from services.webhook_service import WebhookService


@pytest.mark.asyncio
async def test_dispatch_event_success():
    service = WebhookService()

    # Mock httpx post
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value.status_code = 200

        await service.dispatch_event(1, "inference.completed", {"id": "123"})

        assert mock_post.called
        args, kwargs = mock_post.call_args
        assert kwargs["json"] == {"id": "123"}
        assert "X-Aistrale-Signature" in kwargs["headers"]


def test_signature_generation():
    service = WebhookService()
    payload = {"foo": "bar"}
    secret = "secret"

    sig = service._generate_signature(secret, payload)

    # Verify manually
    import hmac
    import hashlib

    expected = hmac.new(
        b"secret",
        json.dumps(
            payload,
            separators=(
                ",",
                ":")).encode(),
        hashlib.sha256).hexdigest()
    assert sig == expected
