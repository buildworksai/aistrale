from datetime import datetime
from typing import Any

from sqlalchemy import JSON, Column
from sqlmodel import Field, SQLModel


class Webhook(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    __table_args__ = {"extend_existing": True}
    workspace_id: int = Field(index=True)
    url: str
    events: list[str] = Field(
        default=[], sa_column=Column(JSON)
    )  # e.g. ["inference.completed"]
    secret: str
    enabled: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class WebhookDelivery(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    __table_args__ = {"extend_existing": True}
    webhook_id: int = Field(foreign_key="webhook.id")
    event_type: str
    payload: dict[str, Any] = Field(default={}, sa_column=Column(JSON))
    status: str = Field(index=True)  # "pending", "success", "failed"
    response_code: int | None = None
    delivered_at: datetime | None = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
