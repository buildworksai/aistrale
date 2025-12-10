"""Data Loss Prevention API endpoints."""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlmodel import Session, select
from pydantic import BaseModel

from core.database import get_session
from api.deps import get_current_user_id, require_admin
from services.dlp_service import DLPService
from services.pii_detection_service import PIIDetectionService
from models.dlp_rule import DLPRule, DLPAction
import structlog

logger = structlog.get_logger()
router = APIRouter()


class RedactRequest(BaseModel):
    text: str


class RedactResponse(BaseModel):
    redacted_text: str
    is_blocked: bool
    violations: List[str]


class DLPRuleCreate(BaseModel):
    name: str
    pattern: str
    action: DLPAction
    is_active: bool = True
    priority: int = 0


class DLPRuleRead(BaseModel):
    id: int
    name: str
    pattern: str
    action: str
    is_active: bool
    priority: int

    class Config:
        from_attributes = True


class DLPRuleUpdate(BaseModel):
    name: Optional[str] = None
    pattern: Optional[str] = None
    action: Optional[DLPAction] = None
    is_active: Optional[bool] = None
    priority: Optional[int] = None


class DLPViolationRead(BaseModel):
    rule_name: str
    violation_type: str
    message: str


def get_dlp_service(session: Session = Depends(get_session)) -> DLPService:
    """Dependency to get DLP service instance."""
    pii_service = PIIDetectionService()
    return DLPService(pii_service=pii_service, session=session)


@router.post("/redact", response_model=RedactResponse)
def redact_pii(
    request: RedactRequest,
    dlp_service: DLPService = Depends(get_dlp_service),
    user_id: int = Depends(get_current_user_id),
) -> RedactResponse:
    """Redact PII from text."""
    is_blocked, processed_text, violations = dlp_service.scan_content(request.text)

    logger.info(
        "dlp_scan_completed",
        is_blocked=is_blocked,
        violation_count=len(violations),
        user_id=user_id,
    )

    return RedactResponse(
        redacted_text=processed_text,
        is_blocked=is_blocked,
        violations=violations,
    )


@router.get("/rules", response_model=List[DLPRuleRead])
def list_dlp_rules(
    request: Request,
    session: Session = Depends(get_session),
    user_id: int = Depends(get_current_user_id),
) -> List[DLPRule]:
    """List all DLP rules."""
    rules = session.exec(select(DLPRule).order_by(DLPRule.priority.desc())).all()
    return rules


@router.post("/rules", response_model=DLPRuleRead, status_code=201)
def create_dlp_rule(
    request: Request,
    rule_data: DLPRuleCreate,
    session: Session = Depends(get_session),
    user_id: int = Depends(require_admin),
) -> DLPRule:
    """Create a new DLP rule (admin only)."""
    # Validate regex pattern
    import re
    try:
        re.compile(rule_data.pattern)
    except re.error as e:
        raise HTTPException(status_code=400, detail=f"Invalid regex pattern: {e}")

    rule = DLPRule(
        name=rule_data.name,
        pattern=rule_data.pattern,
        action=rule_data.action,
        is_active=rule_data.is_active,
        priority=rule_data.priority,
    )
    session.add(rule)
    session.commit()
    session.refresh(rule)

    logger.info(
        "dlp_rule_created",
        rule_id=rule.id,
        rule_name=rule.name,
        user_id=user_id,
    )

    return rule


@router.get("/rules/{rule_id}", response_model=DLPRuleRead)
def get_dlp_rule(
    request: Request,
    rule_id: int,
    session: Session = Depends(get_session),
    user_id: int = Depends(get_current_user_id),
) -> DLPRule:
    """Get a specific DLP rule."""
    rule = session.get(DLPRule, rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="DLP rule not found")
    return rule


@router.patch("/rules/{rule_id}", response_model=DLPRuleRead)
def update_dlp_rule(
    request: Request,
    rule_id: int,
    rule_data: DLPRuleUpdate,
    session: Session = Depends(get_session),
    user_id: int = Depends(require_admin),
) -> DLPRule:
    """Update a DLP rule (admin only)."""
    rule = session.get(DLPRule, rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="DLP rule not found")

    if rule_data.name:
        rule.name = rule_data.name
    if rule_data.pattern:
        # Validate regex pattern
        import re
        try:
            re.compile(rule_data.pattern)
        except re.error as e:
            raise HTTPException(status_code=400, detail=f"Invalid regex pattern: {e}")
        rule.pattern = rule_data.pattern
    if rule_data.action:
        rule.action = rule_data.action
    if rule_data.is_active is not None:
        rule.is_active = rule_data.is_active
    if rule_data.priority is not None:
        rule.priority = rule_data.priority

    session.add(rule)
    session.commit()
    session.refresh(rule)

    logger.info(
        "dlp_rule_updated",
        rule_id=rule.id,
        user_id=user_id,
    )

    return rule


@router.delete("/rules/{rule_id}", status_code=204)
def delete_dlp_rule(
    request: Request,
    rule_id: int,
    session: Session = Depends(get_session),
    user_id: int = Depends(require_admin),
) -> None:
    """Delete a DLP rule (admin only)."""
    rule = session.get(DLPRule, rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="DLP rule not found")

    session.delete(rule)
    session.commit()

    logger.info(
        "dlp_rule_deleted",
        rule_id=rule_id,
        user_id=user_id,
    )
