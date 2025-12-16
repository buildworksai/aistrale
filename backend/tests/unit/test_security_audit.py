"""Tests for security audit service."""

import pytest
from sqlmodel import Session, create_engine, SQLModel
from services.security_audit_service import log_security_event


@pytest.fixture
def test_db():
    """Create test database."""
    engine = create_engine("sqlite:///:memory:")
    SQLModel.metadata.create_all(engine)

    with Session(engine) as session:
        yield session

    SQLModel.metadata.drop_all(engine)


class TestSecurityAuditService:
    """Test security audit service."""

    def test_log_security_event(self, test_db):
        """Test logging security event."""
        audit = log_security_event(
            session=test_db,
            event_type="login_success",
            ip_address="127.0.0.1",
            user_id=1,
            user_agent="test-agent",
            details={"email": "test@example.com"},
        )

        assert audit.id is not None
        assert audit.event_type == "login_success"
        assert audit.ip_address == "127.0.0.1"
        assert audit.user_id == 1
        assert audit.user_agent == "test-agent"
        assert audit.details == {"email": "test@example.com"}

    def test_log_security_event_minimal(self, test_db):
        """Test logging security event with minimal data."""
        audit = log_security_event(
            session=test_db,
            event_type="login_failure",
            ip_address="127.0.0.1",
        )

        assert audit.id is not None
        assert audit.event_type == "login_failure"
        assert audit.ip_address == "127.0.0.1"
        assert audit.user_id is None
        assert audit.user_agent is None
        assert audit.details == {}
