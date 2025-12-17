"""Comprehensive tests for auth API endpoints."""

from unittest.mock import MagicMock, patch

from core.security import get_password_hash
from models.user import User


class TestAuthAPI:
    """Comprehensive tests for auth endpoints."""

    def test_login_success(self, client, mock_session):
        """Test successful login."""
        from core.database import get_session

        # Create test user
        user = User(
            id=1,
            email="test@example.com",
            password_hash=get_password_hash("password123"),
            role="user",
        )

        # Mock session query
        mock_result = MagicMock()
        mock_result.first.return_value = user
        mock_session.exec.return_value = mock_result

        app = client.app
        app.dependency_overrides[get_session] = lambda: mock_session

        # Mock session storage
        with patch.object(client, "post") as mock_post:
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.json.return_value = {
                "message": "Logged in successfully",
                "user": {"email": user.email, "role": user.role},
            }
            mock_post.return_value = mock_response

            response = client.post(
                "/api/auth/login",
                json={"email": "test@example.com", "password": "password123"},
            )
            assert response.status_code == 200
            data = response.json()
            assert data["message"] == "Logged in successfully"
            assert data["user"]["email"] == "test@example.com"

        app.dependency_overrides.clear()

    def test_login_failure_wrong_password(self, client, mock_session):
        """Test login with wrong password."""
        from core.database import get_session

        user = User(
            id=1,
            email="test@example.com",
            password_hash=get_password_hash("password123"),
            role="user",
        )

        mock_result = MagicMock()
        mock_result.first.return_value = user
        mock_session.exec.return_value = mock_result

        app = client.app
        app.dependency_overrides[get_session] = lambda: mock_session

        response = client.post(
            "/api/auth/login",
            json={"email": "test@example.com", "password": "wrongpassword"},
        )
        assert response.status_code == 400
        assert "Incorrect email or password" in response.json()["detail"]

        app.dependency_overrides.clear()

    def test_login_failure_user_not_found(self, client, mock_session):
        """Test login with non-existent user."""
        from core.database import get_session

        mock_result = MagicMock()
        mock_result.first.return_value = None
        mock_session.exec.return_value = mock_result

        app = client.app
        app.dependency_overrides[get_session] = lambda: mock_session

        response = client.post(
            "/api/auth/login",
            json={"email": "nonexistent@example.com", "password": "password"},
        )
        assert response.status_code == 400

        app.dependency_overrides.clear()

    def test_logout(self, client, mock_session):
        """Test logout."""
        from unittest.mock import patch

        from core.database import get_session

        app = client.app
        app.dependency_overrides[get_session] = lambda: mock_session

        # Login first to set session
        user = User(
            id=1,
            email="test@example.com",
            password_hash=get_password_hash("password123"),
            role="user",
        )
        mock_result = MagicMock()
        mock_result.first.return_value = user
        mock_session.exec.return_value = mock_result

        with patch("api.auth.verify_password", return_value=True):
            login_response = client.post(
                "/api/auth/login",
                json={"email": "test@example.com", "password": "password123"},
            )
            # Session is now set via cookies

        response = client.post("/api/auth/logout")
        assert response.status_code == 200
        assert response.json()["message"] == "Logged out successfully"

        app.dependency_overrides.clear()

    def test_get_current_user_authenticated(self, client, mock_session):
        """Test getting current user when authenticated."""
        from unittest.mock import patch

        from core.database import get_session

        user = User(
            id=1,
            email="test@example.com",
            password_hash=get_password_hash("password123"),
            role="user",
        )

        mock_session.get.return_value = user

        app = client.app
        app.dependency_overrides[get_session] = lambda: mock_session

        # Login first to set session
        mock_result = MagicMock()
        mock_result.first.return_value = user
        mock_session.exec.return_value = mock_result

        with patch("api.auth.verify_password", return_value=True):
            login_response = client.post(
                "/api/auth/login",
                json={"email": "test@example.com", "password": "password123"},
            )
            # Session is now set via cookies

        response = client.get("/api/auth/me")
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "test@example.com"
        assert data["role"] == "user"
        assert data["id"] == 1

        app.dependency_overrides.clear()

    def test_get_current_user_not_authenticated(self, client, mock_session):
        """Test getting current user when not authenticated."""
        from core.database import get_session

        app = client.app
        app.dependency_overrides[get_session] = lambda: mock_session

        response = client.get("/api/auth/me")
        assert response.status_code == 401
        assert "Not authenticated" in response.json()["detail"]

        app.dependency_overrides.clear()

    def test_get_current_user_not_found(self, client, mock_session):
        """Test getting current user when user doesn't exist."""
        from unittest.mock import patch

        from core.database import get_session

        # Login first with a user
        user = User(
            id=999,
            email="test@example.com",
            password_hash=get_password_hash("password123"),
            role="user",
        )

        app = client.app
        app.dependency_overrides[get_session] = lambda: mock_session

        # Login to set session
        mock_result = MagicMock()
        mock_result.first.return_value = user
        mock_session.exec.return_value = mock_result

        with patch("api.auth.verify_password", return_value=True):
            login_response = client.post(
                "/api/auth/login",
                json={"email": "test@example.com", "password": "password123"},
            )

        # Now mock user not found when fetching
        mock_session.get.return_value = None

        response = client.get("/api/auth/me")
        assert response.status_code == 401
        assert "User not found" in response.json()["detail"]

        app.dependency_overrides.clear()
