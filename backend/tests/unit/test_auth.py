from unittest.mock import patch

from fastapi.testclient import TestClient

from main import app
from models.user import User

client = TestClient(app)


@patch("api.auth.verify_password")
def test_login_success(mock_verify_password, client, mock_session):
    # Setup mock
    mock_user = User(
        email="test@example.com", password_hash="hashed", role="user", id=1
    )
    mock_session.exec.return_value.first.return_value = mock_user
    mock_verify_password.return_value = True

    # Execute
    response = client.post(
        "/api/auth/login", json={"email": "test@example.com", "password": "password"}
    )

    # Verify
    assert response.status_code == 200
    assert response.json()["message"] == "Logged in successfully"


@patch("api.auth.verify_password")
def test_login_failure(mock_verify_password, client, mock_session):
    # Setup mock
    mock_user = User(
        email="test@example.com", password_hash="hashed", role="user", id=1
    )
    mock_session.exec.return_value.first.return_value = mock_user
    mock_verify_password.return_value = False

    # Execute
    response = client.post(
        "/api/auth/login",
        json={"email": "test@example.com", "password": "wrongpassword"},
    )

    # Verify
    assert response.status_code == 400
    assert response.json()["detail"] == "Incorrect email or password"


def test_login_user_not_found(client, mock_session):
    # Setup mock
    mock_session.exec.return_value.first.return_value = None

    # Execute
    response = client.post(
        "/api/auth/login",
        json={"email": "nonexistent@example.com", "password": "password"},
    )

    # Verify
    assert response.status_code == 400
    assert response.json()["detail"] == "Incorrect email or password"
