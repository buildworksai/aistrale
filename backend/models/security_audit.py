"""Security audit logging model."""

from datetime import datetime
from typing import Any

from sqlalchemy import JSON, Column
from sqlmodel import Field, SQLModel


class SecurityAudit(SQLModel, table=True):
    """Security audit log entry."""

    id: int | None = Field(default=None, primary_key=True)
    __table_args__ = {"extend_existing": True}
    event_type: str = Field(
        index=True
    )  # login_success, login_failure, token_access, etc.
    user_id: int | None = Field(
        default=None, index=True, foreign_key="user.id")
    ip_address: str
    user_agent: str | None = None
    details: dict[str, Any] = Field(default={}, sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)


class SecurityAuditRead(SQLModel):
    """Security audit read model."""

    id: int
    event_type: str
    user_id: int | None
    ip_address: str
    user_agent: str | None
    details: dict[str, Any]
    created_at: datetime
