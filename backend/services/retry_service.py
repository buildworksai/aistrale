import logging
import random
import asyncio
from typing import Callable, Any
from models.reliability import RetryConfig

logger = logging.getLogger(__name__)

class RetryService:
    """
    Handles exponential backoff and retry logic.
    """

    def __init__(self):
        # Simulation: Default configs
        self.default_config = RetryConfig(
            provider="default", 
            max_attempts=3, 
            initial_delay_ms=100, 
            backoff_multiplier=2.0
        )

    async def execute_with_retry(self, func: Callable, *args, **kwargs) -> Any:
        """
        Execute an async function with retries.
        """
        attempts = 0
        config = self.default_config # In reality, could fetch per-provider config
        delay = config.initial_delay_ms / 1000.0
        
        while attempts < config.max_attempts:
            try:
                return await func(*args, **kwargs)
            except Exception as e:
                attempts += 1
                if attempts >= config.max_attempts:
                    logger.error(f"Retry: Failed after {attempts} attempts. Error: {e}")
                    raise e
                
                # Jitter
                jitter = random.uniform(0, 0.1 * delay)
                sleep_time = delay + jitter
                
                logger.warning(f"Retry: Attempt {attempts} failed. Retrying in {sleep_time:.2f}s...")
                await asyncio.sleep(sleep_time)
                
                delay *= config.backoff_multiplier
