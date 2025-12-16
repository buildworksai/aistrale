from typing import Optional, List, Dict, Any
from datetime import datetime, date
from sqlmodel import Field, SQLModel
from sqlalchemy import Column, JSON


# Phase 1: Health
class ProviderHealth(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    __table_args__ = {"extend_existing": True}
    provider: str = Field(index=True)
    status: str = Field(index=True)  # "healthy", "degraded", "down"
    avg_latency_ms: float = Field(default=0.0)
    error_rate: float = Field(default=0.0)
    uptime_percentage: float = Field(default=100.0)
    last_check: datetime = Field(default_factory=datetime.utcnow)


# Phase 2: Failover
class FailoverConfig(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    __table_args__ = {"extend_existing": True}
    workspace_id: int = Field(index=True)
    primary_provider: str
    fallback_providers: List[str] = Field(default=[], sa_column=Column(JSON))
    failover_conditions: Dict[str, Any] = Field(
        default={}, sa_column=Column(JSON))
    enabled: bool = Field(default=True)


# Phase 3: Comparison
class ProviderComparison(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    __table_args__ = {"extend_existing": True}
    comparison_date: date = Field(default_factory=date.today)
    provider1: str
    provider2: str
    metric: str
    provider1_value: float
    provider2_value: float
    winner: str


# Phase 4: A/B Testing
class ABTest(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    __table_args__ = {"extend_existing": True}
    name: str
    prompt: str
    providers: List[str] = Field(default=[], sa_column=Column(JSON))
    status: str = Field(default="running")  # "running", "completed"
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ABTestResult(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    __table_args__ = {"extend_existing": True}
    ab_test_id: int = Field(foreign_key="abtest.id")
    provider: str
    response: str
    latency_ms: float
    cost: float
    quality_score: float = Field(default=0.0)


# Phase 5: Model Abstraction
class ModelMapping(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    __table_args__ = {"extend_existing": True}
    # Internal unified name e.g. "smart-fast"
    model_name: str = Field(index=True)
    provider: str
    equivalent_models: List[str] = Field(default=[], sa_column=Column(JSON))
    capabilities: Dict[str, Any] = Field(default={}, sa_column=Column(JSON))
    pricing: Dict[str, Any] = Field(default={}, sa_column=Column(JSON))
