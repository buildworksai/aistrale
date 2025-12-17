from datetime import datetime, timedelta
from typing import Any

from fastapi import APIRouter, Depends, Query, Request
from sqlmodel import Session, and_, select

from api.deps import get_current_user_id, get_session_data
from core.database import get_session
from models.telemetry import Telemetry

router = APIRouter()


@router.get("/", response_model=list[Telemetry])
def read_telemetry(
    request: Request,
    session: Session = Depends(get_session),
    user_id: int = Depends(get_current_user_id),
    session_data: dict[str, Any] = Depends(get_session_data),
) -> list[Telemetry]:
    if session_data.get("role") == "admin":
        return session.exec(select(Telemetry)).all()
    else:
        return session.exec(
            select(Telemetry).where(
                Telemetry.user_id == user_id)).all()


@router.get("/cost-analytics")
def get_cost_analytics(
    request: Request,
    session: Session = Depends(get_session),
    user_id: int = Depends(get_current_user_id),
    provider: str | None = Query(None),
    start_date: datetime | None = Query(None),
    end_date: datetime | None = Query(None),
    group_by: str = Query("day", pattern="^(day|week|month|provider|model)$"),
) -> dict[str, Any]:
    """
    Get cost analytics aggregated by time period, provider, or model.

    Args:
        provider: Filter by provider
        start_date: Start date for filtering
        end_date: End date for filtering
        group_by: Group by day, week, month, provider, or model
    """
    # Default to last 30 days if no dates provided
    if not end_date:
        end_date = datetime.utcnow()
    if not start_date:
        start_date = end_date - timedelta(days=30)

    # Build query
    query = select(Telemetry).where(
        and_(
            Telemetry.user_id == user_id,
            Telemetry.timestamp >= start_date,
            Telemetry.timestamp <= end_date,
        )
    )

    if provider:
        query = query.where(Telemetry.sdk == provider)

    telemetry_records = session.exec(query).all()

    # Aggregate costs
    total_cost = sum(record.cost or 0.0 for record in telemetry_records)

    # Group by provider
    by_provider: dict[str, float] = {}
    for record in telemetry_records:
        provider_name = record.sdk or "unknown"
        by_provider[provider_name] = by_provider.get(provider_name, 0.0) + (
            record.cost or 0.0
        )

    # Group by model
    by_model: dict[str, float] = {}
    for record in telemetry_records:
        model_name = record.model or "unknown"
        by_model[model_name] = by_model.get(
            model_name, 0.0) + (record.cost or 0.0)

    # Group by time period
    by_time: dict[str, float] = {}
    for record in telemetry_records:
        if group_by == "day":
            time_key = record.timestamp.strftime("%Y-%m-%d")
        elif group_by == "week":
            # Get week number
            time_key = record.timestamp.strftime("%Y-W%W")
        elif group_by == "month":
            time_key = record.timestamp.strftime("%Y-%m")
        else:
            time_key = record.timestamp.strftime("%Y-%m-%d")

        by_time[time_key] = by_time.get(time_key, 0.0) + (record.cost or 0.0)

    return {
        "total_cost": total_cost,
        "period": {
            "start": start_date.isoformat(),
            "end": end_date.isoformat(),
        },
        "by_provider": by_provider,
        "by_model": by_model,
        "by_time": by_time,
        "record_count": len(telemetry_records),
    }
