from slowapi import Limiter
from slowapi.util import get_remote_address

from core.config import get_settings

settings = get_settings()

# Initialize limiter with Redis storage if available, otherwise memory
# Since we have Redis, we should use it, but slowapi defaults to memory
# if storage_uri is not provided
# For now, we'll use memory for simplicity in setup, but in prod it should be Redis
limiter = Limiter(key_func=get_remote_address, storage_uri=settings.REDIS_URL)
