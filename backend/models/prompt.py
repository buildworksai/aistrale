from datetime import datetime
from typing import Optional, List
from sqlmodel import Field, SQLModel
from sqlalchemy import Column, JSON


class PromptBase(SQLModel):
    name: str = Field(index=True, unique=True)
    template: str
    input_variables: List[str] = Field(default=[], sa_column=Column(JSON))
    version: int = Field(default=1)
    description: Optional[str] = None
    model: Optional[str] = None  # Default model for this prompt


class Prompt(PromptBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    user_id: Optional[int] = Field(default=None, foreign_key="user.id")


class PromptCreate(PromptBase):
    pass


class PromptRead(PromptBase):
    id: int
    created_at: datetime
    updated_at: datetime
    user_id: Optional[int]


class PromptUpdate(SQLModel):
    template: Optional[str] = None
    input_variables: Optional[List[str]] = None
    description: Optional[str] = None
    model: Optional[str] = None
