from typing import Optional, Dict, Any
from datetime import datetime, date
from sqlmodel import Field, SQLModel
from sqlalchemy import Column, JSON


# Phase 1 Models
class ProviderPerformance(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    __table_args__ = {"extend_existing": True}
    provider: str = Field(index=True)
    model: str = Field(index=True)
    avg_latency_ms: float = Field(default=0.0)
    avg_cost_per_1k_tokens: float = Field(default=0.0)
    quality_score: float = Field(default=0.0)
    reliability: float = Field(default=1.0)  # 0.0 to 1.0
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class RoutingRule(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    __table_args__ = {"extend_existing": True}
    name: str
    # "cheapest", "fastest", "balanced", "quality"
    strategy: str = Field(index=True)
    task_type: str = Field(index=True)  # "chat", "completion", "embedding"
    quality_threshold: float = Field(default=0.0)
    latency_threshold_ms: Optional[int] = None
    enabled: bool = Field(default=True)


# Phase 2 Models
class Budget(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    __table_args__ = {"extend_existing": True}
    workspace_id: int = Field(index=True)
    project_id: Optional[int] = Field(default=None)
    amount: float
    period: str = Field(default="monthly")  # "monthly", "quarterly"
    alert_thresholds: Dict[str, Any] = Field(
        default={}, sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=datetime.utcnow)


class CostForecast(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    __table_args__ = {"extend_existing": True}
    workspace_id: int = Field(index=True)
    forecast_date: date
    predicted_cost: float
    confidence: float
    created_at: datetime = Field(default_factory=datetime.utcnow)


class CostAnomaly(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    __table_args__ = {"extend_existing": True}
    workspace_id: int = Field(index=True)
    detected_at: datetime = Field(default_factory=datetime.utcnow)
    anomaly_type: str
    severity: str
    cost_delta: float
    root_cause: Optional[str] = None


# Phase 4 Models
class Benchmark(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    __table_args__ = {"extend_existing": True}
    metric: str = Field(index=True)
    value: float
    percentile: int
    industry: str
    updated_at: datetime = Field(default_factory=datetime.utcnow)


# Phase 5 Models
class OptimizationRecommendation(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    __table_args__ = {"extend_existing": True}
    workspace_id: int = Field(index=True)
    recommendation_type: str
    current_cost: float
    potential_savings: float
    confidence: float
    action_items: Dict[str, Any] = Field(default={}, sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=datetime.utcnow)
