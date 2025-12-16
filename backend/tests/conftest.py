import os
import sys
from unittest.mock import MagicMock

import pytest

# Set test environment variables before importing anything else
os.environ["REDIS_URL"] = "memory://"
os.environ["SECRET_KEY"] = "test_secret_key"
os.environ["ENCRYPTION_KEY"] = "NNhJa8dRTe9uryu87t9NBcYnwa1cqICrY2uSDI9VxsY="
os.environ["JAEGER_ENABLED"] = "false"
os.environ["TESTING"] = "true"

# Mock RedisStore before importing main
mock_redis_store_cls = MagicMock()
sys.modules["starsessions.stores.redis"] = MagicMock()
sys.modules["starsessions.stores.redis"].RedisStore = mock_redis_store_cls

from fastapi.testclient import TestClient  # noqa: E402

from core.database import get_session  # noqa: E402
from main import app  # noqa: E402


@pytest.fixture
def mock_session():
    return MagicMock()


@pytest.fixture
def client(mock_session):
    # Mock rate limiter globally - patch at multiple levels
    from unittest.mock import patch, MagicMock
    
    # Create a mock limiter that doesn't actually limit
    mock_limiter = MagicMock()
    def noop_decorator(func):
        return func
    mock_limiter.limit.return_value = noop_decorator
    
    # Patch limiter in all API modules and app state
    with patch("api.auth.limiter", mock_limiter), \
         patch("api.tokens.limiter", mock_limiter), \
         patch("api.inference.limiter", mock_limiter), \
         patch("core.limiter.limiter", mock_limiter):
        # Also patch app.state.limiter
        original_limiter = app.state.limiter
        app.state.limiter = mock_limiter
        
        app.dependency_overrides[get_session] = lambda: mock_session
        yield TestClient(app)
        app.dependency_overrides.clear()
        app.state.limiter = original_limiter


@pytest.fixture
def authenticated_client(client, mock_session):
    """Client with authenticated session."""
    # Login first to set session
    from models.user import User
    from core.security import get_password_hash
    
    user = User(
        id=1,
        email="test@example.com",
        password_hash=get_password_hash("password123"),
        role="user"
    )
    
    mock_result = MagicMock()
    mock_result.first.return_value = user
    mock_session.exec.return_value = mock_result
    
    # Mock verify_password
    from unittest.mock import patch
    with patch("api.auth.verify_password", return_value=True):
        response = client.post(
            "/api/auth/login",
            json={"email": "test@example.com", "password": "password123"}
        )
        if response.status_code == 200:
            # Session is now set via cookies
            yield client
        else:
            yield client
    app.dependency_overrides.clear()


@pytest.fixture
def admin_client(client, mock_session):
    """Client with admin session."""
    from models.user import User
    from core.security import get_password_hash
    
    admin = User(
        id=1,
        email="admin@example.com",
        password_hash=get_password_hash("password123"),
        role="admin"
    )
    
    mock_result = MagicMock()
    mock_result.first.return_value = admin
    mock_session.exec.return_value = mock_result
    mock_session.get.return_value = admin
    
    from unittest.mock import patch
    with patch("api.auth.verify_password", return_value=True):
        response = client.post(
            "/api/auth/login",
            json={"email": "admin@example.com", "password": "password123"}
        )
        yield client
    app.dependency_overrides.clear()


def set_session_user(client, user_id: int, role: str = "user"):
    """Helper to set user in session for testing."""
    from unittest.mock import patch, MagicMock
    from models.user import User
    
    # Mock the session middleware to return a session with user_id
    mock_session_dict = {"user_id": user_id, "role": role}
    
    def mock_get_session(request):
        return mock_session_dict
    
    # Patch request.session.get to return our mock session
    original_request = client.app.request_class
    
    class MockRequest(original_request):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)
            self._session = mock_session_dict
        
        @property
        def session(self):
            return self._session
    
    client.app.request_class = MockRequest
    return client
