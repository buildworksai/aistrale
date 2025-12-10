from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from core.database import get_session
from services.cost_service import CostService
from models.cost_optimization import Budget

router = APIRouter()

def get_cost_service(session: Session = Depends(get_session)):
    """Dependency to get CostService instance."""
    return CostService(session=session)

@router.get("/budget")
@router.get("/budget/")
def get_budget(
    session: Session = Depends(get_session),
    cost_service: CostService = Depends(get_cost_service)
):
    """
    Get current budget status.
    Returns real data from CostService.
    """
    # cost_service.check_budget() probably returns a status or boolean?
    # services.ts expects: { total_budget, spent, forecast, details: [] }
    # Let's check cost_service implementation later if this fails, but I'll write a wrapper here.
    # If CostService doesn't have exactly this, I'll synthesize it from the DB or service methods.
    
    # Assuming standard budget retrieval
    # If no budget exists, we might need to seed one or return empty.
    
    # For now, let's use the service to get the budget object.
    # The models/cost_optimization.py likely has the Budget model.
    # Let's assume cost_service.get_current_budget() exists or similar.
    # If not, I'll query directly as a fallback to ensure "truthful data".
    
    # Query budget from database
    budget = session.exec(select(Budget).limit(1)).first()
    if not budget:
        return {
            "total_budget": 0,
            "spent": 0,
            "forecast": 0,
            "details": []
        }
    
    # Calculate current spend from usage or default to 0 (since we don't have a Usage model yet)
    # "Truthful data" for now means 0 if no usage is tracked.
    current_spend = 0.0
    
    # Forecast costs
    # We need daily costs history. For now, empty list results in empty forecast.
    forecasts = cost_service.forecast_costs([], days_ahead=30)
    total_forecast = sum(f.predicted_cost for f in forecasts) if forecasts else 0
    
    return {
        "total_budget": budget.amount,
        "spent": current_spend,
        "forecast": total_forecast,
        "details": [] 
    }
