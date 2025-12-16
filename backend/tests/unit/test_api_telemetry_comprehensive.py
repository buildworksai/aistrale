"""Comprehensive tests for telemetry API endpoints."""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import MagicMock, patch
from datetime import datetime, timedelta
from models.telemetry import Telemetry
from api.deps import get_current_user_id


class TestTelemetryAPI:
    """Comprehensive tests for telemetry endpoints."""

    def test_read_telemetry_user(self, client, mock_session):
        """Test reading telemetry as regular user."""
        from api import telemetry
        from core.database import get_session
        
        app = client.app
        
        def mock_get_session():
            return mock_session
        
        app.dependency_overrides[get_session] = mock_get_session
        
        # Set session as regular user
        from api.deps import get_current_user_id

        app.dependency_overrides[get_current_user_id] = lambda: 1
        
        # Mock telemetry records
        telemetry1 = Telemetry(
            id=1, user_id=1, model="gpt-3.5-turbo", sdk="openai",
            input_summary="test", execution_time_ms=100.0, status="success", cost=0.001
        )
        telemetry2 = Telemetry(
            id=2, user_id=1, model="gpt-4", sdk="openai",
            input_summary="test", execution_time_ms=200.0, status="success", cost=0.002
        )
        
        mock_result = MagicMock()
        mock_result.all.return_value = [telemetry1, telemetry2]
        mock_session.exec.return_value = mock_result
        
        response = client.get("/api/telemetry/")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        
        app.dependency_overrides.clear()

    def test_read_telemetry_admin(self, client, mock_session):
        """Test reading telemetry as admin (all users)."""
        from api import telemetry
        from core.database import get_session
        
        app = client.app
        
        def mock_get_session():
            return mock_session
        
        app.dependency_overrides[get_session] = mock_get_session
        
        # Set session as admin
        from api.deps import get_current_user_id

        app.dependency_overrides[get_current_user_id] = lambda: 1
        
        # Mock telemetry records from multiple users
        telemetry1 = Telemetry(
            id=1, user_id=1, model="gpt-3.5-turbo", sdk="openai",
            input_summary="test", execution_time_ms=100.0, status="success", cost=0.001
        )
        telemetry2 = Telemetry(
            id=2, user_id=2, model="gpt-4", sdk="openai",
            input_summary="test", execution_time_ms=200.0, status="success", cost=0.002
        )
        
        mock_result = MagicMock()
        mock_result.all.return_value = [telemetry1, telemetry2]
        mock_session.exec.return_value = mock_result
        
        response = client.get("/api/telemetry/")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        
        app.dependency_overrides.clear()

    def test_read_telemetry_not_authenticated(self, client, mock_session):
        """Test reading telemetry without authentication."""
        from api import telemetry
        from core.database import get_session
        
        app = client.app
        app.dependency_overrides[get_session] = lambda: mock_session
        
        response = client.get("/api/telemetry/")
        assert response.status_code == 401
        
        app.dependency_overrides.clear()

    def test_get_cost_analytics(self, client, mock_session):
        """Test getting cost analytics."""
        from api import telemetry
        from core.database import get_session
        
        app = client.app
        
        def mock_get_current_user_id():
            return 1
        
        def mock_get_session():
            return mock_session
        
        app.dependency_overrides[get_current_user_id] = mock_get_current_user_id
        app.dependency_overrides[get_session] = mock_get_session
        
        # Mock telemetry records
        telemetry1 = Telemetry(
            id=1, user_id=1, model="gpt-3.5-turbo", sdk="openai",
            input_summary="test", execution_time_ms=100.0, status="success",
            cost=0.001, created_at=datetime.utcnow()
        )
        telemetry2 = Telemetry(
            id=2, user_id=1, model="gpt-4", sdk="openai",
            input_summary="test", execution_time_ms=200.0, status="success",
            cost=0.002, created_at=datetime.utcnow()
        )
        
        mock_result = MagicMock()
        mock_result.all.return_value = [telemetry1, telemetry2]
        mock_session.exec.return_value = mock_result
        
        response = client.get("/api/telemetry/cost-analytics")
        assert response.status_code == 200
        data = response.json()
        assert "total_cost" in data
        assert "by_provider" in data
        assert "by_model" in data
        assert "by_time" in data
        assert data["total_cost"] == 0.003
        
        app.dependency_overrides.clear()

    def test_get_cost_analytics_with_provider_filter(self, client, mock_session):
        """Test getting cost analytics with provider filter."""
        from api import telemetry
        from core.database import get_session
        
        app = client.app
        
        def mock_get_current_user_id():
            return 1
        
        def mock_get_session():
            return mock_session
        
        app.dependency_overrides[get_current_user_id] = mock_get_current_user_id
        app.dependency_overrides[get_session] = mock_get_session
        
        telemetry1 = Telemetry(
            id=1, user_id=1, model="gpt-3.5-turbo", sdk="openai",
            input_summary="test", execution_time_ms=100.0, status="success",
            cost=0.001, created_at=datetime.utcnow()
        )
        
        mock_result = MagicMock()
        mock_result.all.return_value = [telemetry1]
        mock_session.exec.return_value = mock_result
        
        response = client.get("/api/telemetry/cost-analytics?provider=openai")
        assert response.status_code == 200
        data = response.json()
        assert data["total_cost"] == 0.001
        
        app.dependency_overrides.clear()

    def test_get_cost_analytics_group_by_week(self, client, mock_session):
        """Test getting cost analytics grouped by week."""
        from api import telemetry
        from core.database import get_session
        
        app = client.app
        
        def mock_get_current_user_id():
            return 1
        
        def mock_get_session():
            return mock_session
        
        app.dependency_overrides[get_current_user_id] = mock_get_current_user_id
        app.dependency_overrides[get_session] = mock_get_session
        
        telemetry1 = Telemetry(
            id=1, user_id=1, model="gpt-3.5-turbo", sdk="openai",
            input_summary="test", execution_time_ms=100.0, status="success",
            cost=0.001, created_at=datetime.utcnow()
        )
        
        mock_result = MagicMock()
        mock_result.all.return_value = [telemetry1]
        mock_session.exec.return_value = mock_result
        
        response = client.get("/api/telemetry/cost-analytics?group_by=week")
        assert response.status_code == 200
        data = response.json()
        assert "by_time" in data
        
        app.dependency_overrides.clear()

    def test_get_cost_analytics_group_by_month(self, client, mock_session):
        """Test getting cost analytics grouped by month."""
        from api import telemetry
        from core.database import get_session
        
        app = client.app
        
        def mock_get_current_user_id():
            return 1
        
        def mock_get_session():
            return mock_session
        
        app.dependency_overrides[get_current_user_id] = mock_get_current_user_id
        app.dependency_overrides[get_session] = mock_get_session
        
        telemetry1 = Telemetry(
            id=1, user_id=1, model="gpt-3.5-turbo", sdk="openai",
            input_summary="test", execution_time_ms=100.0, status="success",
            cost=0.001, created_at=datetime.utcnow()
        )
        
        mock_result = MagicMock()
        mock_result.all.return_value = [telemetry1]
        mock_session.exec.return_value = mock_result
        
        response = client.get("/api/telemetry/cost-analytics?group_by=month")
        assert response.status_code == 200
        data = response.json()
        assert "by_time" in data
        
        app.dependency_overrides.clear()

