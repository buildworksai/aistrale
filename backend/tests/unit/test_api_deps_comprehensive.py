"""Comprehensive tests for API dependencies."""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import MagicMock, patch
from sqlmodel import Session
from models.user import User
from api.deps import get_current_user_id, require_admin


class TestAPIDeps:
    """Comprehensive tests for API dependencies."""

    def test_get_current_user_id_success(self, client):
        """Test getting current user ID when authenticated."""
        # Set session
        with client.session_transaction() as sess:
            sess["user_id"] = 1
        
        # Call the dependency directly
        from fastapi import Request
        request = Request({"type": "http", "method": "GET", "path": "/"})
        request.session = {"user_id": 1}
        
        user_id = get_current_user_id(request)
        assert user_id == 1

    def test_get_current_user_id_not_authenticated(self, client):
        """Test getting current user ID when not authenticated."""
        from fastapi import Request, HTTPException
        
        request = Request({"type": "http", "method": "GET", "path": "/"})
        request.session = {}
        
        with pytest.raises(HTTPException) as exc_info:
            get_current_user_id(request)
        assert exc_info.value.status_code == 401

    def test_require_admin_success(self, client, mock_session):
        """Test require_admin when user is admin."""
        from fastapi import Request
        from core.database import get_session
        
        app = client.app
        app.dependency_overrides[get_session] = lambda: mock_session
        
        # Mock admin user
        admin_user = User(
            id=1,
            email="admin@example.com",
            password_hash="hashed",
            role="admin"
        )
        mock_session.get.return_value = admin_user
        
        request = Request({"type": "http", "method": "GET", "path": "/"})
        request.session = {"user_id": 1}
        
        user_id = require_admin(request, mock_session)
        assert user_id == 1
        
        app.dependency_overrides.clear()

    def test_require_admin_not_authenticated(self, client, mock_session):
        """Test require_admin when not authenticated."""
        from fastapi import Request, HTTPException
        
        request = Request({"type": "http", "method": "GET", "path": "/"})
        request.session = {}
        
        with pytest.raises(HTTPException) as exc_info:
            require_admin(request, mock_session)
        assert exc_info.value.status_code == 401

    def test_require_admin_not_admin(self, client, mock_session):
        """Test require_admin when user is not admin."""
        from fastapi import Request, HTTPException
        
        # Mock regular user
        regular_user = User(
            id=1,
            email="user@example.com",
            password_hash="hashed",
            role="user"
        )
        mock_session.get.return_value = regular_user
        
        request = Request({"type": "http", "method": "GET", "path": "/"})
        request.session = {"user_id": 1}
        
        with pytest.raises(HTTPException) as exc_info:
            require_admin(request, mock_session)
        assert exc_info.value.status_code == 403

    def test_require_admin_user_not_found(self, client, mock_session):
        """Test require_admin when user not found."""
        from fastapi import Request, HTTPException
        
        mock_session.get.return_value = None
        
        request = Request({"type": "http", "method": "GET", "path": "/"})
        request.session = {"user_id": 999}
        
        with pytest.raises(HTTPException) as exc_info:
            require_admin(request, mock_session)
        assert exc_info.value.status_code == 403

