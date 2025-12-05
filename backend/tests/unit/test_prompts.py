from fastapi.testclient import TestClient
from sqlmodel import Session
from models.prompt import Prompt
from models.user import User
from core.security import get_password_hash

from api.deps import get_current_user_id

def test_create_prompt(client: TestClient, mock_session: Session):
    # Setup user
    user = User(email="test@example.com", password_hash="hash", role="user", id=1)
    
    # Override dependency
    client.app.dependency_overrides[get_current_user_id] = lambda: 1
    
    # Mock session.exec for existing prompt check (return None)
    mock_session.exec.return_value.first.return_value = None
    
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
            "description": "Test prompt"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "test-prompt"
    assert data["template"] == "Hello {name}"
    assert data["version"] == 1

def test_read_prompts(client: TestClient, mock_session: Session):
    # Override dependency
    client.app.dependency_overrides[get_current_user_id] = lambda: 1

    prompt = Prompt(
        name="test-prompt",
        template="Hello",
        user_id=1,
        id=1
    )
    mock_session.exec.return_value.all.return_value = [prompt]

    response = client.get("/api/prompts/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["name"] == "test-prompt"

def test_update_prompt(client: TestClient, mock_session: Session):
    # Override dependency
    client.app.dependency_overrides[get_current_user_id] = lambda: 1

    prompt = Prompt(
        name="test-prompt",
        template="Hello",
        user_id=1,
        id=1,
        version=1
    )
    mock_session.get.return_value = prompt

    response = client.patch(
        "/api/prompts/1",
        json={"template": "Hello {name} updated"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["template"] == "Hello {name} updated"
    assert data["version"] == 2
