"""Comprehensive tests for security audit API endpoints."""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import MagicMock, patch
from datetime import datetime, timedelta
from sqlmodel import Session, select
from models.security_audit import SecurityAudit
from api.deps import require_admin


class TestSecurityAuditAPI:
    """Comprehensive tests for security audit endpoints."""

    @pytest.fixture
    def test_audit_events(self):
        """Create test audit events."""
        return [
            SecurityAudit(
                id=1,
                event_type="login_success",
                user_id=1,
                ip_address="127.0.0.1",
                details={},
                created_at=datetime.utcnow()
            ),
            SecurityAudit(
                id=2,
                event_type="login_failure",
                user_id=None,
                ip_address="127.0.0.1",
                details={},
                created_at=datetime.utcnow() - timedelta(hours=1)
            ),
            SecurityAudit(
                id=3,
                event_type="token_access",
                user_id=1,
                ip_address="127.0.0.1",
                details={},
                created_at=datetime.utcnow() - timedelta(hours=2)
            )
        ]

    def test_list_audit_events_as_admin(self, client, mock_session, test_audit_events):
        """Test listing audit events as admin."""
        from api import security_audit
        from core.database import get_session
        
        app = client.app
        
        def mock_require_admin():
            return 1
        
        def mock_get_session():
            return mock_session
        
        app.dependency_overrides[require_admin] = mock_require_admin
        app.dependency_overrides[get_session] = mock_get_session
        
        mock_result = MagicMock()
        mock_result.all.return_value = test_audit_events
        mock_session.exec.return_value = mock_result
        
        response = client.get("/api/security-audit/")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3
        
        app.dependency_overrides.clear()

    def test_list_audit_events_with_event_type_filter(self, client, mock_session, test_audit_events):
        """Test listing audit events filtered by event type."""
        from api import security_audit
        from core.database import get_session
        
        app = client.app
        
        def mock_require_admin():
            return 1
        
        def mock_get_session():
            return mock_session
        
        app.dependency_overrides[require_admin] = mock_require_admin
        app.dependency_overrides[get_session] = mock_get_session
        
        # Filter to only login_success
        filtered_events = [e for e in test_audit_events if e.event_type == "login_success"]
        mock_result = MagicMock()
        mock_result.all.return_value = filtered_events
        mock_session.exec.return_value = mock_result
        
        response = client.get("/api/security-audit/?event_type=login_success")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["event_type"] == "login_success"
        
        app.dependency_overrides.clear()

    def test_list_audit_events_with_user_filter(self, client, mock_session, test_audit_events):
        """Test listing audit events filtered by user ID."""
        from api import security_audit
        from core.database import get_session
        
        app = client.app
        
        def mock_require_admin():
            return 1
        
        def mock_get_session():
            return mock_session
        
        app.dependency_overrides[require_admin] = mock_require_admin
        app.dependency_overrides[get_session] = mock_get_session
        
        # Filter to user_id=1
        filtered_events = [e for e in test_audit_events if e.user_id == 1]
        mock_result = MagicMock()
        mock_result.all.return_value = filtered_events
        mock_session.exec.return_value = mock_result
        
        response = client.get("/api/security-audit/?target_user_id=1")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        
        app.dependency_overrides.clear()

    def test_list_audit_events_with_date_filter(self, client, mock_session, test_audit_events):
        """Test listing audit events filtered by date range."""
        from api import security_audit
        from core.database import get_session
        
        app = client.app
        
        def mock_require_admin():
            return 1
        
        def mock_get_session():
            return mock_session
        
        app.dependency_overrides[require_admin] = mock_require_admin
        app.dependency_overrides[get_session] = mock_get_session
        
        # Filter to last hour
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(hours=1)
        filtered_events = [
            e for e in test_audit_events
            if start_date <= e.created_at <= end_date
        ]
        mock_result = MagicMock()
        mock_result.all.return_value = filtered_events
        mock_session.exec.return_value = mock_result
        
        response = client.get(
            f"/api/security-audit/?start_date={start_date.isoformat()}&end_date={end_date.isoformat()}"
        )
        assert response.status_code == 200
        
        app.dependency_overrides.clear()

    def test_list_audit_events_with_pagination(self, client, mock_session, test_audit_events):
        """Test listing audit events with pagination."""
        from api import security_audit
        from core.database import get_session
        
        app = client.app
        
        def mock_require_admin():
            return 1
        
        def mock_get_session():
            return mock_session
        
        app.dependency_overrides[require_admin] = mock_require_admin
        app.dependency_overrides[get_session] = mock_get_session
        
        # Return first 2 events
        paginated_events = test_audit_events[:2]
        mock_result = MagicMock()
        mock_result.all.return_value = paginated_events
        mock_session.exec.return_value = mock_result
        
        response = client.get("/api/security-audit/?limit=2&offset=0")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        
        app.dependency_overrides.clear()

    def test_list_audit_events_not_admin(self, client, mock_session):
        """Test listing audit events as non-admin."""
        from api import security_audit
        from core.database import get_session
        from fastapi import HTTPException
        
        app = client.app
        
        def mock_require_admin():
            raise HTTPException(status_code=403, detail="Admin access required")
        
        def mock_get_session():
            return mock_session
        
        app.dependency_overrides[require_admin] = mock_require_admin
        app.dependency_overrides[get_session] = mock_get_session
        
        response = client.get("/api/security-audit/")
        assert response.status_code == 403
        
        app.dependency_overrides.clear()

