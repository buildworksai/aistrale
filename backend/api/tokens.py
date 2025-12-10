from fastapi import APIRouter, Depends, HTTPException, Request
from sqlmodel import Session, select

from core.database import get_session
from core.limiter import limiter
from api.deps import get_current_user_id
from models.token import Token, TokenCreate, TokenRead
from services.security_audit_service import log_security_event

router = APIRouter()


@router.post("/", response_model=TokenRead)
@limiter.limit("5/hour")
def create_token(
    token_in: TokenCreate,
    request: Request,
    session: Session = Depends(get_session),
    user_id: int = Depends(get_current_user_id)
) -> Token:
    token = Token(
        user_id=user_id,
        provider=token_in.provider,
        label=token_in.label,
        is_default=token_in.is_default,
        encrypted_token="" # Initialize
    )
    token.set_token(token_in.token_value, session)

    if token.is_default:
        # Unset other defaults for this user
        existing_defaults = session.exec(
            select(Token).where(Token.user_id == user_id, Token.is_default.is_(True))
        ).all()
        for t in existing_defaults:
            t.is_default = False
            session.add(t)

    session.add(token)
    session.commit()
    session.refresh(token)
    return token


@router.get("/", response_model=list[TokenRead])
def read_tokens(
    request: Request,
    session: Session = Depends(get_session),
    user_id: int = Depends(get_current_user_id)
) -> list[Token]:
    tokens = session.exec(select(Token).where(Token.user_id == user_id)).all()
    return tokens


@router.delete("/{token_id}")
def delete_token(
    token_id: int,
    request: Request,
    session: Session = Depends(get_session),
    user_id: int = Depends(get_current_user_id)
) -> dict:
    token = session.get(Token, token_id)
    if not token or token.user_id != user_id:
        raise HTTPException(status_code=404, detail="Token not found")
    
    # Log token deletion
    ip_address = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent")
    log_security_event(
        session=session,
        event_type="token_deleted",
        ip_address=ip_address,
        user_id=user_id,
        user_agent=user_agent,
        details={"provider": token.provider, "token_id": token_id},
    )
    
    session.delete(token)
    session.commit()
    return {"ok": True}


@router.put("/{token_id}/default", response_model=TokenRead)
def set_default_token(
    token_id: int,
    request: Request,
    session: Session = Depends(get_session),
    user_id: int = Depends(get_current_user_id)
) -> Token:
    token = session.get(Token, token_id)
    if not token or token.user_id != user_id:
        raise HTTPException(status_code=404, detail="Token not found")

    # Unset other defaults
    existing_defaults = session.exec(
        select(Token).where(Token.user_id == user_id, Token.is_default.is_(True))
    ).all()
    for t in existing_defaults:
        t.is_default = False
        session.add(t)

    token.is_default = True
    session.add(token)
    session.commit()
    session.refresh(token)
    return token


@router.put("/{token_id}", response_model=TokenRead)
def update_token(
    token_id: int,
    token_update: TokenCreate, # Using TokenCreate for update might be strict (requires token_value)
    # But for now let's stick to it or create TokenUpdate. 
    # Assuming update allows changing token value.
    request: Request,
    session: Session = Depends(get_session),
    user_id: int = Depends(get_current_user_id)
) -> Token:
    db_token = session.get(Token, token_id)
    if not db_token or db_token.user_id != user_id:
        raise HTTPException(status_code=404, detail="Token not found")

    # Update fields
    db_token.provider = token_update.provider
    db_token.label = token_update.label
    
    # Update token value if provided
    if token_update.token_value:
        db_token.set_token(token_update.token_value, session)

    # Handle is_default logic
    if token_update.is_default and not db_token.is_default:
        # Unset other defaults
        existing_defaults = session.exec(
            select(Token).where(Token.user_id == user_id, Token.is_default.is_(True))
        ).all()
        for t in existing_defaults:
            t.is_default = False
            session.add(t)
    
    db_token.is_default = token_update.is_default

    session.add(db_token)
    session.commit()
    session.refresh(db_token)
    return db_token
