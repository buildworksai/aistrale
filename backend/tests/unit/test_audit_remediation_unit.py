from unittest.mock import MagicMock, patch, AsyncMock
import pytest
from services.inference_service import run_inference
from models.prompt import Prompt
from core.metrics import INFERENCE_COUNT

@pytest.mark.asyncio
async def test_inference_with_prompt_rendering(mock_session):
    # Setup
    prompt = Prompt(
        name="test-render",
        template="Hello {{ name }}",
        input_variables=["name"],
        user_id=1,
        id=1
    )
    mock_session.get.return_value = prompt
    
    # Mock provider
    with patch("services.inference_service.get_provider") as mock_get_provider:
        mock_provider = MagicMock()
        mock_provider.run_inference = AsyncMock(return_value={
            "output": "Generated text",
            "input_tokens": None,
            "output_tokens": None,
        })
        mock_get_provider.return_value = mock_provider
        
        # Run
        await run_inference(
            session=mock_session,
            user_id=1,
            provider="huggingface",
            model="gpt2",
            input_text="ignored",
            token_value="token",
            prompt_id=1,
            prompt_variables={"name": "World"}
        )
        
        # Verify prompt was rendered and passed to provider
        call_args = mock_provider.run_inference.call_args
        assert call_args is not None
        # The input_text should be "Hello World" after rendering
        assert "Hello World" in call_args.kwargs.get("input_text", "")

@pytest.mark.asyncio
async def test_metrics_recording(mock_session):
    # Reset counter
    INFERENCE_COUNT._metrics.clear()
    
    with patch("services.inference_service.get_provider") as mock_get_provider:
        mock_provider = MagicMock()
        mock_provider.run_inference = AsyncMock(return_value={
            "output": "Generated text",
            "input_tokens": None,
            "output_tokens": None,
        })
        mock_get_provider.return_value = mock_provider
        
        run_inference(
            session=mock_session,
            user_id=1,
            provider="huggingface",
            model="gpt2",
            input_text="test",
            token_value="token"
        )
        
        # Verify metric incremented
        # Accessing private member for testing is not ideal but prometheus_client doesn't make it easy to inspect
        # Actually we can use .collect()
        samples = list(INFERENCE_COUNT.collect()[0].samples)
        assert len(samples) > 0
        assert samples[0].value == 1.0
