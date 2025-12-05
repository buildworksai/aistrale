from unittest.mock import MagicMock, patch
import pytest
from services.evaluation_service import EvaluationService
from services.inference_service import run_inference
from core.exceptions import InferenceError

def test_load_dataset_json(tmp_path):
    # Create dummy json
    d = tmp_path / "data.json"
    d.write_text('[{"input": "a", "expected": "b"}]')
    
    service = EvaluationService(MagicMock())
    dataset = service.load_dataset(str(d))
    assert len(dataset) == 1
    assert dataset[0]["input"] == "a"

def test_load_dataset_csv(tmp_path):
    # Create dummy csv
    d = tmp_path / "data.csv"
    d.write_text('input,expected\na,b')
    
    service = EvaluationService(MagicMock())
    dataset = service.load_dataset(str(d))
    assert len(dataset) == 1
    assert dataset[0]["input"] == "a"

@pytest.mark.asyncio
async def test_manual_tracing_and_error_context(mock_session):
    # Mock trace and sentry
    with patch("services.inference_service.tracer") as mock_tracer, \
         patch("services.inference_service.sentry_sdk") as mock_sentry:
        
        mock_span = MagicMock()
        mock_tracer.start_as_current_span.return_value.__enter__.return_value = mock_span
        
        # Simulate error
        with patch("services.inference_service.AsyncInferenceClient") as mock_client_cls:
            mock_client = MagicMock()
            mock_client_cls.return_value = mock_client
            # Async mock for text_generation
            async def side_effect(*args, **kwargs):
                raise Exception("API Error")
            mock_client.text_generation.side_effect = side_effect
            
            with pytest.raises(InferenceError):
                await run_inference(
                    session=mock_session,
                    user_id=1,
                    provider="huggingface",
                    model="gpt2",
                    input_text="test",
                    token_value="token"
                )
            
            # Verify span attributes
            mock_span.set_attribute.assert_any_call("llm.provider", "huggingface")
            mock_span.record_exception.assert_called()
            
            # Verify Sentry capture
            mock_sentry.capture_exception.assert_called()
