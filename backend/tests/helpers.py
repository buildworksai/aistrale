"""Test helpers for API testing."""

from unittest.mock import MagicMock
from fastapi import Request


def create_mock_request(user_id=None, role=None, ip_address="127.0.0.1", user_agent="test-agent"):
    """Create a mock request with session data."""
    request = MagicMock(spec=Request)
    request.session = {}
    if user_id:
        request.session["user_id"] = user_id
    if role:
        request.session["role"] = role
    
    request.client = MagicMock()
    request.client.host = ip_address
    request.headers = MagicMock()
    request.headers.get = MagicMock(return_value=user_agent)
    return request


def patch_request_session(monkeypatch, user_id=None, role=None):
    """Patch request.session.get to return test values."""
    original_get = dict.get
    
    def mock_session_get(self, key, default=None):
        if key == "user_id" and user_id:
            return user_id
        if key == "role" and role:
            return role
        return original_get(self, key, default)
    
    monkeypatch.setattr(dict, "get", mock_session_get)
