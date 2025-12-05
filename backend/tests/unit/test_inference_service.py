from unittest.mock import MagicMock, patch
import pytest
from core.exceptions import InferenceError
from models.telemetry import Telemetry
from services.inference_service import run_inference

@pytest.mark.asyncio
async def test_cost_calculation(mock_session):
    # Mock provider response
    with patch("services.inference_service.AsyncOpenAI") as mock_openai:
        mock_client = MagicMock()
        mock_openai.return_value = mock_client
        mock_response = MagicMock()
        mock_response.choices[0].message.content = "Test response"
        mock_response.usage.prompt_tokens = 1000
        mock_response.usage.completion_tokens = 500
        
        async def async_create(*args, **kwargs):
            return mock_response
        mock_client.chat.completions.create.side_effect = async_create

        await run_inference(
            session=mock_session,
            user_id=1,
            provider="openai",
            model="gpt-3.5-turbo",
            input_text="Test",
            token_value="dummy"
        )
        
        # Verify cost
        # Input: 1000 * 0.5 / 1M = 0.0005
        # Output: 500 * 1.5 / 1M = 0.00075
        # Total: 0.00125
        
        # Check if telemetry was added
        telemetry = mock_session.add.call_args[0][0]
        assert isinstance(telemetry, Telemetry)
        assert telemetry.cost == 0.00125


@pytest.fixture
def mock_session():
    session = MagicMock()
    return session


@pytest.mark.asyncio
@patch("services.inference_service.AsyncInferenceClient")
async def test_run_inference_huggingface_text_generation(mock_client_cls, mock_session):
    # Setup mock
    mock_client = MagicMock()
    mock_client_cls.return_value = mock_client
    
    async def async_text_gen(*args, **kwargs):
        return "Generated text"
    mock_client.text_generation.side_effect = async_text_gen

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
    mock_client.text_generation.assert_called_once()
    mock_session.add.assert_called_once()
    mock_session.commit.assert_called_once()

    # Verify telemetry
    telemetry_call = mock_session.add.call_args[0][0]
    assert isinstance(telemetry_call, Telemetry)
    assert telemetry_call.user_id == 1
    assert telemetry_call.sdk == "huggingface"
    assert telemetry_call.status == "success"


@pytest.mark.asyncio
@patch("services.inference_service.AsyncOpenAI")
async def test_run_inference_openai(mock_openai_cls, mock_session):
    # Setup mock
    mock_client = MagicMock()
    mock_openai_cls.return_value = mock_client

    mock_response = MagicMock()
    mock_response.choices[0].message.content = "OpenAI response"
    mock_response.usage.prompt_tokens = 10
    mock_response.usage.completion_tokens = 20
    
    async def async_create(*args, **kwargs):
        return mock_response
    mock_client.chat.completions.create.side_effect = async_create

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
    mock_client.chat.completions.create.assert_called_once()

    # Verify telemetry tokens
    telemetry_call = mock_session.add.call_args[0][0]
    assert telemetry_call.input_tokens == 10
    assert telemetry_call.output_tokens == 20


@pytest.mark.asyncio
@patch("services.inference_service.AsyncGroq")
async def test_run_inference_groq(mock_groq_cls, mock_session):
    # Setup mock
    mock_client = MagicMock()
    mock_groq_cls.return_value = mock_client

    # Mock streaming response
    mock_chunk1 = MagicMock()
    mock_chunk1.choices[0].delta.content = "Groq "
    mock_chunk2 = MagicMock()
    mock_chunk2.choices[0].delta.content = "response"
    mock_chunk2.usage.prompt_tokens = 15
    mock_chunk2.usage.completion_tokens = 25
    
    # Async iterator for streaming
    async def async_iter(items):
        for item in items:
            yield item
            
    async def async_create(*args, **kwargs):
        return async_iter([mock_chunk1, mock_chunk2])
        
    mock_client.chat.completions.create.side_effect = async_create

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
async def test_run_inference_invalid_provider(mock_session):
    with pytest.raises(InferenceError) as excinfo:
        await run_inference(
            session=mock_session,
            user_id=1,
            provider="invalid",
            model="model",
            input_text="Hello",
            token_value="token",
        )

    assert "Invalid provider" in str(excinfo.value)

    telemetry_call = mock_session.add.call_args[0][0]
    assert telemetry_call.status == "error"
