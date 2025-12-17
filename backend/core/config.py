from functools import lru_cache

from pydantic import ConfigDict
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # PROJECT_NAME is deprecated - use branding.get_full_product_name() instead
    PROJECT_NAME: str = "AISTRALE - Turn AI from a black box into an engineered system"
    API_V1_STR: str = "/api/v1"

    DATABASE_URL: str = "postgresql://user:password@db:5432/huggingface_db"
    REDIS_URL: str = "redis://redis:6379"
    SENTRY_DSN: str = ""
    # SECRET_KEY must be set in environment variables for security
    SECRET_KEY: str
    ENCRYPTION_KEY: str  # Required for token encryption
    ALGORITHM: str = "HS256"
    JAEGER_ENABLED: bool = True
    TESTING: bool = False

    ADMIN_SEED_EMAIL: str | None = None
    ADMIN_SEED_PASSWORD: str | None = None

    model_config = ConfigDict(env_file=".env")


@lru_cache
def get_settings():
    return Settings()


def clear_settings_cache():
    """Clear the settings cache. Useful for testing."""
    get_settings.cache_clear()
