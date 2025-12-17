from datetime import datetime

from sqlalchemy import JSON, Column
from sqlmodel import Field, SQLModel


class PromptBase(SQLModel):
    name: str = Field(index=True, unique=True)
    template: str
    input_variables: list[str] = Field(default=[], sa_column=Column(JSON))
    version: int = Field(default=1)
    description: str | None = None
    model: str | None = None  # Default model for this prompt


class Prompt(PromptBase, table=True):
    id: int | None = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    user_id: int | None = Field(default=None, foreign_key="user.id")


class PromptCreate(PromptBase):
    pass


class PromptRead(PromptBase):
    id: int
    created_at: datetime
    updated_at: datetime
    user_id: int | None


class PromptUpdate(SQLModel):
    template: str | None = None
    input_variables: list[str] | None = None
    description: str | None = None
    model: str | None = None
