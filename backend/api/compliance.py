"""Compliance reporting API endpoints."""

from datetime import datetime

import structlog
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import BaseModel
from sqlmodel import Session

from api.deps import require_admin
from core.database import get_session
from services.compliance_service import ComplianceService

logger = structlog.get_logger()
router = APIRouter()


class GdprRequest(BaseModel):
    user_id: int


class ReportRequest(BaseModel):
    start_date: datetime
    end_date: datetime


def get_compliance_service(
    session: Session = Depends(get_session),
) -> ComplianceService:
    """Dependency to get ComplianceService instance."""
    return ComplianceService(session=session)


@router.post("/gdpr-export")
def generate_gdpr_export(
    request: Request,
    gdpr_request: GdprRequest,
    session: Session = Depends(get_session),
    compliance_service: ComplianceService = Depends(get_compliance_service),
    user_id: int = Depends(require_admin),
) -> dict:
    """
    Generate a GDPR data portability report for a user (admin only).
    """
    try:
        result = compliance_service.generate_gdpr_report(gdpr_request.user_id)

        logger.info(
            "gdpr_report_generated",
            user_id=gdpr_request.user_id,
            admin_user_id=user_id,
        )

        return {
            "status": "completed",
            "report_id": (
                f"gdpr_{gdpr_request.user_id}_"
                f"{result.get('generated_at', 'now')}"
            ),
            "data": result,
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e


@router.post("/soc2-report")
def generate_soc2_report(
    request: Request,
    report_request: ReportRequest,
    session: Session = Depends(get_session),
    compliance_service: ComplianceService = Depends(get_compliance_service),
    user_id: int = Depends(require_admin),
) -> Response:
    """
    Generate a SOC 2 compliance report (admin only).
    Returns CSV file.
    """
    csv_content = compliance_service.generate_soc2_report(
        report_request.start_date, report_request.end_date
    )

    logger.info(
        "soc2_report_generated",
        start_date=report_request.start_date.isoformat(),
        end_date=report_request.end_date.isoformat(),
        admin_user_id=user_id,
    )

    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={
            "Content-Disposition": (
                "attachment; filename=\"soc2_report_"
                f"{datetime.utcnow().strftime('%Y%m%d')}"
                ".csv\""
            )
        },
    )


@router.post("/hipaa-report")
def generate_hipaa_report(
    request: Request,
    report_request: ReportRequest,
    session: Session = Depends(get_session),
    compliance_service: ComplianceService = Depends(get_compliance_service),
    user_id: int = Depends(require_admin),
) -> dict:
    """
    Generate a HIPAA compliance report (admin only).
    """
    result = compliance_service.generate_hipaa_report(
        report_request.start_date, report_request.end_date
    )

    logger.info(
        "hipaa_report_generated",
        start_date=report_request.start_date.isoformat(),
        end_date=report_request.end_date.isoformat(),
        admin_user_id=user_id,
    )

    return result
