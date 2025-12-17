"""Tests for security audit API."""

from unittest.mock import MagicMock

import pytest

from models.security_audit import SecurityAudit
from models.user import User


@pytest.fixture
def admin_user(mock_session):
    """Create admin user."""
    user = User(
        id=1,
        email="admin@test.com",
        password_hash="hashed",
        role="admin")
    mock_session.add(user)
    mock_session.commit()
    return user


@pytest.fixture
def regular_user(mock_session):
    """Create regular user."""
    user = User(
        id=2,
        email="user@test.com",
        password_hash="hashed",
        role="user")
    mock_session.add(user)
    mock_session.commit()
    return user


class TestSecurityAuditAPI:
    """Test security audit API endpoints."""

    def test_list_audit_events_admin(self, client, mock_session, admin_user):
        """Test listing audit events as admin."""
        from api import security_audit
        from core.database import get_session

        # Mock session with audit events
        audit1 = SecurityAudit(
            id=1,
            event_type="login_success",
            user_id=1,
            ip_address="127.0.0.1",
            details={},
        )
        audit2 = SecurityAudit(
            id=2,
            event_type="login_failure",
            user_id=None,
            ip_address="127.0.0.1",
            details={},
        )

        # Mock the query execution
        mock_result = MagicMock()
        mock_result.all.return_value = [audit1, audit2]
        mock_session.exec.return_value = mock_result

        app = client.app

        def mock_require_admin():
            return 1

        def mock_get_session():
            return mock_session

        app.dependency_overrides[security_audit.require_admin] = mock_require_admin
        app.dependency_overrides[get_session] = mock_get_session

        try:
            response = client.get("/api/security-audit/")
            assert response.status_code == 200
            data = response.json()
            assert len(data) == 2
        finally:
            app.dependency_overrides.clear()

    def test_list_audit_events_non_admin(
            self, client, mock_session, regular_user):
        """Test listing audit events as non-admin should fail."""
        from fastapi import HTTPException

        from api import security_audit

        app = client.app

        def mock_require_admin():
            raise HTTPException(
                status_code=403,
                detail="Admin access required")

        app.dependency_overrides[security_audit.require_admin] = mock_require_admin

        try:
            response = client.get("/api/security-audit/")
            assert response.status_code == 403
        finally:
            app.dependency_overrides.clear()
