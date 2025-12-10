from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlmodel import Session, desc, select

from core.database import get_session
from core.limiter import limiter
from models.chat import ChatMessage
from models.token import Token
from services.inference_service import run_inference
from services.security_audit_service import log_security_event

router = APIRouter()


class InferenceRequest(BaseModel):
    provider: str
    model: Optional[str] = None
    input_text: str
    token_id: int # Changed from token_value to token_id
    hf_provider: Optional[str] = "auto"
    task: Optional[str] = "auto"
    prompt_id: Optional[int] = None
    prompt_variables: Optional[dict] = None


@router.post("/run")
@limiter.limit("10/minute")
async def run_inference_endpoint(
    request: Request,
    inference_request: InferenceRequest,
    session: Session = Depends(get_session),
):
    user_id = request.session.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")

    # Get the token
    token = session.get(Token, inference_request.token_id)
    if not token or token.user_id != user_id:
        raise HTTPException(status_code=404, detail="Token not found")

    if token.provider != inference_request.provider:
        raise HTTPException(
            status_code=400, detail="Token provider does not match request provider"
        )

    # Log token access
    ip_address = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent")
    log_security_event(
        session=session,
        event_type="token_access",
        ip_address=ip_address,
        user_id=user_id,
        user_agent=user_agent,
        details={
            "provider": token.provider,
            "token_id": token.id,
            "model": inference_request.model,
        },
    )

    # Fetch chat history (last 20 messages)
    history_objs = session.exec(
        select(ChatMessage)
        .where(ChatMessage.user_id == user_id)
        .order_by(desc(ChatMessage.created_at))
        .limit(20)
    ).all()
    # Reverse to chronological order
    history = [
        {"role": msg.role, "content": msg.content} for msg in reversed(history_objs)
    ]

    # Save user message
    user_msg = ChatMessage(user_id=user_id, role="user", content=inference_request.input_text)
    session.add(user_msg)
    session.commit()

    # Retrieve token value (encrypted, decrypted on access)
    token_val = token.token_value 

    result = await run_inference(
        session=session,
        user_id=user_id,
        provider=inference_request.provider,
        model=inference_request.model,
        input_text=inference_request.input_text,
        token_value=token_val,
        hf_provider=inference_request.hf_provider,
        task=inference_request.task,
        history=history,
        prompt_id=inference_request.prompt_id,
        prompt_variables=inference_request.prompt_variables,
    )

    # Save assistant response (if text)
    if isinstance(result, str):
        asst_msg = ChatMessage(user_id=user_id, role="assistant", content=result)
        session.add(asst_msg)
        session.commit()

    return {"result": result}


@router.get("/history")
def get_chat_history(request: Request, session: Session = Depends(get_session)):
    user_id = request.session.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")

    messages = session.exec(
        select(ChatMessage)
        .where(ChatMessage.user_id == user_id)
        .order_by(ChatMessage.created_at)
    ).all()
    return messages


@router.delete("/history")
def clear_chat_history(request: Request, session: Session = Depends(get_session)):
    user_id = request.session.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")

    messages = session.exec(
        select(ChatMessage).where(ChatMessage.user_id == user_id)
    ).all()
    for msg in messages:
        session.delete(msg)
    session.commit()
    return {"ok": True}
