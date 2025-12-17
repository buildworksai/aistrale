import json
from unittest.mock import AsyncMock, patch

import pytest
from sqlmodel import Session, SQLModel, create_engine

from models.webhook import Webhook
from models.workspace import Workspace
from services.webhook_service import WebhookService


@pytest.mark.asyncio
async def test_dispatch_event_success():
    engine = create_engine("sqlite://")
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        session.add(Workspace(id=1, name="Test Workspace"))
        session.commit()

        session.add(
            Webhook(
                workspace_id=1,
                url="http://localhost:9000/hook",
                events=["inference.completed"],
                secret="secret",
                enabled=True,
            )
        )
        session.commit()

        service = WebhookService(session)

        # Mock httpx post
        with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
            mock_post.return_value.status_code = 200

            await service.dispatch_event(1, "inference.completed", {"id": "123"})

            assert mock_post.called
            args, kwargs = mock_post.call_args
            assert kwargs["json"] == {"id": "123"}
            assert "X-Aistrale-Signature" in kwargs["headers"]


def test_signature_generation():
    engine = create_engine("sqlite://")
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        service = WebhookService(session)
    payload = {"foo": "bar"}
    secret = "secret"

    sig = service._generate_signature(secret, payload)

    # Verify manually
    import hashlib
    import hmac

    expected = hmac.new(
        b"secret",
        json.dumps(
            payload,
            separators=(
                ",",
                ":")).encode(),
        hashlib.sha256).hexdigest()
    assert sig == expected
