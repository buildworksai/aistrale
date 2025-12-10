"""Google Gemini provider implementation."""

import asyncio
from typing import Optional, Dict

import google.generativeai as genai

from services.llm_providers.base import LLMProvider, InferenceResult


class GeminiProvider(LLMProvider):
    """Google Gemini provider."""

    def __init__(self, token: str, **kwargs):
        """
        Initialize Gemini provider.
        
        Args:
            token: Google API key
            **kwargs: Additional parameters
        """
        self.token = token
        genai.configure(api_key=token)

    async def run_inference(
        self,
        model: str,
        input_text: str,
        history: Optional[list] = None,
        **kwargs
    ) -> InferenceResult:
        """Run Gemini inference."""
        history = history or []
        target_model = model if model and model != "auto" else "gemini-pro"

        # Initialize the model
        genai_model = genai.GenerativeModel(target_model)

        # Convert history to Gemini format
        chat_history = []
        for msg in history:
            if msg["role"] == "user":
                chat_history.append({"role": "user", "parts": [msg["content"]]})
            elif msg["role"] == "assistant":
                chat_history.append({"role": "model", "parts": [msg["content"]]})

        # Start chat with history
        chat = genai_model.start_chat(history=chat_history)

        # Send current message (run in thread pool since Gemini SDK is sync)
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None, chat.send_message, input_text
        )
        
        result = response.text
        # Gemini doesn't provide token counts in the response
        # We'll estimate or leave as None
        input_tokens = None
        output_tokens = None

        return InferenceResult(
            output=result,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
        )

    def get_pricing(self, model: str) -> Dict[str, float]:
        """Get Gemini pricing per 1M tokens."""
        # Pricing per 1M tokens
        pricing = {
            "gemini-pro": {"input": 0.5, "output": 1.5},
            "gemini-pro-vision": {"input": 0.25, "output": 1.0},
            "gemini-1.5-pro": {"input": 1.25, "output": 5.0},
            "gemini-1.5-flash": {"input": 0.075, "output": 0.3},
        }
        
        # Default to gemini-pro pricing if model not found
        return pricing.get(model, {"input": 0.5, "output": 1.5})

    def get_provider_name(self) -> str:
        """Get provider name."""
        return "gemini"

