"""Tests for telemetry cost analytics."""

from unittest.mock import MagicMock

from models.telemetry import Telemetry


class TestTelemetryCostAnalytics:
    """Test telemetry cost analytics endpoint."""

    def test_get_cost_analytics(self, client, mock_session):
        """Test getting cost analytics."""
        # Mock telemetry records
        from datetime import datetime

        from api.deps import get_current_user_id
        from core.database import get_session

        telemetry1 = Telemetry(
            id=1,
            user_id=1,
            model="gpt-3.5-turbo",
            sdk="openai",
            input_summary="test",
            execution_time_ms=100.0,
            status="success",
            cost=0.001,
            created_at=datetime.utcnow(),
        )
        telemetry2 = Telemetry(
            id=2,
            user_id=1,
            model="gpt-4",
            sdk="openai",
            input_summary="test",
            execution_time_ms=200.0,
            status="success",
            cost=0.002,
            created_at=datetime.utcnow(),
        )

        # Mock the query execution
        mock_result = MagicMock()
        mock_result.all.return_value = [telemetry1, telemetry2]
        mock_session.exec.return_value = mock_result

        app = client.app

        def mock_get_current_user_id():
            return 1

        def mock_get_session():
            return mock_session

        app.dependency_overrides[get_current_user_id] = mock_get_current_user_id
        app.dependency_overrides[get_session] = mock_get_session

        try:
            response = client.get("/api/telemetry/cost-analytics")
            assert response.status_code == 200
            data = response.json()
            assert "total_cost" in data
            assert "by_provider" in data
            assert "by_model" in data
            assert data["total_cost"] == 0.003
        finally:
            app.dependency_overrides.clear()
