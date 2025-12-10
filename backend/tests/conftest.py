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
    # Mock rate limiter globally
    from unittest.mock import patch
    with patch("api.auth.limiter") as mock_auth_limiter, \
         patch("api.tokens.limiter") as mock_tokens_limiter, \
         patch("api.inference.limiter") as mock_inference_limiter:
        # Make limiter.limit() return a no-op decorator
        def noop_decorator(func):
            return func
        mock_auth_limiter.limit.return_value = noop_decorator
        mock_tokens_limiter.limit.return_value = noop_decorator
        mock_inference_limiter.limit.return_value = noop_decorator
        
        app.dependency_overrides[get_session] = lambda: mock_session
        yield TestClient(app)
        app.dependency_overrides.clear()


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
    
    from unittest.mock import patch
    with patch("api.auth.verify_password", return_value=True):
        response = client.post(
            "/api/auth/login",
            json={"email": "admin@example.com", "password": "password123"}
        )
        yield client
    app.dependency_overrides.clear()
