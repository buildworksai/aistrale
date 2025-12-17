from unittest.mock import MagicMock, patch

# Import the conftest module to access the shared test session data
# This ensures we're using the same dictionary instance
import tests.conftest
from models.user import User


@patch("api.auth.verify_password")
def test_login_success(mock_verify_password, client, mock_session):
    # Clear session data for this test
    # Access via module to ensure we're using the same dictionary instance
    tests.conftest._test_session_data.clear()
    
    # Setup mock
    mock_user = User(
        email="test@example.com", password_hash="hashed", role="user", id=1
    )
    mock_result = MagicMock()
    mock_result.first.return_value = mock_user
    mock_session.exec.return_value = mock_result
    mock_verify_password.return_value = True

    # Execute
    response = client.post(
        "/api/auth/login",
        json={
            "email": "test@example.com",
            "password": "password"})

    # Verify
    assert response.status_code == 200
    assert response.json()["message"] == "Logged in successfully"
    # Access via module to ensure we're using the same dictionary instance
    # The login endpoint should have set session_data["user_id"] and session_data["role"]
    # which modifies the same dictionary that get_session_data_override returns
    session_data = tests.conftest._test_session_data
    assert session_data.get("user_id") == 1
    assert session_data.get("role") == "user"


@patch("api.auth.verify_password")
def test_login_failure(mock_verify_password, client, mock_session):
    # Clear session data for this test
    tests.conftest._test_session_data.clear()
    
    # Setup mock
    mock_user = User(
        email="test@example.com", password_hash="hashed", role="user", id=1
    )
    mock_result = MagicMock()
    mock_result.first.return_value = mock_user
    mock_session.exec.return_value = mock_result
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
    # Clear session data for this test
    tests.conftest._test_session_data.clear()
    
    # Setup mock
    mock_result = MagicMock()
    mock_result.first.return_value = None
    mock_session.exec.return_value = mock_result

    # Execute
    response = client.post(
        "/api/auth/login",
        json={"email": "nonexistent@example.com", "password": "password"},
    )

    # Verify
    assert response.status_code == 400
    assert response.json()["detail"] == "Incorrect email or password"
