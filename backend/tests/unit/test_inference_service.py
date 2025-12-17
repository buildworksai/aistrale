from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from core.exceptions import InferenceError
from models.telemetry import Telemetry
from services.inference_service import run_inference


@pytest.mark.asyncio
async def test_cost_calculation(mock_session):
    # Mock provider
    with patch("services.inference_service.get_provider") as mock_get_provider:
        mock_provider = MagicMock()
        mock_provider.run_inference = AsyncMock(
            return_value={
                "output": "Test response",
                "input_tokens": 1000,
                "output_tokens": 500,
            }
        )
        mock_get_provider.return_value = mock_provider

        await run_inference(
            session=mock_session,
            user_id=1,
            provider="openai",
            model="gpt-3.5-turbo",
            input_text="Test",
            token_value="dummy",
        )

        # Verify cost
        # Input: 1000 * 0.5 / 1M = 0.0005
        # Output: 500 * 1.5 / 1M = 0.00075
        # Total: 0.00125

        # Check if telemetry was added
        telemetry = mock_session.add.call_args[0][0]
        assert isinstance(telemetry, Telemetry)
        assert abs(telemetry.cost - 0.00125) < 0.0001


@pytest.fixture
def mock_session():
    session = MagicMock()
    return session


@pytest.mark.asyncio
@patch("services.inference_service.get_provider")
async def test_run_inference_huggingface_text_generation(
    mock_get_provider, mock_session
):
    # Setup mock provider
    mock_provider = MagicMock()
    mock_provider.run_inference = AsyncMock(
        return_value={
            "output": "Generated text",
            "input_tokens": None,
            "output_tokens": None,
        }
    )
    mock_get_provider.return_value = mock_provider

    # Execute
    result = await run_inference(
        session=mock_session,
        user_id=1,
        provider="huggingface",
        model="gpt2",
        input_text="Hello",
        token_value="fake_token",
        task="text-generation",
    )

    # Verify
    assert result == "Generated text"
    mock_provider.run_inference.assert_called_once()
    mock_session.add.assert_called_once()
    mock_session.commit.assert_called_once()

    # Verify telemetry
    telemetry_call = mock_session.add.call_args[0][0]
    assert isinstance(telemetry_call, Telemetry)
    assert telemetry_call.user_id == 1
    assert telemetry_call.sdk == "huggingface"
    assert telemetry_call.status == "success"


@pytest.mark.asyncio
@patch("services.inference_service.get_provider")
async def test_run_inference_openai(mock_get_provider, mock_session):
    # Setup mock provider
    mock_provider = MagicMock()
    mock_provider.run_inference = AsyncMock(
        return_value={
            "output": "OpenAI response",
            "input_tokens": 10,
            "output_tokens": 20,
        }
    )
    mock_get_provider.return_value = mock_provider

    # Execute
    result = await run_inference(
        session=mock_session,
        user_id=1,
        provider="openai",
        model="gpt-3.5-turbo",
        input_text="Hello",
        token_value="fake_key",
    )

    # Verify
    assert result == "OpenAI response"
    mock_provider.run_inference.assert_called_once()

    # Verify telemetry tokens
    telemetry_call = mock_session.add.call_args[0][0]
    assert telemetry_call.input_tokens == 10
    assert telemetry_call.output_tokens == 20


@pytest.mark.asyncio
@patch("services.inference_service.get_provider")
async def test_run_inference_groq(mock_get_provider, mock_session):
    # Setup mock provider
    mock_provider = MagicMock()
    mock_provider.run_inference = AsyncMock(
        return_value={
            "output": "Groq response",
            "input_tokens": 15,
            "output_tokens": 25,
        }
    )
    mock_get_provider.return_value = mock_provider

    # Execute
    result = await run_inference(
        session=mock_session,
        user_id=1,
        provider="groq",
        model="llama3",
        input_text="Hello",
        token_value="fake_key",
    )

    # Verify
    assert result == "Groq response"

    # Verify telemetry tokens
    telemetry_call = mock_session.add.call_args[0][0]
    assert telemetry_call.input_tokens == 15
    assert telemetry_call.output_tokens == 25


@pytest.mark.asyncio
@patch("services.inference_service.get_provider")
async def test_run_inference_invalid_provider(mock_get_provider, mock_session):
    # Mock provider factory to raise ValueError
    mock_get_provider.side_effect = ValueError("Unsupported provider: invalid")

    with pytest.raises(InferenceError):
        await run_inference(
            session=mock_session,
            user_id=1,
            provider="invalid",
            model="model",
            input_text="Hello",
            token_value="token",
        )

    telemetry_call = mock_session.add.call_args[0][0]
    assert telemetry_call.status == "error"
