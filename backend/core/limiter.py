import os

from slowapi import Limiter
from slowapi.util import get_remote_address

from core.config import get_settings

settings = get_settings()

# Initialize limiter with Redis storage if available, otherwise memory
# Since we have Redis, we should use it, but slowapi defaults to memory
# if storage_uri is not provided
# For now, we'll use memory for simplicity in setup, but in prod it should
# be Redis
limiter = Limiter(key_func=get_remote_address, storage_uri=settings.REDIS_URL)


def limit(rate_limit: str):
    """
    Conditional rate limit decorator that only applies in non-test mode.
    
    In test mode, returns a no-op decorator to avoid rate limiting issues.
    This ensures tests can run without hitting rate limits.
    """
    # Check if we're in test mode
    is_testing = (
        os.getenv("TESTING", "false").lower() == "true"
        or getattr(settings, "TESTING", False)
    )

    if is_testing:
        # Return a no-op decorator that preserves function signature
        def noop_decorator(func):
            return func
        return noop_decorator
    else:
        # Return the actual rate limit decorator
        return limiter.limit(rate_limit)
