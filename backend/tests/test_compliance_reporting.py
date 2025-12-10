import pytest
from datetime import datetime, timedelta
from backend.services.compliance_service import ComplianceService
from backend.core.audit_logging import log_access
from fastapi import Request

def test_soc2_report_generation():
    service = ComplianceService()
    start = datetime.utcnow() - timedelta(days=1)
    end = datetime.utcnow()
    
    report_csv = service.generate_soc2_report(start, end)
    assert "Timestamp" in report_csv
    assert "User ID" in report_csv
    assert "login_success" in report_csv

def test_gdpr_report_generation():
    service = ComplianceService()
    report = service.generate_gdpr_report(user_id=123)
    assert report["user_id"] == 123
    assert "data" in report

@pytest.mark.asyncio
async def test_audit_logging_decorator():
    @log_access(action="read", resource_type="test_resource")
    async def sensitive_op(request: Request):
        return "success"
    
    # Mock request
    request = Request({"type": "http", "headers": [], "client": ("127.0.0.1", 8000)})
    result = await sensitive_op(request)
    assert result == "success"
