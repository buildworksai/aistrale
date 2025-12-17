import logging
import statistics
from datetime import date, timedelta

from sqlmodel import Session

from models.cost_optimization import Budget, CostAnomaly, CostForecast

logger = logging.getLogger(__name__)

MIN_FORECAST_DAYS = 5
MIN_ANOMALY_SAMPLE_SIZE = 10
Z_SCORE_CRITICAL = 3.0
Z_SCORE_WARNING = 2.0


class CostService:
    """
    Service for cost forecasting, budget tracking, and anomaly detection.
    """

    def __init__(self, session: Session | None = None):
        self.session = session

    def forecast_costs(
        self, daily_costs: list[float], days_ahead: int = 30
    ) -> list[CostForecast]:
        """
        Predict future costs using simple moving average and linear trend.
        """
        if len(daily_costs) < MIN_FORECAST_DAYS:
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
                    workspace_id=1,  # Simulation
                    forecast_date=current_date + timedelta(days=i),
                    predicted_cost=round(next_val, 2),
                    confidence=0.8,
                )
            )
        return forecasts

    def check_budget(self, budget: Budget, current_spend: float) -> list[str]:
        """
        Check if spend exceeds budget thresholds.
        Returns list of alert messages.
        """
        alerts = []
        percent_used = (current_spend / budget.amount) * 100

        # Default thresholds: 50%, 80%, 100%
        thresholds = budget.alert_thresholds or {
            "warning": 80, "critical": 100}

        for level, threshold_val in thresholds.items():
            if percent_used >= float(threshold_val):
                alerts.append(
                    f"Budget alert: {level.upper()} - Used {percent_used:.1f}% "
                    f"of budget ${budget.amount}"
                )

        return alerts

    def detect_anomalies(
        self, daily_costs: list[float], current_cost: float
    ) -> CostAnomaly | None:
        """
        Detect if current cost is anomalous using Z-score.
        """
        if len(daily_costs) < MIN_ANOMALY_SAMPLE_SIZE:
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
                    root_cause="Deviation from 0 variance baseline",
                )
            return None

        z_score = (current_cost - mean) / stdev

        if z_score > Z_SCORE_CRITICAL:
            return CostAnomaly(
                workspace_id=1,
                anomaly_type="spike",
                severity="critical",
                cost_delta=current_cost - mean,
                root_cause="Usage spike > 3 sigma",
            )
        elif z_score > Z_SCORE_WARNING:
            return CostAnomaly(
                workspace_id=1,
                anomaly_type="spike",
                severity="warning",
                cost_delta=current_cost - mean,
                root_cause="Usage spike > 2 sigma",
            )

        return None
