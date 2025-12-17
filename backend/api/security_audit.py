"""Security audit API endpoints."""

from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlmodel import Session, and_, desc, select

from api.deps import require_admin
from core.database import get_session
from models.security_audit import SecurityAudit, SecurityAuditRead

router = APIRouter()


@router.get("/", response_model=list[SecurityAuditRead])
def list_audit_events(
    session: Session = Depends(get_session),
    user_id: int = Depends(require_admin),
    event_type: str | None = Query(None),
    target_user_id: int | None = Query(None),
    start_date: datetime | None = Query(None),
    end_date: datetime | None = Query(None),
    limit: int = Query(100, le=1000),
    offset: int = Query(0, ge=0),
) -> list[SecurityAudit]:
    """
    List security audit events (admin only).

    Args:
        event_type: Filter by event type
        target_user_id: Filter by user ID
        start_date: Filter by start date
        end_date: Filter by end date
        limit: Maximum number of results
        offset: Offset for pagination
    """
    query = select(SecurityAudit)

    # Apply filters
    conditions = []
    if event_type:
        conditions.append(SecurityAudit.event_type == event_type)
    if target_user_id:
        conditions.append(SecurityAudit.user_id == target_user_id)
    if start_date:
        conditions.append(SecurityAudit.created_at >= start_date)
    if end_date:
        conditions.append(SecurityAudit.created_at <= end_date)

    if conditions:
        query = query.where(and_(*conditions))

    # Order by created_at descending
    query = query.order_by(desc(SecurityAudit.created_at))

    # Apply pagination
    query = query.limit(limit).offset(offset)

    events = session.exec(query).all()
    return events
