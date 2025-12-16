from typing import Optional
from datetime import datetime
from sqlmodel import Field, SQLModel


class Project(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    __table_args__ = {"extend_existing": True}
    name: str = Field(index=True)
    workspace_id: int = Field(foreign_key="workspace.id", index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
