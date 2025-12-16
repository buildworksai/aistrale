from typing import Optional, List, Dict, Any
from datetime import datetime
from sqlmodel import Field, SQLModel
from sqlalchemy import Column, JSON


class RequestQueue(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    __table_args__ = {"extend_existing": True}
    request_data: Dict[str, Any] = Field(default={}, sa_column=Column(JSON))
    priority: int = Field(default=1)  # 0=High, 1=Normal, 2=Low
    # pending, processing, completed, failed
    status: str = Field(default="pending")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    processed_at: Optional[datetime] = None


class CircuitBreaker(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    __table_args__ = {"extend_existing": True}
    provider: str = Field(index=True)
    state: str = Field(default="closed")  # closed, open, half-open
    failure_count: int = Field(default=0)
    last_failure: Optional[datetime] = None
    opened_at: Optional[datetime] = None


class RetryConfig(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    __table_args__ = {"extend_existing": True}
    provider: str
    max_attempts: int = Field(default=3)
    initial_delay_ms: int = Field(default=1000)
    max_delay_ms: int = Field(default=60000)
    backoff_multiplier: float = Field(default=2.0)


class PerformanceBenchmark(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    __table_args__ = {"extend_existing": True}
    benchmark_name: str
    provider: str
    metric: str
    value: float
    baseline_value: float
    benchmark_date: datetime = Field(default_factory=datetime.utcnow)


class LoadBalanceRule(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    __table_args__ = {"extend_existing": True}
    name: str
    algorithm: str  # round-robin, weighted
    providers: List[str] = Field(default=[], sa_column=Column(JSON))
    weights: Dict[str, int] = Field(default={}, sa_column=Column(JSON))
    enabled: bool = Field(default=True)


class DegradationStrategy(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    __table_args__ = {"extend_existing": True}
    name: str
    trigger_conditions: Dict[str, Any] = Field(
        default={}, sa_column=Column(JSON))
    actions: Dict[str, Any] = Field(default={}, sa_column=Column(JSON))
    enabled: bool = Field(default=True)
