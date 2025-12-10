"""Comprehensive tests for users API endpoints."""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import MagicMock, patch
from sqlmodel import Session, select
from models.user import User
from core.security import get_password_hash


class TestUsersAPI:
    """Comprehensive tests for users endpoints."""

    def test_create_user_as_admin(self, client, mock_session):
        """Test creating a user as admin."""
        from api import users
        from core.database import get_session
        
        app = client.app
        
        def mock_get_session():
            return mock_session
        
        app.dependency_overrides[get_session] = mock_get_session
        
        # Set session as admin
        with client.session_transaction() as sess:
            sess["role"] = "admin"
        
        # Mock user doesn't exist
        mock_result = MagicMock()
        mock_result.first.return_value = None
        mock_session.exec.return_value = mock_result
        
        mock_session.add = MagicMock()
        mock_session.commit = MagicMock()
        mock_session.refresh = MagicMock()
        
        # Mock the created user
        new_user = User(
            id=1,
            email="newuser@example.com",
            password_hash="hashed",
            role="user"
        )
        mock_session.refresh.return_value = new_user
        mock_session.add.return_value = None
        
        response = client.post(
            "/api/users/",
            json={
                "email": "newuser@example.com",
                "password": "password123",
                "role": "user"
            }
        )
        assert response.status_code == 200
        
        app.dependency_overrides.clear()

    def test_create_user_not_admin(self, client, mock_session):
        """Test creating a user as non-admin."""
        from api import users
        from core.database import get_session
        
        app = client.app
        app.dependency_overrides[get_session] = lambda: mock_session
        
        # Set session as regular user
        with client.session_transaction() as sess:
            sess["role"] = "user"
        
        response = client.post(
            "/api/users/",
            json={
                "email": "newuser@example.com",
                "password": "password123",
                "role": "user"
            }
        )
        assert response.status_code == 403
        assert "Not authorized" in response.json()["detail"]
        
        app.dependency_overrides.clear()

    def test_create_user_email_exists(self, client, mock_session):
        """Test creating a user with existing email."""
        from api import users
        from core.database import get_session
        
        app = client.app
        app.dependency_overrides[get_session] = lambda: mock_session
        
        # Set session as admin
        with client.session_transaction() as sess:
            sess["role"] = "admin"
        
        # Mock user exists
        existing_user = User(
            id=1,
            email="existing@example.com",
            password_hash="hashed",
            role="user"
        )
        mock_result = MagicMock()
        mock_result.first.return_value = existing_user
        mock_session.exec.return_value = mock_result
        
        response = client.post(
            "/api/users/",
            json={
                "email": "existing@example.com",
                "password": "password123",
                "role": "user"
            }
        )
        assert response.status_code == 400
        assert "Email already registered" in response.json()["detail"]
        
        app.dependency_overrides.clear()

    def test_read_users_as_admin(self, client, mock_session):
        """Test reading users as admin."""
        from api import users
        from core.database import get_session
        
        app = client.app
        
        def mock_get_session():
            return mock_session
        
        app.dependency_overrides[get_session] = mock_get_session
        
        # Set session as admin
        with client.session_transaction() as sess:
            sess["role"] = "admin"
        
        # Mock users
        user1 = User(id=1, email="user1@example.com", password_hash="hashed", role="user")
        user2 = User(id=2, email="user2@example.com", password_hash="hashed", role="admin")
        
        mock_result = MagicMock()
        mock_result.all.return_value = [user1, user2]
        mock_session.exec.return_value = mock_result
        
        response = client.get("/api/users/")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        
        app.dependency_overrides.clear()

    def test_read_users_not_admin(self, client, mock_session):
        """Test reading users as non-admin."""
        from api import users
        from core.database import get_session
        
        app = client.app
        app.dependency_overrides[get_session] = lambda: mock_session
        
        # Set session as regular user
        with client.session_transaction() as sess:
            sess["role"] = "user"
        
        response = client.get("/api/users/")
        assert response.status_code == 403
        assert "Not authorized" in response.json()["detail"]
        
        app.dependency_overrides.clear()

