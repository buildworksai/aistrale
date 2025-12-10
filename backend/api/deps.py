from fastapi import HTTPException, Request, Depends
from sqlmodel import Session
from models.user import User
from core.database import get_session

def get_current_user_id(request: Request) -> int:
    user_id = request.session.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user_id

def require_admin(
    request: Request,
    session: Session = Depends(get_session),
) -> int:
    """Require admin role."""
    user_id = request.session.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    user = session.get(User, user_id)
    if not user or user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    return user_id
