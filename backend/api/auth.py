from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlmodel import Session, select
from typing import Dict, Any

from core.database import get_session
from core.limiter import limit
from core.security import verify_password
from models.user import User
from services.security_audit_service import log_security_event
from api.deps import get_session_data

router = APIRouter()


class LoginRequest(BaseModel):
    email: str
    password: str


@router.post("/login")
@limit("5/minute")
def login(
    request: Request,
    login_data: LoginRequest,
    session: Session = Depends(get_session),
    session_data: Dict[str, Any] = Depends(get_session_data),
) -> dict:
    user = session.exec(
        select(User).where(
            User.email == login_data.email)).first()
    ip_address = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent")

    if not user or not verify_password(
            login_data.password,
            user.password_hash):
        # Log failed login attempt
        log_security_event(
            session=session,
            event_type="login_failure",
            ip_address=ip_address,
            user_agent=user_agent,
            details={"email": login_data.email},
        )
        raise HTTPException(
            status_code=400,
            detail="Incorrect email or password")

    # Log successful login
    log_security_event(
        session=session,
        event_type="login_success",
        ip_address=ip_address,
        user_id=user.id,
        user_agent=user_agent,
        details={"email": user.email},
    )

    # Set session values using dependency-injected session_data
    session_data["user_id"] = user.id
    session_data["role"] = user.role

    return {
        "message": "Logged in successfully",
        "user": {"email": user.email, "role": user.role},
    }


@router.post("/logout")
def logout(
    request: Request,
    session: Session = Depends(get_session),
    session_data: Dict[str, Any] = Depends(get_session_data),
) -> dict:
    user_id = session_data.get("user_id")
    ip_address = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent")

    # Log logout
    log_security_event(
        session=session,
        event_type="logout",
        ip_address=ip_address,
        user_id=user_id,
        user_agent=user_agent,
    )

    session_data.clear()
    return {"message": "Logged out successfully"}


@router.get("/me")
def get_current_user(
    request: Request,
    session: Session = Depends(get_session),
    session_data: Dict[str, Any] = Depends(get_session_data),
):
    user_id = session_data.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")

    user = session.get(User, user_id)
    if not user:
        session_data.clear()
        raise HTTPException(status_code=401, detail="User not found")

    return {"email": user.email, "role": user.role, "id": user.id}
