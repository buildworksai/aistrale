"""Comprehensive tests for API dependencies."""

import pytest

from api.deps import get_current_user_id, require_admin
from models.user import User


class TestAPIDeps:
    """Comprehensive tests for API dependencies."""

    def test_get_current_user_id_success(self, client):
        """Test getting current user ID when authenticated."""
        session_data = {"user_id": 1}
        user_id = get_current_user_id(session_data)
        assert user_id == 1

    def test_get_current_user_id_not_authenticated(self, client):
        """Test getting current user ID when not authenticated."""
        from fastapi import HTTPException

        with pytest.raises(HTTPException) as exc_info:
            get_current_user_id({})
        assert exc_info.value.status_code == 401

    def test_require_admin_success(self, client, mock_session):
        """Test require_admin when user is admin."""
        # Mock admin user
        admin_user = User(
            id=1,
            email="admin@example.com",
            password_hash="hashed",
            role="admin")
        mock_session.get.return_value = admin_user

        user_id = require_admin({"user_id": 1}, mock_session)
        assert user_id == 1

    def test_require_admin_not_authenticated(self, client, mock_session):
        """Test require_admin when not authenticated."""
        from fastapi import HTTPException

        with pytest.raises(HTTPException) as exc_info:
            require_admin({}, mock_session)
        assert exc_info.value.status_code == 401

    def test_require_admin_not_admin(self, client, mock_session):
        """Test require_admin when user is not admin."""
        from fastapi import HTTPException

        # Mock regular user
        regular_user = User(
            id=1, email="user@example.com", password_hash="hashed", role="user"
        )
        mock_session.get.return_value = regular_user

        with pytest.raises(HTTPException) as exc_info:
            require_admin({"user_id": 1}, mock_session)
        assert exc_info.value.status_code == 403

    def test_require_admin_user_not_found(self, client, mock_session):
        """Test require_admin when user not found."""
        from fastapi import HTTPException

        mock_session.get.return_value = None

        with pytest.raises(HTTPException) as exc_info:
            require_admin({"user_id": 999}, mock_session)
        assert exc_info.value.status_code == 403
