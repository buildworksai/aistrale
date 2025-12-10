"""Scheduler for background jobs."""

import structlog
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlmodel import Session

from core.database import engine
from services.key_rotation_service import KeyRotationService

logger = structlog.get_logger()

scheduler = BackgroundScheduler()


def setup_scheduled_jobs():
    """Setup scheduled background jobs."""
    # Schedule key rotation quarterly (every 3 months on the 1st at 2 AM)
    scheduler.add_job(
        rotate_encryption_key_job,
        trigger=CronTrigger(month="*/3", day=1, hour=2, minute=0),
        id="rotate_encryption_key",
        name="Rotate encryption key quarterly",
        replace_existing=True,
    )
    
    logger.info("scheduled_jobs_setup", jobs=["rotate_encryption_key"])


def rotate_encryption_key_job():
    """Scheduled job to rotate encryption key."""
    logger.info("key_rotation_job_started")
    
    try:
        with Session(engine) as session:
            rotation_service = KeyRotationService(session)
            new_key_id, re_encrypted_count = rotation_service.rotate_key()
            
            logger.info(
                "key_rotation_job_completed",
                new_key_id=new_key_id,
                re_encrypted_count=re_encrypted_count,
            )
    except Exception as e:
        logger.error(
            "key_rotation_job_failed",
            error=str(e),
            exc_info=True,
        )


def start_scheduler():
    """Start the scheduler."""
    setup_scheduled_jobs()
    scheduler.start()
    logger.info("scheduler_started")


def shutdown_scheduler():
    """Shutdown the scheduler."""
    scheduler.shutdown()
    logger.info("scheduler_shutdown")

