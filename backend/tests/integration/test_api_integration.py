from fastapi.testclient import TestClient

from core.security import get_password_hash
from models.user import User


def test_health_check(client: TestClient):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_readiness_check(client: TestClient, mock_session):
    # Mock session is already injected via dependency override in conftest
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
        "/api/auth/login", json={"email": "test@example.com", "password": "password"}
    )
    assert response.status_code == 200
    assert "user" in response.json()
