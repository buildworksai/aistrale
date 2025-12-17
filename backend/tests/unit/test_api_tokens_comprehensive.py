"""Comprehensive tests for tokens API endpoints."""

from unittest.mock import MagicMock, patch

import pytest
from cryptography.fernet import Fernet

from core.config import get_settings
from models.token import Token


class TestTokensAPI:
    """Comprehensive tests for tokens endpoints."""

    @pytest.fixture
    def test_token(self, mock_session):
        """Create a test token."""
        settings = get_settings()
        cipher = Fernet(settings.ENCRYPTION_KEY.encode())
        encrypted_token = cipher.encrypt(b"test_token_value").decode()

        token = Token(
            id=1,
            user_id=1,
            provider="openai",
            encrypted_token=encrypted_token,
            label="Test Token",
            is_default=False,
        )
        return token

    def test_create_token(self, client, mock_session, test_token):
        """Test creating a token."""
        from api.deps import get_current_user_id
        from core.database import get_session

        # Mock dependencies
        app = client.app

        def mock_get_current_user_id():
            return 1

        def mock_get_session():
            return mock_session

        app.dependency_overrides[get_current_user_id] = mock_get_current_user_id
        app.dependency_overrides[get_session] = mock_get_session

        # Mock token creation
        mock_session.exec.return_value.all.return_value = []
        mock_session.add = MagicMock()
        mock_session.commit = MagicMock()
        def mock_refresh(obj):
            obj.id = 1
        mock_session.refresh = MagicMock(side_effect=mock_refresh)

        # Mock the token.set_token method
        with patch.object(Token, "set_token"):
            response = client.post(
                "/api/tokens/",
                json={
                    "provider": "openai",
                    "token_value": "test_token",
                    "label": "New Token",
                    "is_default": False,
                },
            )
            assert response.status_code == 200

        app.dependency_overrides.clear()

    def test_create_token_set_default(self, client, mock_session):
        """Test creating a token and setting it as default."""
        from api.deps import get_current_user_id
        from core.database import get_session

        app = client.app

        def mock_get_current_user_id():
            return 1

        def mock_get_session():
            return mock_session

        app.dependency_overrides[get_current_user_id] = mock_get_current_user_id
        app.dependency_overrides[get_session] = mock_get_session

        # Mock existing default token
        existing_token = Token(
            id=2,
            user_id=1,
            provider="openai",
            encrypted_token="enc",
            label="Old",
            is_default=True,
        )
        mock_session.exec.return_value.all.return_value = [existing_token]

        def mock_refresh(obj):
            obj.id = 1
        mock_session.refresh = MagicMock(side_effect=mock_refresh)

        with patch.object(Token, "set_token"):
            response = client.post(
                "/api/tokens/",
                json={
                    "provider": "openai",
                    "token_value": "test_token",
                    "label": "New Default Token",
                    "is_default": True,
                },
            )
            assert response.status_code == 200

        app.dependency_overrides.clear()

    def test_read_tokens(self, client, mock_session, test_token):
        """Test reading user tokens."""
        from api.deps import get_current_user_id
        from core.database import get_session

        app = client.app

        def mock_get_current_user_id():
            return 1

        def mock_get_session():
            return mock_session

        app.dependency_overrides[get_current_user_id] = mock_get_current_user_id
        app.dependency_overrides[get_session] = mock_get_session

        mock_result = MagicMock()
        mock_result.all.return_value = [test_token]
        mock_session.exec.return_value = mock_result

        response = client.get("/api/tokens/")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1

        app.dependency_overrides.clear()

    def test_delete_token(self, client, mock_session, test_token):
        """Test deleting a token."""
        from api.deps import get_current_user_id
        from core.database import get_session

        app = client.app

        def mock_get_current_user_id():
            return 1

        def mock_get_session():
            return mock_session

        app.dependency_overrides[get_current_user_id] = mock_get_current_user_id
        app.dependency_overrides[get_session] = mock_get_session

        mock_session.get.return_value = test_token
        mock_session.delete = MagicMock()
        mock_session.commit = MagicMock()

        response = client.delete("/api/tokens/1")
        assert response.status_code == 200
        assert response.json()["ok"] is True

        app.dependency_overrides.clear()

    def test_delete_token_not_found(self, client, mock_session):
        """Test deleting a non-existent token."""
        from api.deps import get_current_user_id
        from core.database import get_session

        app = client.app

        def mock_get_current_user_id():
            return 1

        def mock_get_session():
            return mock_session

        app.dependency_overrides[get_current_user_id] = mock_get_current_user_id
        app.dependency_overrides[get_session] = mock_get_session

        mock_session.get.return_value = None

        response = client.delete("/api/tokens/999")
        assert response.status_code == 404

        app.dependency_overrides.clear()

    def test_delete_token_wrong_user(self, client, mock_session):
        """Test deleting a token belonging to another user."""
        from api.deps import get_current_user_id
        from core.database import get_session

        app = client.app

        def mock_get_current_user_id():
            return 1

        def mock_get_session():
            return mock_session

        app.dependency_overrides[get_current_user_id] = mock_get_current_user_id
        app.dependency_overrides[get_session] = mock_get_session

        # Token belongs to user 2
        wrong_token = Token(
            id=1,
            user_id=2,
            provider="openai",
            encrypted_token="enc",
            label="Token")
        mock_session.get.return_value = wrong_token

        response = client.delete("/api/tokens/1")
        assert response.status_code == 404

        app.dependency_overrides.clear()

    def test_set_default_token(self, client, mock_session, test_token):
        """Test setting a token as default."""
        from api.deps import get_current_user_id
        from core.database import get_session

        app = client.app

        def mock_get_current_user_id():
            return 1

        def mock_get_session():
            return mock_session

        app.dependency_overrides[get_current_user_id] = mock_get_current_user_id
        app.dependency_overrides[get_session] = mock_get_session

        mock_session.get.return_value = test_token
        mock_session.exec.return_value.all.return_value = []
        mock_session.add = MagicMock()
        mock_session.commit = MagicMock()
        mock_session.refresh = MagicMock()

        response = client.put("/api/tokens/1/default")
        assert response.status_code == 200

        app.dependency_overrides.clear()

    def test_update_token(self, client, mock_session, test_token):
        """Test updating a token."""
        from api.deps import get_current_user_id
        from core.database import get_session

        app = client.app

        def mock_get_current_user_id():
            return 1

        def mock_get_session():
            return mock_session

        app.dependency_overrides[get_current_user_id] = mock_get_current_user_id
        app.dependency_overrides[get_session] = mock_get_session

        mock_session.get.return_value = test_token
        mock_session.exec.return_value.all.return_value = []
        mock_session.add = MagicMock()
        mock_session.commit = MagicMock()
        mock_session.refresh = MagicMock()

        with patch.object(Token, "set_token"):
            response = client.put(
                "/api/tokens/1",
                json={
                    "provider": "openai",
                    "token_value": "updated_token",
                    "label": "Updated Token",
                    "is_default": False,
                },
            )
            assert response.status_code == 200

        app.dependency_overrides.clear()

    def test_update_token_set_default(self, client, mock_session, test_token):
        """Test updating a token and setting it as default."""
        from api.deps import get_current_user_id
        from core.database import get_session

        app = client.app

        def mock_get_current_user_id():
            return 1

        def mock_get_session():
            return mock_session

        app.dependency_overrides[get_current_user_id] = mock_get_current_user_id
        app.dependency_overrides[get_session] = mock_get_session

        mock_session.get.return_value = test_token
        # Mock existing default
        existing_default = Token(
            id=2,
            user_id=1,
            provider="openai",
            encrypted_token="enc",
            label="Old",
            is_default=True,
        )
        mock_session.exec.return_value.all.return_value = [existing_default]
        mock_session.add = MagicMock()
        mock_session.commit = MagicMock()
        mock_session.refresh = MagicMock()

        with patch.object(Token, "set_token"):
            response = client.put(
                "/api/tokens/1",
                json={
                    "provider": "openai",
                    "token_value": "updated_token",
                    "label": "Updated Token",
                    "is_default": True,
                },
            )
            assert response.status_code == 200

        app.dependency_overrides.clear()
