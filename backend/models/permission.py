from typing import Optional
from sqlmodel import Field, SQLModel

class Permission(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    __table_args__ = {"extend_existing": True}
    user_id: int = Field(index=True)
    resource_type: str = Field(index=True) # e.g. "prompt", "project"
    resource_id: Optional[str] = Field(default=None, index=True) # "all" or specific ID
    action: str = Field(index=True) # "read", "write", "admin"
    granted: bool = Field(default=True)
