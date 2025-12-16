"""Tests for scheduler."""

from unittest.mock import patch
from core.scheduler import (
    setup_scheduled_jobs,
    start_scheduler,
    shutdown_scheduler,
    scheduler,
)


class TestScheduler:
    """Test scheduler functionality."""

    def test_setup_scheduled_jobs(self):
        """Test setting up scheduled jobs."""
        with patch.object(scheduler, "add_job") as mock_add_job:
            setup_scheduled_jobs()
            mock_add_job.assert_called_once()

    def test_start_scheduler(self):
        """Test starting scheduler."""
        with patch.object(scheduler, "start") as mock_start:
            with patch("core.scheduler.setup_scheduled_jobs"):
                start_scheduler()
                mock_start.assert_called_once()

    def test_shutdown_scheduler(self):
        """Test shutting down scheduler."""
        with patch.object(scheduler, "shutdown") as mock_shutdown:
            shutdown_scheduler()
            mock_shutdown.assert_called_once()
