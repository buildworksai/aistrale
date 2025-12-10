import logging
import statistics
from datetime import date, timedelta
from typing import List, Optional
from sqlmodel import Session
from models.cost_optimization import Budget, CostForecast, CostAnomaly

logger = logging.getLogger(__name__)

class CostService:
    """
    Service for cost forecasting, budget tracking, and anomaly detection.
    """

    def __init__(self, session: Optional[Session] = None):
        self.session = session

    def forecast_costs(self, daily_costs: List[float], days_ahead: int = 30) -> List[CostForecast]:
        """
        Predict future costs using simple moving average and linear trend.
        """
        if len(daily_costs) < 5:
            logger.warning("Not enough data for accurate forecast.")
            return []

        # Simple linear projection for V1
        n = len(daily_costs)
        avg_change = (daily_costs[-1] - daily_costs[0]) / n if n > 1 else 0
        last_val = daily_costs[-1]
        
        forecasts = []
        current_date = date.today()
        
        for i in range(1, days_ahead + 1):
            next_val = max(0, last_val + (avg_change * i))
            forecasts.append(
                CostForecast(
                    workspace_id=1, # Simulation
                    forecast_date=current_date + timedelta(days=i),
                    predicted_cost=round(next_val, 2),
                    confidence=0.8
                )
            )
        return forecasts

    def check_budget(self, budget: Budget, current_spend: float) -> List[str]:
        """
        Check if spend exceeds budget thresholds.
        Returns list of alert messages.
        """
        alerts = []
        percent_used = (current_spend / budget.amount) * 100
        
        # Default thresholds: 50%, 80%, 100%
        thresholds = budget.alert_thresholds or {"warning": 80, "critical": 100}
        
        for level, threshold_val in thresholds.items():
            if percent_used >= float(threshold_val):
                alerts.append(f"Budget alert: {level.upper()} - Used {percent_used:.1f}% of budget ${budget.amount}")
                
        return alerts

    def detect_anomalies(self, daily_costs: List[float], current_cost: float) -> Optional[CostAnomaly]:
        """
        Detect if current cost is anomalous using Z-score.
        """
        if len(daily_costs) < 10:
            return None

        mean = statistics.mean(daily_costs)
        stdev = statistics.stdev(daily_costs)
        
        if stdev == 0:
            if current_cost != mean:
                 return CostAnomaly(
                    workspace_id=1,
                    anomaly_type="spike",
                    severity="critical",
                    cost_delta=current_cost - mean,
                    root_cause="Deviation from 0 variance baseline"
                )
            return None
            
        z_score = (current_cost - mean) / stdev
        
        if z_score > 3: # 3 Sigma rule
            return CostAnomaly(
                workspace_id=1,
                anomaly_type="spike",
                severity="critical",
                cost_delta=current_cost - mean,
                root_cause="Usage spike > 3 sigma"
            )
        elif z_score > 2:
            return CostAnomaly(
                workspace_id=1,
                anomaly_type="spike",
                severity="warning",
                cost_delta=current_cost - mean,
                root_cause="Usage spike > 2 sigma"
            )
            
        return None
