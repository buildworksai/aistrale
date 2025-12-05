import os
import sys
from unittest.mock import MagicMock

import pytest

# Set test environment variables before importing anything else
os.environ["REDIS_URL"] = "memory://"
os.environ["SECRET_KEY"] = "test_secret_key"
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
    app.dependency_overrides[get_session] = lambda: mock_session
    yield TestClient(app)
    app.dependency_overrides.clear()
