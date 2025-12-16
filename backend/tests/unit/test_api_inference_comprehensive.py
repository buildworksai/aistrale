"""Comprehensive tests for inference API endpoints."""

import pytest
from unittest.mock import MagicMock, AsyncMock
from models.token import Token
from models.chat import ChatMessage


class TestInferenceAPI:
    """Comprehensive tests for inference endpoints."""

    @pytest.fixture
    def test_token(self, mock_session):
        """Create a test token."""
        from cryptography.fernet import Fernet
        from core.config import get_settings

        settings = get_settings()
        cipher = Fernet(settings.ENCRYPTION_KEY.encode())
        encrypted_token = cipher.encrypt(b"test_token_value").decode()

        token = Token(
            id=1,
            user_id=1,
            provider="openai",
            encrypted_token=encrypted_token,
            label="Test Token",
        )
        return token

    @pytest.mark.asyncio
    async def test_run_inference_endpoint(
            self, client, mock_session, test_token):
        """Test running inference."""
        from core.database import get_session

        app = client.app

        def mock_get_session():
            return mock_session

        app.dependency_overrides[get_session] = mock_get_session

        # Login to set session (inference endpoint checks
        # request.session.get("user_id") directly)
        from models.user import User
        from core.security import get_password_hash
        from unittest.mock import patch

        test_user = User(
            id=1,
            email="test@example.com",
            password_hash=get_password_hash("pass"),
            role="user",
        )
        mock_result = MagicMock()
        mock_result.first.return_value = test_user
        mock_session.exec.return_value = mock_result
        with patch("api.auth.verify_password", return_value=True):
            client.post(
                "/api/auth/login",
                json={"email": "test@example.com", "password": "pass"},
            )

        # Mock token retrieval
        mock_session.get.return_value = test_token

        # Mock chat history
        mock_history_result = MagicMock()
        mock_history_result.all.return_value = []
        mock_session.exec.return_value = mock_history_result

        # Mock inference service
        with patch("api.inference.run_inference", new_callable=AsyncMock) as mock_run:
            mock_run.return_value = "Test response"

            response = client.post(
                "/api/inference/run",
                json={
                    "provider": "openai",
                    "model": "gpt-3.5-turbo",
                    "input_text": "Hello",
                    "token_id": 1,
                },
            )
            assert response.status_code == 200
            assert response.json()["result"] == "Test response"

        app.dependency_overrides.clear()

    @pytest.mark.asyncio
    async def test_run_inference_not_authenticated(self, client, mock_session):
        """Test running inference without authentication."""
        from core.database import get_session

        app = client.app
        app.dependency_overrides[get_session] = lambda: mock_session

        response = client.post(
            "/api/inference/run",
            json={
                "provider": "openai",
                "model": "gpt-3.5-turbo",
                "input_text": "Hello",
                "token_id": 1,
            },
        )
        assert response.status_code == 401

        app.dependency_overrides.clear()

    @pytest.mark.asyncio
    async def test_run_inference_token_not_found(self, client, mock_session):
        """Test running inference with non-existent token."""
        from core.database import get_session

        app = client.app
        app.dependency_overrides[get_session] = lambda: mock_session

        # Login to set session
        from models.user import User
        from core.security import get_password_hash
        from unittest.mock import patch

        test_user = User(
            id=1,
            email="test@example.com",
            password_hash=get_password_hash("pass"),
            role="user",
        )
        mock_result = MagicMock()
        mock_result.first.return_value = test_user
        mock_session.exec.return_value = mock_result
        with patch("api.auth.verify_password", return_value=True):
            client.post(
                "/api/auth/login",
                json={"email": "test@example.com", "password": "pass"},
            )

        mock_session.get.return_value = None

        response = client.post(
            "/api/inference/run",
            json={
                "provider": "openai",
                "model": "gpt-3.5-turbo",
                "input_text": "Hello",
                "token_id": 999,
            },
        )
        assert response.status_code == 404

        app.dependency_overrides.clear()

    @pytest.mark.asyncio
    async def test_run_inference_provider_mismatch(
        self, client, mock_session, test_token
    ):
        """Test running inference with provider mismatch."""
        from core.database import get_session

        app = client.app
        app.dependency_overrides[get_session] = lambda: mock_session

        # Login to set session
        from models.user import User
        from core.security import get_password_hash
        from unittest.mock import patch

        test_user = User(
            id=1,
            email="test@example.com",
            password_hash=get_password_hash("pass"),
            role="user",
        )
        mock_result = MagicMock()
        mock_result.first.return_value = test_user
        mock_session.exec.return_value = mock_result
        with patch("api.auth.verify_password", return_value=True):
            client.post(
                "/api/auth/login",
                json={"email": "test@example.com", "password": "pass"},
            )

        mock_session.get.return_value = test_token

        response = client.post(
            "/api/inference/run",
            json={
                "provider": "anthropic",  # Mismatch with token provider
                "model": "claude-3",
                "input_text": "Hello",
                "token_id": 1,
            },
        )
        assert response.status_code == 400
        assert "provider does not match" in response.json()["detail"]

        app.dependency_overrides.clear()

    def test_get_chat_history(self, client, mock_session):
        """Test getting chat history."""
        from core.database import get_session

        app = client.app
        app.dependency_overrides[get_session] = lambda: mock_session

        # Login to set session
        from models.user import User
        from core.security import get_password_hash
        from unittest.mock import patch

        test_user = User(
            id=1,
            email="test@example.com",
            password_hash=get_password_hash("pass"),
            role="user",
        )
        mock_result = MagicMock()
        mock_result.first.return_value = test_user
        mock_session.exec.return_value = mock_result
        with patch("api.auth.verify_password", return_value=True):
            client.post(
                "/api/auth/login",
                json={"email": "test@example.com", "password": "pass"},
            )

        # Mock chat messages
        msg1 = ChatMessage(id=1, user_id=1, role="user", content="Hello")
        msg2 = ChatMessage(
            id=2,
            user_id=1,
            role="assistant",
            content="Hi there")

        mock_result = MagicMock()
        mock_result.all.return_value = [msg1, msg2]
        mock_session.exec.return_value = mock_result

        response = client.get("/api/inference/history")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2

        app.dependency_overrides.clear()

    def test_get_chat_history_not_authenticated(self, client, mock_session):
        """Test getting chat history without authentication."""
        from core.database import get_session

        app = client.app
        app.dependency_overrides[get_session] = lambda: mock_session

        response = client.get("/api/inference/history")
        assert response.status_code == 401

        app.dependency_overrides.clear()

    def test_clear_chat_history(self, client, mock_session):
        """Test clearing chat history."""
        from core.database import get_session

        app = client.app
        app.dependency_overrides[get_session] = lambda: mock_session

        # Login to set session
        from models.user import User
        from core.security import get_password_hash
        from unittest.mock import patch

        test_user = User(
            id=1,
            email="test@example.com",
            password_hash=get_password_hash("pass"),
            role="user",
        )
        mock_result = MagicMock()
        mock_result.first.return_value = test_user
        mock_session.exec.return_value = mock_result
        with patch("api.auth.verify_password", return_value=True):
            client.post(
                "/api/auth/login",
                json={"email": "test@example.com", "password": "pass"},
            )

        # Mock messages to delete
        msg1 = ChatMessage(id=1, user_id=1, role="user", content="Hello")
        msg2 = ChatMessage(id=2, user_id=1, role="assistant", content="Hi")

        mock_result = MagicMock()
        mock_result.all.return_value = [msg1, msg2]
        mock_session.exec.return_value = mock_result
        mock_session.delete = MagicMock()
        mock_session.commit = MagicMock()

        response = client.delete("/api/inference/history")
        assert response.status_code == 200
        assert response.json()["ok"] is True

        app.dependency_overrides.clear()

    def test_clear_chat_history_not_authenticated(self, client, mock_session):
        """Test clearing chat history without authentication."""
        from core.database import get_session

        app = client.app
        app.dependency_overrides[get_session] = lambda: mock_session

        response = client.delete("/api/inference/history")
        assert response.status_code == 401

        app.dependency_overrides.clear()
