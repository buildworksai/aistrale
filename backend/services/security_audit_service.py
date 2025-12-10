"""Security audit logging service."""

from typing import Optional, Dict, Any
from sqlmodel import Session
from models.security_audit import SecurityAudit


def log_security_event(
    session: Session,
    event_type: str,
    ip_address: str,
    user_id: Optional[int] = None,
    user_agent: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
) -> SecurityAudit:
    """
    Log a security event.
    
    Args:
        session: Database session
        event_type: Type of event (login_success, login_failure, token_created, etc.)
        ip_address: IP address of the request
        user_id: Optional user ID
        user_agent: Optional user agent string
        details: Optional additional details as dict
        
    Returns:
        Created SecurityAudit record
    """
    audit = SecurityAudit(
        event_type=event_type,
        user_id=user_id,
        ip_address=ip_address,
        user_agent=user_agent,
        details=details or {},
    )
    session.add(audit)
    session.commit()
    session.refresh(audit)
    return audit

