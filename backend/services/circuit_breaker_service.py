import logging
from datetime import datetime
from typing import Dict
from models.reliability import CircuitBreaker

logger = logging.getLogger(__name__)


class CircuitBreakerService:
    """
    Manages circuit breakers for providers.
    """

    def __init__(self, failure_threshold: int = 5,
                 recovery_timeout_sec: int = 30):
        self.failure_threshold = failure_threshold
        self.recovery_timeout_sec = recovery_timeout_sec
        self._breakers: Dict[str, CircuitBreaker] = {}

    def get_breaker(self, provider: str) -> CircuitBreaker:
        if provider not in self._breakers:
            self._breakers[provider] = CircuitBreaker(
                provider=provider, state="closed")
        return self._breakers[provider]

    def is_open(self, provider: str) -> bool:
        """
        Check if circuit is OPEN (requests should be blocked).
        Also handles Half-Open transition logic.
        """
        breaker = self.get_breaker(provider)

        if breaker.state == "closed":
            return False

        if breaker.state == "open":
            # Check if timeout expired
            if breaker.opened_at:
                elapsed = (
                    datetime.utcnow() -
                    breaker.opened_at).total_seconds()
                if elapsed > self.recovery_timeout_sec:
                    breaker.state = "half-open"
                    logger.info(f"Circuit for {provider} moved to HALF-OPEN")
                    return False  # Allow traffic to probe
            return True  # Still open

        if breaker.state == "half-open":
            return False  # Allow traffic to probe

        return False

    def record_success(self, provider: str):
        """
        Record a successful call.
        """
        breaker = self.get_breaker(provider)
        if breaker.state == "half-open":
            breaker.state = "closed"
            breaker.failure_count = 0
            breaker.opened_at = None
            logger.info(f"Circuit for {provider} recovered to CLOSED")
        elif breaker.state == "closed":
            breaker.failure_count = 0

    def record_failure(self, provider: str):
        """
        Record a failed call.
        """
        breaker = self.get_breaker(provider)
        breaker.failure_count += 1
        breaker.last_failure = datetime.utcnow()

        if (
            breaker.state == "closed"
            and breaker.failure_count >= self.failure_threshold
        ):
            breaker.state = "open"
            breaker.opened_at = datetime.utcnow()
            logger.warning(f"Circuit for {provider} TRIPPED to OPEN")

        elif breaker.state == "half-open":
            breaker.state = "open"
            breaker.opened_at = datetime.utcnow()
            logger.warning(f"Circuit for {provider} failed probe, re-OPENED")
