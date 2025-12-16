---
trigger: always_on
description: Python coding standards and FastAPI development standards for AISTRALE backend
globs: backend/**/*.py
---

# 🐍 AISTRALE Python Standards

## BuildWorks-02001 Python Version & Environment
- Use Python 3.11+ (as specified in pyproject.toml)
- Use virtual environments for development
- Follow PEP 8 style guidelines
- Use Black for code formatting (line length: 88)
- Use Flake8 for linting
- Use mypy for type checking

## BuildWorks-02002 FastAPI Standards
```python
# ✅ GOOD: Proper FastAPI structure
from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List

app = FastAPI(title="AISTRALE API", version="1.0.0")

class InferenceRequest(BaseModel):
    model: str
    inputs: str
    config: Optional[dict] = None

class InferenceResponse(BaseModel):
    output: str
    tokens: int
    duration: float

    class Config:
        from_attributes = True

@app.post("/api/v1/inference", response_model=InferenceResponse)
async def run_inference(request: InferenceRequest):
    # Implementation
    pass
```

## BuildWorks-02003 Pydantic Model Standards
```python
# ✅ GOOD: Proper Pydantic model with validation
from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from datetime import datetime

class UserModel(BaseModel):
    id: str = Field(..., description="Unique user identifier")
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    is_active: bool = Field(default=True)
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
```

## BuildWorks-02004 SQLModel Standards
```python
# ✅ GOOD: SQLModel model with proper typing
from sqlmodel import SQLModel, Field, Relationship
from typing import Optional
from datetime import datetime

class User(SQLModel, table=True):
    __tablename__ = "users"

    id: Optional[str] = Field(default=None, primary_key=True)
    name: str = Field(max_length=100)
    email: str = Field(unique=True, index=True)
    is_active: bool = Field(default=True)
    created_at: Optional[datetime] = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)
```

## BuildWorks-02005 Database Operations
```python
# ✅ GOOD: Proper async database operations
from sqlmodel import Session, select
from typing import Optional

def get_user_by_id(db: Session, user_id: str) -> Optional[User]:
    """Get user by ID."""
    result = db.exec(select(User).where(User.id == user_id))
    return result.first()

def create_user(db: Session, user_data: UserCreate) -> User:
    """Create new user."""
    user = User(**user_data.model_dump())
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
```

## BuildWorks-02006 Session-Based Authentication
```python
# ✅ GOOD: Session-based authentication with proper typing
from fastapi import Depends, HTTPException, status
from core.security import get_current_user
from models.user import User

@router.get("/api/v1/users/me")
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
) -> User:
    """Get current user information."""
    return current_user

@router.get("/api/v1/admin/users")
async def get_all_users(
    current_user: User = Depends(require_admin)
) -> List[User]:
    """Get all users (admin only)."""
    # Implementation
    pass
```

## BuildWorks-02007 Error Handling
```python
# ✅ GOOD: Proper error handling with custom exceptions
from fastapi import HTTPException
from core.exceptions import (
    BaseAPIException,
    InferenceError,
    AuthenticationError,
    ValidationError,
    NotFoundError
)

async def run_inference_safe(model: str, inputs: str) -> dict:
    """Run inference with proper error handling."""
    try:
        result = await inference_service.run(model, inputs)
        return result
    except InferenceError as e:
        raise HTTPException(
            status_code=e.status_code,
            detail=e.message
        )
    except Exception as e:
        logger.error("inference_failed", error=str(e))
        raise HTTPException(
            status_code=500,
            detail="Internal server error"
        )
```

## BuildWorks-02008 LLM SDK Integration
```python
# ✅ GOOD: HuggingFace Hub integration
from huggingface_hub import InferenceClient
from typing import Dict, Any

async def run_hf_inference(
    token: str, model: str, inputs: str
) -> Dict[str, Any]:
    """Run HuggingFace model inference."""
    client = InferenceClient(token=token)
    try:
        result = client.post(
            json={"inputs": inputs, "model": model}
        )
        return {"output": result, "provider": "huggingface"}
    except Exception as e:
        logger.error("hf_inference_failed", error=str(e))
        raise InferenceError(f"HuggingFace inference failed: {e}")

# ✅ GOOD: OpenAI SDK integration
from openai import OpenAI

async def run_openai_inference(
    api_key: str, model: str, prompt: str
) -> Dict[str, Any]:
    """Run OpenAI model inference."""
    client = OpenAI(api_key=api_key)
    try:
        response = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}]
        )
        return {
            "output": response.choices[0].message.content,
            "provider": "openai"
        }
    except Exception as e:
        logger.error("openai_inference_failed", error=str(e))
        raise InferenceError(f"OpenAI inference failed: {e}")
```

## BuildWorks-02009 Testing Standards
```python
# ✅ GOOD: pytest with async support
import pytest
from httpx import AsyncClient
from fastapi.testclient import TestClient

@pytest.mark.asyncio
async def test_run_inference():
    """Test inference endpoint."""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.post(
            "/api/v1/inference",
            json={
                "model": "gpt-3.5-turbo",
                "inputs": "Hello, world!"
            }
        )
    assert response.status_code == 200
    data = response.json()
    assert "output" in data
    assert "tokens" in data
```

## BuildWorks-02010 Dependency Management
- All dependencies must be specified in `pyproject.toml`
- Use exact versions for production dependencies when possible
- Use version ranges for development dependencies
- Document any new dependencies

## BuildWorks-02011 Logging Standards
```python
# ✅ REQUIRED: Structured logging with structlog (Phase 2 - Implemented)
import structlog

logger = structlog.get_logger()

# ✅ GOOD: Structured logging with context
logger.info(
    "inference_completed",
    model="gpt-3.5-turbo",
    tokens=150,
    duration=1.23,
    user_id="user123"
)

# ✅ GOOD: Error logging with context
try:
    result = await run_inference(model, inputs)
except Exception as e:
    logger.error(
        "inference_failed",
        model=model,
        error=str(e),
        user_id=user_id,
        exc_info=True
    )
    raise
```

## BuildWorks-02012 Async/Await Patterns
```python
# ✅ GOOD: Proper async/await usage
from typing import List
import httpx

async def fetch_multiple_models(models: List[str]) -> List[dict]:
    """Fetch multiple models concurrently."""
    async with httpx.AsyncClient() as client:
        tasks = [
            client.get(f"/api/models/{model}")
            for model in models
        ]
        responses = await asyncio.gather(*tasks)
        return [r.json() for r in responses]
```

---

**Next Steps**: Review `06-testing.mdc` for comprehensive testing patterns and `09-observability.mdc` for logging and monitoring.
