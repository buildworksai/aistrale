import os
import sys

from sqlmodel import Session, select

from core.database import engine, init_db
from models.cost_optimization import Budget
from models.security_audit import SecurityAudit
from models.user import User

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))


def seed_data():
    # Ensure tables exist
    print("Creating tables if not exist...")
    init_db()

    with Session(engine) as session:
        # 1. Seed Budget
        existing_budget = session.exec(select(Budget)).first()
        if not existing_budget:
            print("Seeding initial budget...")
            budget = Budget(
                workspace_id=1,
                amount=5000.0,
                period="monthly",
                alert_thresholds={"warning": 80, "critical": 100},
            )
            session.add(budget)
            session.commit()
            print("Budget seeded.")
        else:
            print("Budget already exists.")

        # 2. Seed some Security Audit logs if empty
        logs = session.exec(select(SecurityAudit)).first()
        if not logs:
            print("Seeding security audit logs...")
            # We need a user first?
            user = session.exec(select(User)).first()
            user_id = user.id if user else None

            session.add(
                SecurityAudit(
                    event_type="login_success",
                    user_id=user_id,
                    ip_address="127.0.0.1",
                    action="LOGIN",
                    resource_type="SYSTEM",
                    details={"method": "password"},
                )
            )
            session.add(
                SecurityAudit(
                    event_type="access_granted",
                    user_id=user_id,
                    ip_address="127.0.0.1",
                    action="VIEW",
                    resource_type="REPORT",
                    resource_id="financial_q3",
                    details={"reason": "audit"},
                )
            )
            session.commit()
            print("Audit logs seeded.")
        else:
            print("Audit logs already exist.")


if __name__ == "__main__":
    seed_data()
