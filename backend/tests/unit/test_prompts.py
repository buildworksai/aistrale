from unittest.mock import MagicMock

from fastapi.testclient import TestClient
from sqlmodel import Session

from api.deps import get_current_user_id
from models.prompt import Prompt
from models.user import User


def test_create_prompt(client: TestClient, mock_session: Session):
    # Use test session data (already patched in client fixture)
    from tests.conftest import _test_session_data
    _test_session_data.clear()
    _test_session_data["user_id"] = 1
    
    # Setup user
    user = User(
        email="test@example.com",
        password_hash="hash",
        role="user",
        id=1)

    # Override dependency - must be done on the app, not client.app
    from main import app
    try:
        app.dependency_overrides[get_current_user_id] = lambda: 1

        # Mock session.exec for existing prompt check (return None)
        # session.exec() returns a result object, and .first() is called on it
        mock_exec_result = MagicMock()
        mock_exec_result.first.return_value = None  # No existing prompt
        # Reset exec mock for this test
        mock_session.exec = MagicMock(return_value=mock_exec_result)

        # Mock refresh to set ID
        def side_effect_refresh(obj):
            obj.id = 1
            obj.created_at = "2024-01-01T00:00:00"
            obj.updated_at = "2024-01-01T00:00:00"

        mock_session.refresh.side_effect = side_effect_refresh

        response = client.post(
            "/api/prompts/",
            json={
                "name": "test-prompt",
                "template": "Hello {name}",
                "input_variables": ["name"],
                "description": "Test prompt",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "test-prompt"
        assert data["template"] == "Hello {name}"
        assert data["version"] == 1
    finally:
        # Clean up dependency override
        app.dependency_overrides.pop(get_current_user_id, None)


def test_read_prompts(client: TestClient, mock_session: Session):
    # Use test session data (already patched in client fixture)
    from tests.conftest import _test_session_data
    _test_session_data.clear()
    _test_session_data["user_id"] = 1
    
    # Override dependency - must be done on the app, not client.app
    from main import app
    try:
        app.dependency_overrides[get_current_user_id] = lambda: 1

        prompt = Prompt(name="test-prompt", template="Hello", user_id=1, id=1)
        # Mock session.exec for reading prompts
        # session.exec() is called, then .all() is called on the result
        mock_exec_result = MagicMock()
        mock_exec_result.all.return_value = [prompt]
        # Need to set up exec to return the mock result
        mock_session.exec = MagicMock(return_value=mock_exec_result)

        response = client.get("/api/prompts/")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["name"] == "test-prompt"
    finally:
        # Clean up dependency override
        app.dependency_overrides.pop(get_current_user_id, None)


def test_update_prompt(client: TestClient, mock_session: Session):
    # Use test session data (already patched in client fixture)
    from tests.conftest import _test_session_data
    _test_session_data.clear()
    _test_session_data["user_id"] = 1
    
    # Override dependency - must be done on the app, not client.app
    from main import app
    try:
        app.dependency_overrides[get_current_user_id] = lambda: 1

        prompt = Prompt(
            name="test-prompt",
            template="Hello",
            user_id=1,
            id=1,
            version=1)
        mock_session.get.return_value = prompt

        response = client.patch("/api/prompts/1",
                                json={"template": "Hello {name} updated"})
        assert response.status_code == 200
        data = response.json()
        assert data["template"] == "Hello {name} updated"
        assert data["version"] == 2
    finally:
        # Clean up dependency override
        app.dependency_overrides.pop(get_current_user_id, None)
