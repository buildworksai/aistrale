"""Comprehensive tests for prompts API endpoints."""

from unittest.mock import MagicMock

import pytest

from api.deps import get_current_user_id
from models.prompt import Prompt


class TestPromptsAPI:
    """Comprehensive tests for prompts endpoints."""

    @pytest.fixture
    def test_prompt(self):
        """Create a test prompt."""
        return Prompt(
            id=1,
            name="test-prompt",
            template="Hello {{ name }}",
            input_variables=["name"],
            user_id=1,
            version=1,
        )

    def test_create_prompt(self, client, mock_session, test_prompt):
        """Test creating a prompt."""
        from core.database import get_session

        app = client.app

        def mock_get_current_user_id():
            return 1

        def mock_get_session():
            return mock_session

        app.dependency_overrides[get_current_user_id] = mock_get_current_user_id
        app.dependency_overrides[get_session] = mock_get_session

        # Mock prompt doesn't exist
        mock_result = MagicMock()
        mock_result.first.return_value = None
        mock_session.exec.return_value = mock_result

        mock_session.add = MagicMock()
        mock_session.commit = MagicMock()
        from datetime import datetime
        def mock_refresh(obj):
            # response_model PromptRead requires id/created_at/updated_at
            obj.id = 1
            if getattr(obj, "created_at", None) is None:
                obj.created_at = datetime.utcnow()
            if getattr(obj, "updated_at", None) is None:
                obj.updated_at = datetime.utcnow()
        mock_session.refresh = MagicMock(side_effect=mock_refresh)

        response = client.post(
            "/api/prompts/",
            json={
                "name": "test-prompt",
                "template": "Hello {{ name }}",
                "input_variables": ["name"],
            },
        )
        assert response.status_code == 200

        app.dependency_overrides.clear()

    def test_create_prompt_name_exists(
            self, client, mock_session, test_prompt):
        """Test creating a prompt with existing name."""
        from core.database import get_session

        app = client.app

        def mock_get_current_user_id():
            return 1

        def mock_get_session():
            return mock_session

        app.dependency_overrides[get_current_user_id] = mock_get_current_user_id
        app.dependency_overrides[get_session] = mock_get_session

        # Mock prompt exists
        mock_result = MagicMock()
        mock_result.first.return_value = test_prompt
        mock_session.exec.return_value = mock_result

        response = client.post(
            "/api/prompts/",
            json={
                "name": "test-prompt",
                "template": "Hello {{ name }}",
                "input_variables": ["name"],
            },
        )
        assert response.status_code == 400
        assert "already exists" in response.json()["detail"]

        app.dependency_overrides.clear()

    def test_read_prompts(self, client, mock_session, test_prompt):
        """Test reading prompts."""
        from core.database import get_session

        app = client.app

        def mock_get_current_user_id():
            return 1

        def mock_get_session():
            return mock_session

        app.dependency_overrides[get_current_user_id] = mock_get_current_user_id
        app.dependency_overrides[get_session] = mock_get_session

        mock_result = MagicMock()
        mock_result.all.return_value = [test_prompt]
        mock_session.exec.return_value = mock_result

        response = client.get("/api/prompts/")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1

        app.dependency_overrides.clear()

    def test_read_prompt(self, client, mock_session, test_prompt):
        """Test reading a single prompt."""
        from core.database import get_session

        app = client.app

        def mock_get_current_user_id():
            return 1

        def mock_get_session():
            return mock_session

        app.dependency_overrides[get_current_user_id] = mock_get_current_user_id
        app.dependency_overrides[get_session] = mock_get_session

        mock_session.get.return_value = test_prompt

        response = client.get("/api/prompts/1")
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "test-prompt"

        app.dependency_overrides.clear()

    def test_read_prompt_not_found(self, client, mock_session):
        """Test reading a non-existent prompt."""
        from core.database import get_session

        app = client.app

        def mock_get_current_user_id():
            return 1

        def mock_get_session():
            return mock_session

        app.dependency_overrides[get_current_user_id] = mock_get_current_user_id
        app.dependency_overrides[get_session] = mock_get_session

        mock_session.get.return_value = None

        response = client.get("/api/prompts/999")
        assert response.status_code == 404

        app.dependency_overrides.clear()

    def test_update_prompt(self, client, mock_session, test_prompt):
        """Test updating a prompt."""
        from core.database import get_session

        app = client.app

        def mock_get_current_user_id():
            return 1

        def mock_get_session():
            return mock_session

        app.dependency_overrides[get_current_user_id] = mock_get_current_user_id
        app.dependency_overrides[get_session] = mock_get_session

        mock_session.get.return_value = test_prompt
        mock_session.add = MagicMock()
        mock_session.commit = MagicMock()
        mock_session.refresh = MagicMock()

        response = client.patch(
            "/api/prompts/1", json={"template": "Updated template {{ name }}"}
        )
        assert response.status_code == 200

        app.dependency_overrides.clear()

    def test_update_prompt_not_found(self, client, mock_session):
        """Test updating a non-existent prompt."""
        from core.database import get_session

        app = client.app

        def mock_get_current_user_id():
            return 1

        def mock_get_session():
            return mock_session

        app.dependency_overrides[get_current_user_id] = mock_get_current_user_id
        app.dependency_overrides[get_session] = mock_get_session

        mock_session.get.return_value = None

        response = client.patch(
            "/api/prompts/999",
            json={
                "template": "Updated"})
        assert response.status_code == 404

        app.dependency_overrides.clear()

    def test_delete_prompt_as_admin(self, client, mock_session, test_prompt):
        """Test deleting a prompt as admin."""
        from core.database import get_session

        app = client.app

        import tests.conftest as conftest_module
        conftest_module._test_session_data.update({"user_id": 1, "role": "admin"})

        def mock_get_current_user_id():
            return 1

        def mock_get_session():
            return mock_session

        app.dependency_overrides[get_current_user_id] = mock_get_current_user_id
        app.dependency_overrides[get_session] = mock_get_session

        # Set session as admin
        # Note: Role check happens via require_admin dependency or
        # request.session

        # For admin endpoints, use require_admin dependency override

        mock_session.get.return_value = test_prompt
        mock_session.delete = MagicMock()
        mock_session.commit = MagicMock()

        response = client.delete("/api/prompts/1")
        assert response.status_code == 200
        assert response.json()["ok"] is True

        app.dependency_overrides.clear()

    def test_delete_prompt_not_admin(self, client, mock_session, test_prompt):
        """Test deleting a prompt as non-admin."""
        from core.database import get_session

        app = client.app

        import tests.conftest as conftest_module
        conftest_module._test_session_data.update({"user_id": 1, "role": "user"})

        def mock_get_current_user_id():
            return 1

        def mock_get_session():
            return mock_session

        app.dependency_overrides[get_current_user_id] = mock_get_current_user_id
        app.dependency_overrides[get_session] = mock_get_session

        # Set session as regular user
        # Note: Role check happens via require_admin dependency or
        # request.session

        # For admin endpoints, use require_admin dependency override

        mock_session.get.return_value = test_prompt

        response = client.delete("/api/prompts/1")
        assert response.status_code == 403

        app.dependency_overrides.clear()

    def test_delete_prompt_not_found(self, client, mock_session):
        """Test deleting a non-existent prompt."""
        from core.database import get_session

        app = client.app

        import tests.conftest as conftest_module
        conftest_module._test_session_data.update({"user_id": 1, "role": "admin"})

        def mock_get_current_user_id():
            return 1

        def mock_get_session():
            return mock_session

        app.dependency_overrides[get_current_user_id] = mock_get_current_user_id
        app.dependency_overrides[get_session] = mock_get_session

        # Set session as admin
        # Note: Role check happens via require_admin dependency or
        # request.session

        # For admin endpoints, use require_admin dependency override

        mock_session.get.return_value = None

        response = client.delete("/api/prompts/999")
        assert response.status_code == 404

        app.dependency_overrides.clear()
