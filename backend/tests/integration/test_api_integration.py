from fastapi.testclient import TestClient
from unittest.mock import MagicMock

from core.security import get_password_hash
from models.user import User


def test_health_check(client: TestClient):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_readiness_check(client: TestClient, mock_session):
    # Mock the database connection check
    from core.database import engine
    from unittest.mock import patch

    with patch.object(engine, "connect") as mock_connect:
        mock_connection = MagicMock()
        mock_connect.return_value.__enter__.return_value = mock_connection
        mock_connection.execute.return_value = MagicMock()

        response = client.get("/ready")
        assert response.status_code == 200
    assert response.json() == {"status": "ready"}


def test_login_flow(client: TestClient, mock_session):
    # Create user
    user = User(
        email="test@example.com",
        password_hash=get_password_hash("password"),
        role="user",
    )
    mock_session.add(user)
    mock_session.commit()

    # Configure mock to return the user
    mock_session.exec.return_value.first.return_value = user

    # Login
    response = client.post(
        "/api/auth/login",
        json={
            "email": "test@example.com",
            "password": "password"})
    assert response.status_code == 200
    assert "user" in response.json()
