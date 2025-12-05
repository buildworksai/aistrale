from unittest.mock import MagicMock, patch
from services.inference_service import run_inference
from models.prompt import Prompt
from core.metrics import INFERENCE_COUNT

def test_inference_with_prompt_rendering(mock_session):
    # Setup
    prompt = Prompt(
        name="test-render",
        template="Hello {{ name }}",
        input_variables=["name"],
        user_id=1,
        id=1
    )
    mock_session.get.return_value = prompt
    
    # Mock external API
    with patch("services.inference_service.InferenceClient") as mock_client_cls:
        mock_client = MagicMock()
        mock_client_cls.return_value = mock_client
        mock_client.text_generation.return_value = "Generated text"
        
        # Run
        run_inference(
            session=mock_session,
            user_id=1,
            provider="huggingface",
            model="gpt2",
            input_text="ignored",
            token_value="token",
            prompt_id=1,
            prompt_variables={"name": "World"}
        )
        
        # Verify prompt was rendered and passed to client
        # The rendered prompt should be "Hello World"
        # run_inference logic: input_text = render_prompt(...) -> "Hello World"
        # full_input construction: "User: Hello World\nAssistant:" (since history is empty)
        
        args, _ = mock_client.text_generation.call_args
        assert "Hello World" in args[0]

def test_metrics_recording(mock_session):
    # Reset counter
    INFERENCE_COUNT._metrics.clear()
    
    with patch("services.inference_service.InferenceClient") as mock_client_cls:
        mock_client = MagicMock()
        mock_client_cls.return_value = mock_client
        mock_client.text_generation.return_value = "Generated text"
        
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
