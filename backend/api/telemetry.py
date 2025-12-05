from fastapi import APIRouter, Depends, HTTPException, Request
from sqlmodel import Session, select

from core.database import get_session
from models.telemetry import Telemetry

router = APIRouter()


@router.get("/", response_model=list[Telemetry])
def read_telemetry(
    request: Request, session: Session = Depends(get_session)
) -> list[Telemetry]:
    user_id = request.session.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")

    if request.session.get("role") == "admin":
        return session.exec(select(Telemetry)).all()
    else:
        return session.exec(select(Telemetry).where(Telemetry.user_id == user_id)).all()
