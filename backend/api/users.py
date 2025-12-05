from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlmodel import Session, select

from core.database import get_session
from core.security import get_password_hash
from models.user import User

router = APIRouter()


class UserCreate(BaseModel):
    email: str
    password: str
    role: str = "user"


@router.post("/", response_model=User)
def create_user(
    user_data: UserCreate, request: Request, session: Session = Depends(get_session)
) -> User:
    # Only admin can create users
    current_role = request.session.get("role")
    if current_role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    existing_user = session.exec(
        select(User).where(User.email == user_data.email)
    ).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=user_data.email,
        password_hash=get_password_hash(user_data.password),
        role=user_data.role,
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@router.get("/", response_model=list[User])
def read_users(request: Request, session: Session = Depends(get_session)) -> list[User]:
    current_role = request.session.get("role")
    if current_role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    users = session.exec(select(User)).all()
    return users
