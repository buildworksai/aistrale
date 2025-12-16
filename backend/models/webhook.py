from typing import Optional, List, Dict, Any
from datetime import datetime
from sqlmodel import Field, SQLModel
from sqlalchemy import Column, JSON


class Webhook(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    __table_args__ = {"extend_existing": True}
    workspace_id: int = Field(index=True)
    url: str
    events: List[str] = Field(
        default=[], sa_column=Column(JSON)
    )  # e.g. ["inference.completed"]
    secret: str
    enabled: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class WebhookDelivery(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    __table_args__ = {"extend_existing": True}
    webhook_id: int = Field(foreign_key="webhook.id")
    event_type: str
    payload: Dict[str, Any] = Field(default={}, sa_column=Column(JSON))
    status: str = Field(index=True)  # "pending", "success", "failed"
    response_code: Optional[int] = None
    delivered_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
