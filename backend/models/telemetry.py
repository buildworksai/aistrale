from datetime import datetime

from sqlmodel import Field, SQLModel


class Telemetry(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    model: str
    sdk: str  # "huggingface" or "openai"
    input_summary: str
    execution_time_ms: float
    status: str  # "success" or "error"
    error_message: str | None = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    input_tokens: int | None = Field(default=None)
    output_tokens: int | None = Field(default=None)
    cost: float | None = Field(default=None)
    prompt_id: int | None = Field(default=None, foreign_key="prompt.id")
