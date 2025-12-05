from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlmodel import Session, select

from core.database import get_session
from core.limiter import limiter
from core.security import verify_password
from models.user import User

router = APIRouter()


class LoginRequest(BaseModel):
    email: str
    password: str


@router.post("/login")
@limiter.limit("5/minute")
def login(
    request: Request, login_data: LoginRequest, session: Session = Depends(get_session)
) -> dict:
    user = session.exec(select(User).where(User.email == login_data.email)).first()
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect email or password")

    request.session["user_id"] = user.id
    request.session["role"] = user.role
    return {
        "message": "Logged in successfully",
        "user": {"email": user.email, "role": user.role},
    }


@router.post("/logout")
def logout(request: Request) -> dict:
    request.session.clear()
    return {"message": "Logged out successfully"}


@router.get("/me")
def get_current_user(request: Request, session: Session = Depends(get_session)):
    user_id = request.session.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")

    user = session.get(User, user_id)
    if not user:
        request.session.clear()
        raise HTTPException(status_code=401, detail="User not found")

    return {"email": user.email, "role": user.role, "id": user.id}
