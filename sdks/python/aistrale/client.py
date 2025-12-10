import os
import httpx
import asyncio
from typing import Optional, Dict, Any, Union

class Aistrale:
    """
    The Aistrale Python Client for easy interaction with the AISTRALE platform.
    """
    
    def __init__(self, api_key: Optional[str] = None, api_url: Optional[str] = None):
        self.api_key = api_key or os.environ.get("AISTRALE_API_KEY")
        self.api_url = api_url or os.environ.get("AISTRALE_API_URL", "http://localhost:8000/api")
        
        if not self.api_key:
            # For development, we might allow no API key or use a dummy one if running locally
            pass

    def run(self, prompt: str, model: str = "gpt-3.5-turbo", provider: str = "openai", **kwargs) -> Dict[str, Any]:
        """
        Synchronous inference run.
        """
        # Wrap async call in simple runner for convenience
        try:
            return asyncio.run(self.run_async(prompt, model, provider, **kwargs))
        except RuntimeError:
             # Handle case where event loop is already running (e.g. Jupyter)
             # This is a simplified fallback; robust implementation checks loops
             loop = asyncio.new_event_loop()
             asyncio.set_event_loop(loop)
             return loop.run_until_complete(self.run_async(prompt, model, provider, **kwargs))

    async def run_async(self, prompt: str, model: str = "gpt-3.5-turbo", provider: str = "openai", **kwargs) -> Dict[str, Any]:
        """
        Asynchronous inference run.
        """
        url = f"{self.api_url}/v1/inference/chat"
        # Provide minimal implementation for the "run" experience
        # In reality this maps to the backend's inference endpoint
        
        payload = {
            "model": model,
            "provider": provider,
            "messages": [{"role": "user", "content": prompt}],
            **kwargs
        }
        
        # Simulation: For now, if we cannot hit localhost, we mock response locally to allow SDK testing 
        # independent of running backend server (unit test mode).
        # In integration tests, we'd hit the real server.
        
        if os.environ.get("AISTRALE_TEST_MODE"):
            return {
                "id": "mock-id",
                "object": "chat.completion",
                "choices": [{"message": {"role": "assistant", "content": f"Mock response for: {prompt}"}}],
                "usage": {"total_tokens": 10}
            }

        async with httpx.AsyncClient() as client:
            try:
                # Add headers for authentication
                headers = {"Authorization": f"Bearer {self.api_key}"} if self.api_key else {}
                response = await client.post(url, json=payload, headers=headers, timeout=60.0)
                response.raise_for_status()
                return response.json()
            except httpx.RequestError as e:
                # Fallback purely for demonstration if backend isn't up
                return {"error": f"Connection failed: {e}", "mock": True, "content": f"Simulated response to '{prompt}'"}

    def session(self):
        """
        Context manager for session (placeholder for stateful interactions).
        """
        return self
    
    def __enter__(self):
        return self
        
    def __exit__(self, exc_type, exc_val, exc_tb):
        pass
