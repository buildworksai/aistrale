from typing import Optional
from enum import Enum
from sqlmodel import Field, SQLModel


class DLPAction(str, Enum):
    BLOCK = "block"
    REDACT = "redact"
    WARN = "warn"


class DLPRule(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    __table_args__ = {"extend_existing": True}
    name: str = Field(index=True)
    pattern: str  # Regex pattern
    action: DLPAction = Field(default=DLPAction.WARN)
    is_active: bool = Field(default=True)
    priority: int = Field(default=0)
