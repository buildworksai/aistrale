"""Cost optimization API endpoints."""

from typing import List, Optional, Dict, Any
from datetime import datetime, date, timedelta
from fastapi import APIRouter, Depends, HTTPException, Request, Query
from sqlmodel import Session, select, and_, func
from pydantic import BaseModel

from core.database import get_session
from api.deps import get_current_user_id
from services.cost_service import CostService
from models.cost_optimization import Budget, CostForecast, CostAnomaly, OptimizationRecommendation
from models.telemetry import Telemetry
import structlog

logger = structlog.get_logger()
router = APIRouter()


class BudgetCreate(BaseModel):
    workspace_id: int
    project_id: Optional[int] = None
    amount: float
    period: str = "monthly"
    alert_thresholds: Optional[Dict[str, Any]] = None


class BudgetRead(BaseModel):
    id: int
    workspace_id: int
    project_id: Optional[int]
    amount: float
    period: str
    alert_thresholds: Dict[str, Any]
    created_at: str

    class Config:
        from_attributes = True


class BudgetUpdate(BaseModel):
    amount: Optional[float] = None
    period: Optional[str] = None
    alert_thresholds: Optional[Dict[str, Any]] = None


def get_cost_service(session: Session = Depends(get_session)) -> CostService:
    """Dependency to get CostService instance."""
    return CostService(session=session)


@router.get("/budget", response_model=Dict[str, Any])
def get_budget(
    request: Request,
    session: Session = Depends(get_session),
    cost_service: CostService = Depends(get_cost_service),
    user_id: int = Depends(get_current_user_id),
) -> Dict[str, Any]:
    """Get current budget status."""
    # Get user's budget (for now, get first budget)
    budget = session.exec(select(Budget).limit(1)).first()
    if not budget:
        return {
            "total_budget": 0,
            "spent": 0,
            "forecast": 0,
            "details": [],
        }

    # Calculate current spend from telemetry
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=30)
    telemetry_query = select(Telemetry).where(
        and_(
            Telemetry.user_id == user_id,
            Telemetry.timestamp >= start_date,
            Telemetry.timestamp <= end_date,
        )
    )
    telemetry_records = session.exec(telemetry_query).all()
    current_spend = sum(record.cost or 0.0 for record in telemetry_records)

    # Forecast costs
    daily_costs = []
    for i in range(30):
        day_start = start_date + timedelta(days=i)
        day_end = day_start + timedelta(days=1)
        day_records = [r for r in telemetry_records if day_start <= r.timestamp < day_end]
        daily_costs.append(sum(r.cost or 0.0 for r in day_records))

    forecasts = cost_service.forecast_costs(daily_costs, days_ahead=30)
    total_forecast = sum(f.predicted_cost for f in forecasts) if forecasts else current_spend

    # Group by provider
    by_provider: Dict[str, float] = {}
    for record in telemetry_records:
        provider = record.sdk or "unknown"
        by_provider[provider] = by_provider.get(provider, 0.0) + (record.cost or 0.0)

    details = [
        {"category": provider, "allocated": 0, "spent": spent}
        for provider, spent in by_provider.items()
    ]

    return {
        "total_budget": budget.amount,
        "spent": current_spend,
        "forecast": total_forecast,
        "details": details,
    }


@router.get("/budgets/", response_model=List[BudgetRead])
@router.get("/budgets", response_model=List[BudgetRead])
def list_budgets(
    request: Request,
    session: Session = Depends(get_session),
    user_id: int = Depends(get_current_user_id),
) -> List[BudgetRead]:
    """List all budgets."""
    budgets = session.exec(select(Budget)).all()
    return [
        BudgetRead(
            id=b.id,
            workspace_id=b.workspace_id,
            project_id=b.project_id,
            amount=b.amount,
            period=b.period,
            alert_thresholds=b.alert_thresholds or {},
            created_at=b.created_at.isoformat() if b.created_at else "",
        )
        for b in budgets
    ]


@router.post("/budgets/", response_model=BudgetRead, status_code=201)
@router.post("/budgets", response_model=BudgetRead, status_code=201)
def create_budget(
    request: Request,
    budget_data: BudgetCreate,
    session: Session = Depends(get_session),
    user_id: int = Depends(get_current_user_id),
) -> Budget:
    """Create a new budget."""
    budget = Budget(
        workspace_id=budget_data.workspace_id,
        project_id=budget_data.project_id,
        amount=budget_data.amount,
        period=budget_data.period,
        alert_thresholds=budget_data.alert_thresholds or {"warning": 80, "critical": 100},
    )
    session.add(budget)
    session.commit()
    session.refresh(budget)

    logger.info(
        "budget_created",
        budget_id=budget.id,
        amount=budget.amount,
        user_id=user_id,
    )

    return budget


@router.get("/forecast/")
@router.get("/forecast")
def get_cost_forecast(
    request: Request,
    session: Session = Depends(get_session),
    cost_service: CostService = Depends(get_cost_service),
    user_id: int = Depends(get_current_user_id),
    days_ahead: int = Query(30, ge=1, le=90),
) -> Dict[str, Any]:
    """Get cost forecast."""
    # Get historical costs
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=30)
    telemetry_query = select(Telemetry).where(
        and_(
            Telemetry.user_id == user_id,
            Telemetry.timestamp >= start_date,
            Telemetry.timestamp <= end_date,
        )
    )
    telemetry_records = session.exec(telemetry_query).all()

    # Calculate daily costs
    daily_costs = []
    for i in range(30):
        day_start = start_date + timedelta(days=i)
        day_end = day_start + timedelta(days=1)
        day_records = [r for r in telemetry_records if day_start <= r.timestamp < day_end]
        daily_costs.append(sum(r.cost or 0.0 for r in day_records))

    forecasts = cost_service.forecast_costs(daily_costs, days_ahead=days_ahead)

    return {
        "forecasts": [
            {
                "date": f.forecast_date.isoformat(),
                "predicted_cost": f.predicted_cost,
                "confidence": f.confidence,
            }
            for f in forecasts
        ],
        "historical": daily_costs,
    }


@router.get("/anomalies", response_model=List[Dict[str, Any]])
def get_cost_anomalies(
    request: Request,
    session: Session = Depends(get_session),
    cost_service: CostService = Depends(get_cost_service),
    user_id: int = Depends(get_current_user_id),
) -> List[Dict[str, Any]]:
    """Get detected cost anomalies."""
    # Get recent costs
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=30)
    telemetry_query = select(Telemetry).where(
        and_(
            Telemetry.user_id == user_id,
            Telemetry.timestamp >= start_date,
            Telemetry.timestamp <= end_date,
        )
    )
    telemetry_records = session.exec(telemetry_query).all()

    # Calculate daily costs
    daily_costs = []
    for i in range(30):
        day_start = start_date + timedelta(days=i)
        day_end = day_start + timedelta(days=1)
        day_records = [r for r in telemetry_records if day_start <= r.timestamp < day_end]
        daily_costs.append(sum(r.cost or 0.0 for r in day_records))

    # Detect anomalies
    anomalies = []
    for i, cost in enumerate(daily_costs):
        if i >= 10:  # Need at least 10 days of history
            anomaly = cost_service.detect_anomalies(daily_costs[:i], cost)
            if anomaly:
                anomalies.append(
                    {
                        "date": (start_date + timedelta(days=i)).isoformat(),
                        "type": anomaly.anomaly_type,
                        "severity": anomaly.severity,
                        "cost_delta": anomaly.cost_delta,
                        "root_cause": anomaly.root_cause,
                    }
                )

    return anomalies


@router.get("/recommendations", response_model=List[Dict[str, Any]])
def get_optimization_recommendations(
    request: Request,
    session: Session = Depends(get_session),
    user_id: int = Depends(get_current_user_id),
    limit: int = Query(5, ge=1, le=20),
) -> List[Dict[str, Any]]:
    """Get optimization recommendations."""
    recommendations = session.exec(
        select(OptimizationRecommendation)
        .where(OptimizationRecommendation.workspace_id == 1)  # For now, use workspace 1
        .order_by(OptimizationRecommendation.potential_savings.desc())
        .limit(limit)
    ).all()

    return [
        {
            "id": r.id,
            "type": r.recommendation_type,
            "current_cost": r.current_cost,
            "potential_savings": r.potential_savings,
            "confidence": r.confidence,
            "action_items": r.action_items,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in recommendations
    ]


@router.get("/scenarios")
def list_scenarios(
    request: Request,
    user_id: int = Depends(get_current_user_id),
) -> List[Dict[str, Any]]:
    """List cost forecast scenarios."""
    return []


@router.post("/scenarios")
def create_scenario(
    request: Request,
    scenario_data: Dict[str, Any],
    user_id: int = Depends(get_current_user_id),
) -> Dict[str, Any]:
    """Create a cost forecast scenario."""
    return {"id": 1, **scenario_data}


@router.get("/forecast-accuracy/")
@router.get("/forecast-accuracy")
def get_forecast_accuracy(
    request: Request,
    user_id: int = Depends(get_current_user_id),
) -> Dict[str, Any]:
    """Get forecast accuracy metrics."""
    return {
        "mae": 0.0,
        "mape": 0.0,
        "rmse": 0.0,
        "period": "30d"
    }
