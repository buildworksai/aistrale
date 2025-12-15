import pytest
from datetime import date
from services.cost_service import CostService
from models.cost_optimization import Budget

def test_forecast_costs():
    service = CostService()
    # Linear increase: 10, 11, 12, 13, 14
    history = [10.0, 11.0, 12.0, 13.0, 14.0]
    forecast = service.forecast_costs(history, days_ahead=5)
    
    # Approx slope = (14-10)/5 = 0.8
    # Next day should be ~14.8
    assert len(forecast) == 5
    assert forecast[0].predicted_cost > 14.0
    assert forecast[-1].predicted_cost > forecast[0].predicted_cost

def test_check_budget_alerts():
    service = CostService()
    budget = Budget(workspace_id=1, amount=100.0, alert_thresholds={"warning": 80, "critical": 100})
    
    # 50% spend - no alert
    alerts = service.check_budget(budget, 50.0)
    assert len(alerts) == 0
    
    # 85% spend - warning
    alerts = service.check_budget(budget, 85.0)
    assert len(alerts) == 1
    assert "WARNING" in alerts[0]
    
    # 105% spend - both/critical
    alerts = service.check_budget(budget, 105.0)
    assert len(alerts) >= 1
    assert any("CRITICAL" in a for a in alerts)

def test_detect_anomalies():
    service = CostService()
    # Stable history around 10 but with normal variance
    history = [9.0, 11.0, 10.5, 9.5, 10.0, 10.2, 9.8, 10.0, 11.0, 9.0] * 2
    
    # Small variance normal
    anomaly = service.detect_anomalies(history, 10.5)
    assert anomaly is None
    
    # Huge spike
    anomaly = service.detect_anomalies(history, 50.0)
    assert anomaly is not None
    assert anomaly.severity == "critical"
    assert anomaly.anomaly_type == "spike"
