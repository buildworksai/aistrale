import os
import sys
from unittest.mock import MagicMock, patch

import pytest

# Set test environment variables before importing anything else
os.environ["REDIS_URL"] = "memory://"
os.environ["SECRET_KEY"] = "test_secret_key"
os.environ["ENCRYPTION_KEY"] = "NNhJa8dRTe9uryu87t9NBcYnwa1cqICrY2uSDI9VxsY="
os.environ["JAEGER_ENABLED"] = "false"
os.environ["TESTING"] = "true"
# Disable OpenTelemetry SDK completely
os.environ["OTEL_SDK_DISABLED"] = "true"

# Clear settings cache to ensure TESTING=True is picked up
from core.config import clear_settings_cache  # noqa: E402

clear_settings_cache()

# CRITICAL: Patch the limiter BEFORE any API modules are imported
# This ensures the @limiter.limit decorator uses our mock limiter
# and doesn't wrap functions in a way that breaks FastAPI's dependency injection
mock_limiter_global = MagicMock()

def noop_decorator_global(func):
    """Decorator that returns the function unchanged - preserves FastAPI DI."""
    return func

mock_limiter_global.limit = MagicMock(return_value=noop_decorator_global)

def mock_inject_headers_global(response, view_rate_limit):
    return response
mock_limiter_global._inject_headers = mock_inject_headers_global

# Patch the limiter at the module level BEFORE importing API modules
with patch("core.limiter.limiter", mock_limiter_global):
    # Mock RedisStore before importing main
    mock_redis_store_cls = MagicMock()
    sys.modules["starsessions.stores.redis"] = MagicMock()
    sys.modules["starsessions.stores.redis"].RedisStore = mock_redis_store_cls

from fastapi.testclient import TestClient  # noqa: E402
from fastapi import Request  # noqa: E402

from core.database import get_session  # noqa: E402
from api.deps import get_session_data  # noqa: E402
from main import app  # noqa: E402

# Initialize view_rate_limit for slowapi before any tests run
# SlowAPIMiddleware expects this to exist
# Set it immediately after importing app
if not hasattr(app.state, 'view_rate_limit'):
    app.state.view_rate_limit = {}

# Global test session data - shared across all tests
# This will be overridden by get_session_data dependency
_test_session_data = {}

# Ensure imports of `tests.conftest` resolve to this exact module instance.
# Pytest loads this file as `conftest`, but some tests (and this file itself)
# import `tests.conftest`, which would otherwise create a second module object
# with a different `_test_session_data` dict.
sys.modules["tests.conftest"] = sys.modules[__name__]


@pytest.fixture(autouse=True)
def reset_test_session_data():
    """Reset shared session data before each test to avoid auth state leakage."""
    _test_session_data.clear()
    yield


@pytest.fixture(autouse=True)
def reset_rate_limiter():
    """Reset rate limiter state before each test to prevent 429 errors."""
    # Clear rate limiter state before each test
    if hasattr(app.state, 'view_rate_limit'):
        app.state.view_rate_limit.clear()
    yield
    # Clear again after test
    if hasattr(app.state, 'view_rate_limit'):
        app.state.view_rate_limit.clear()


@pytest.fixture
def mock_session():
    """Create a mock session with proper method mocks."""
    session = MagicMock()
    # Mock commit and refresh to do nothing (they're called by
    # log_security_event)
    session.commit = MagicMock()
    session.refresh = MagicMock()
    session.add = MagicMock()
    session.delete = MagicMock()
    session.get = MagicMock()
    session.exec = MagicMock()
    return session


@pytest.fixture
def client(mock_session):
    # Use the global mock limiter that was patched before module import
    # This ensures the decorator never wrapped the functions
    # The limiter was already patched at module import time, so functions
    # should not be wrapped. But we still need to set it in modules and app.state
    mock_limiter = mock_limiter_global

    # Mock log_security_event to avoid database issues - patch at service level
    mock_audit = MagicMock()
    mock_log_security = MagicMock(return_value=mock_audit)

    # Patch limiter in all API modules and app state
    # The slowapi decorator is applied at import time, but we've mocked the limiter
    # so the decorator will use our mock. However, the decorator may have already
    # wrapped the function. We need to ensure the limiter is patched BEFORE the
    # decorator is applied, or we need to unwrap the functions.
    import api.auth
    import api.tokens
    import api.inference
    
    # Store original limiters
    original_auth_limiter = getattr(api.auth, "limiter", None)
    original_tokens_limiter = getattr(api.tokens, "limiter", None)
    original_inference_limiter = getattr(api.inference, "limiter", None)
    
    # Replace limiters in modules - this won't help if decorator already applied
    api.auth.limiter = mock_limiter
    api.tokens.limiter = mock_limiter
    api.inference.limiter = mock_limiter
    
    # The decorator has already been applied at import time, so we need to
    # unwrap the functions if they were wrapped. Check if the function has
    # been wrapped by looking for __wrapped__ attribute.
    # If wrapped, we need to replace the route handler in the router
    # This is critical - FastAPI's dependency injection breaks if the function
    # is wrapped by slowapi's decorator
    for route in api.auth.router.routes:
        if hasattr(route, 'path') and route.path == '/login' and hasattr(route, 'endpoint'):
            if hasattr(route.endpoint, '__wrapped__'):
                # Replace the endpoint with the unwrapped function
                route.endpoint = route.endpoint.__wrapped__
                # Also update the module reference
                if hasattr(api.auth, 'login'):
                    api.auth.login = route.endpoint
            break
    
    # Do the same for tokens and inference if needed
    for route in api.tokens.router.routes:
        if hasattr(route, 'path') and route.path == '/' and hasattr(route, 'endpoint'):
            if hasattr(route.endpoint, '__wrapped__'):
                route.endpoint = route.endpoint.__wrapped__
                if hasattr(api.tokens, 'create_token'):
                    api.tokens.create_token = route.endpoint
            break
    
    for route in api.inference.router.routes:
        if hasattr(route, 'path') and route.path == '/run' and hasattr(route, 'endpoint'):
            if hasattr(route.endpoint, '__wrapped__'):
                route.endpoint = route.endpoint.__wrapped__
                if hasattr(api.inference, 'run_inference_endpoint'):
                    api.inference.run_inference_endpoint = route.endpoint
            break
    
    # Set up app.state for slowapi before creating TestClient
    # SlowAPIMiddleware expects view_rate_limit to exist
    original_limiter = getattr(app.state, 'limiter', None)
    original_view_rate_limit = getattr(app.state, 'view_rate_limit', None)
    
    app.state.limiter = mock_limiter
    app.state.view_rate_limit = {}
    
    # Also patch get_session_data directly at module level for reliable testing
    with patch(
        "core.limiter.limiter", mock_limiter
    ), patch(
        "services.security_audit_service.log_security_event", mock_log_security
    ), patch(
        "api.auth.log_security_event", mock_log_security
    ), patch(
        "api.tokens.log_security_event", mock_log_security
    ), patch(
        "api.inference.log_security_event", mock_log_security
    ), patch(
        "api.deps.get_session_data", return_value=_test_session_data
    ):
        app.dependency_overrides[get_session] = lambda: mock_session
        # Override get_session_data to return the test session dict
        # The override function should NOT require Request parameter
        # FastAPI will inject Request automatically, but our override ignores it
        def get_session_data_override(request: Request = None):
            return _test_session_data
        app.dependency_overrides[get_session_data] = get_session_data_override
        yield TestClient(app)
        app.dependency_overrides.clear()
        # Don't clear test session data here - let each test manage it
        # _test_session_data.clear()
    
    # Restore app.state
    if original_limiter is not None:
        app.state.limiter = original_limiter
    elif hasattr(app.state, 'limiter'):
        delattr(app.state, 'limiter')
    
    if original_view_rate_limit is not None:
        app.state.view_rate_limit = original_view_rate_limit
    elif hasattr(app.state, 'view_rate_limit'):
        delattr(app.state, 'view_rate_limit')
    
    # Restore original limiters
    if original_auth_limiter is not None:
        api.auth.limiter = original_auth_limiter
    if original_tokens_limiter is not None:
        api.tokens.limiter = original_tokens_limiter
    if original_inference_limiter is not None:
        api.inference.limiter = original_inference_limiter


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
        role="user",
    )

    mock_result = MagicMock()
    mock_result.first.return_value = user
    mock_session.exec.return_value = mock_result

    # Mock verify_password
    from unittest.mock import patch

    with patch("api.auth.verify_password", return_value=True):
        response = client.post(
            "/api/auth/login",
            json={"email": "test@example.com", "password": "password123"},
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
        role="admin",
    )

    mock_result = MagicMock()
    mock_result.first.return_value = admin
    mock_session.exec.return_value = mock_result
    mock_session.get.return_value = admin

    from unittest.mock import patch

    with patch("api.auth.verify_password", return_value=True):
        response = client.post(
            "/api/auth/login",
            json={"email": "admin@example.com", "password": "password123"},
        )
        yield client
    app.dependency_overrides.clear()


def set_session_user(client, user_id: int, role: str = "user"):
    """Helper to set user in session for testing."""

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
