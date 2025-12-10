"""Security audit logging model."""

from datetime import datetime
from typing import Optional, Dict, Any

from sqlalchemy import Column, JSON
from sqlmodel import Field, SQLModel


class SecurityAudit(SQLModel, table=True):
    """Security audit log entry."""

    id: Optional[int] = Field(default=None, primary_key=True)
    event_type: str = Field(index=True)  # login_success, login_failure, token_access, etc.
    user_id: Optional[int] = Field(default=None, index=True, foreign_key="user.id")
    ip_address: str
    user_agent: Optional[str] = None
    details: Dict[str, Any] = Field(default={}, sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)


class SecurityAuditRead(SQLModel):
    """Security audit read model."""

    id: int
    event_type: str
    user_id: Optional[int]
    ip_address: str
    user_agent: Optional[str]
    details: Dict[str, Any]
    created_at: datetime

