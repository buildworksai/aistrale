"""Tests for admin API endpoints."""

from unittest.mock import MagicMock, patch


class TestAdminAPI:
    """Test admin API endpoints."""

    def test_rotate_encryption_key_admin(self, client, mock_session):
        """Test key rotation as admin."""
        # Mock the dependency injection
        from api import admin
        from core.database import get_session

        def mock_require_admin():
            return 1

        def mock_get_session():
            return mock_session

        app = client.app
        app.dependency_overrides[admin.require_admin] = mock_require_admin
        app.dependency_overrides[get_session] = mock_get_session

        try:
            with patch("api.admin.KeyRotationService") as mock_service:
                mock_rotation = MagicMock()
                mock_rotation.rotate_key.return_value = ("new-key-id", 5)
                mock_service.return_value = mock_rotation

                response = client.post("/api/admin/rotate-encryption-key")
                assert response.status_code == 200
                data = response.json()
                assert data["status"] == "success"
                assert data["re_encrypted_tokens"] == 5
        finally:
            app.dependency_overrides.clear()

    def test_rotate_encryption_key_non_admin(self, client):
        """Test key rotation as non-admin should fail."""
        from fastapi import HTTPException

        from api import admin

        app = client.app

        def mock_require_admin():
            raise HTTPException(
                status_code=403,
                detail="Admin access required")

        app.dependency_overrides[admin.require_admin] = mock_require_admin

        try:
            response = client.post("/api/admin/rotate-encryption-key")
            assert response.status_code == 403
        finally:
            app.dependency_overrides.clear()
