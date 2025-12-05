from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class Telemetry(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    model: str
    sdk: str  # "huggingface" or "openai"
    input_summary: str
    execution_time_ms: float
    status: str  # "success" or "error"
    error_message: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    input_tokens: Optional[int] = Field(default=None)
    output_tokens: Optional[int] = Field(default=None)
    cost: Optional[float] = Field(default=None)
    prompt_id: Optional[int] = Field(default=None, foreign_key="prompt.id")
