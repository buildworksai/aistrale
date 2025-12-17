"""Compliance reporting service."""

import csv
import io
import logging
from datetime import datetime
from typing import Any

from sqlmodel import Session, and_, select

from models.security_audit import SecurityAudit
from models.telemetry import Telemetry
from models.user import User

logger = logging.getLogger(__name__)


class ComplianceService:
    """
    Service for generating compliance reports (SOC 2, GDPR, HIPAA).
    """

    def __init__(self, session: Session):
        self.session = session

    def generate_soc2_report(
            self,
            start_date: datetime,
            end_date: datetime) -> str:
        """
        Generates a simplified SOC 2 report (Access Logs) in CSV format.
        """
        logger.info(f"Generating SOC 2 report from {start_date} to {end_date}")

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(
            [
                "Timestamp",
                "User ID",
                "Event Type",
                "IP Address",
                "User Agent",
                "Details",
            ]
        )

        # Query security audit logs
        query = select(SecurityAudit).where(
            and_(
                SecurityAudit.created_at >= start_date,
                SecurityAudit.created_at <= end_date,
            )
        )
        audit_logs = self.session.exec(query).all()

        for log in audit_logs:
            writer.writerow(
                [
                    log.created_at.isoformat(),
                    log.user_id or "",
                    log.event_type,
                    log.ip_address,
                    log.user_agent or "",
                    str(log.details),
                ]
            )

        return output.getvalue()

    def generate_gdpr_report(self, user_id: int) -> dict[str, Any]:
        """
        Generates a data portability report for a user.
        """
        logger.info(f"Generating GDPR report for user {user_id}")

        # Get user data
        user = self.session.get(User, user_id)
        if not user:
            raise ValueError(f"User {user_id} not found")

        # Get user's telemetry data
        telemetry_query = select(Telemetry).where(Telemetry.user_id == user_id)
        telemetry_records = self.session.exec(telemetry_query).all()

        # Get user's audit logs
        audit_query = select(SecurityAudit).where(
            SecurityAudit.user_id == user_id)
        audit_logs = self.session.exec(audit_query).all()

        return {
            "user_id": user_id,
            "generated_at": datetime.utcnow().isoformat(),
            "data": {
                "profile": {
                    "id": user.id,
                    "email": user.email,
                    "name": user.name,
                    "role": user.role,
                    "is_active": user.is_active,
                    "created_at": (
                        user.created_at.isoformat() if user.created_at else None
                    ),
                },
                "telemetry_records": [
                    {
                        "id": record.id,
                        "model": record.model,
                        "provider": record.sdk,
                        "tokens": record.tokens,
                        "cost": record.cost,
                        "created_at": (
                            record.created_at.isoformat() if record.created_at else None
                        ),
                    }
                    for record in telemetry_records
                ],
                "audit_logs": [
                    {
                        "id": log.id,
                        "event_type": log.event_type,
                        "ip_address": log.ip_address,
                        "user_agent": log.user_agent,
                        "created_at": (
                            log.created_at.isoformat() if log.created_at else None
                        ),
                        "details": log.details,
                    }
                    for log in audit_logs
                ],
            },
        }

    def generate_hipaa_report(
        self, start_date: datetime, end_date: datetime
    ) -> dict[str, Any]:
        """
        Generates a HIPAA compliance report focusing on PHI access.
        """
        logger.info(f"Generating HIPAA report from {start_date} to {end_date}")

        # Query audit logs for PHI-related events
        query = select(SecurityAudit).where(
            and_(
                SecurityAudit.created_at >= start_date,
                SecurityAudit.created_at <= end_date,
            )
        )
        audit_logs = self.session.exec(query).all()

        # Filter for PHI-related events (inference requests, data access)
        phi_events = [
            log
            for log in audit_logs
            if log.event_type
            in [
                "inference_request",
                "data_access",
                "telemetry_access",
                "prompt_access",
            ]
        ]

        return {
            "report_type": "HIPAA",
            "period": {
                "start": start_date.isoformat(),
                "end": end_date.isoformat(),
            },
            "phi_access_events": len(phi_events),
            "total_events": len(audit_logs),
            "events": [
                {
                    "timestamp": log.created_at.isoformat() if log.created_at else None,
                    "user_id": log.user_id,
                    "event_type": log.event_type,
                    "ip_address": log.ip_address,
                }
                for log in phi_events
            ],
            "generated_at": datetime.utcnow().isoformat(),
        }
