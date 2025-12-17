from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlmodel import Session, desc, select

from api.deps import get_current_user_id, get_session_data
from core.database import get_session
from models.prompt import Prompt, PromptCreate, PromptRead, PromptUpdate

router = APIRouter()


@router.post("/", response_model=PromptRead)
def create_prompt(
    prompt_data: PromptCreate,
    request: Request,
    session: Session = Depends(get_session),
    user_id: int = Depends(get_current_user_id),
):

    # Check if prompt with same name exists
    existing_prompt = session.exec(
        select(Prompt).where(Prompt.name == prompt_data.name)
    ).first()

    if existing_prompt:
        raise HTTPException(
            status_code=400,
            detail=(
                "Prompt with this name already exists. Use update to create new "
                "version."
            ),
        )

    prompt = Prompt.model_validate(prompt_data)
    prompt.user_id = user_id
    session.add(prompt)
    session.commit()
    session.refresh(prompt)
    return prompt


@router.get("/", response_model=list[PromptRead])
def read_prompts(
    request: Request,
    offset: int = 0,
    limit: int = 100,
    session: Session = Depends(get_session),
    user_id: int = Depends(get_current_user_id),
):

    prompts = session.exec(select(Prompt).offset(offset).limit(
        limit).order_by(desc(Prompt.updated_at))).all()
    return prompts


@router.get("/{prompt_id}", response_model=PromptRead)
def read_prompt(
    prompt_id: int,
    request: Request,
    session: Session = Depends(get_session),
    user_id: int = Depends(get_current_user_id),
):

    prompt = session.get(Prompt, prompt_id)
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")
    return prompt


@router.patch("/{prompt_id}", response_model=PromptRead)
def update_prompt(
    prompt_id: int,
    prompt_update: PromptUpdate,
    request: Request,
    session: Session = Depends(get_session),
    user_id: int = Depends(get_current_user_id),
):

    db_prompt = session.get(Prompt, prompt_id)
    if not db_prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")

    prompt_data = prompt_update.model_dump(exclude_unset=True)
    for key, value in prompt_data.items():
        setattr(db_prompt, key, value)

    # Increment version on update
    db_prompt.version += 1
    db_prompt.updated_at = datetime.utcnow()

    session.add(db_prompt)
    session.commit()
    session.refresh(db_prompt)
    return db_prompt


@router.delete("/{prompt_id}")
def delete_prompt(
    prompt_id: int,
    request: Request,
    session: Session = Depends(get_session),
    user_id: int = Depends(get_current_user_id),
    session_data: dict[str, Any] = Depends(get_session_data),
):
    # Check if admin
    if session_data.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    prompt = session.get(Prompt, prompt_id)
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")

    session.delete(prompt)
    session.commit()
    return {"ok": True}
