import pytest
from unittest.mock import MagicMock, patch
from sqlmodel import Session
from models.evaluation import Evaluation
from models.prompt import Prompt
from models.token import Token
from services.evaluation_service import EvaluationService


@pytest.mark.asyncio
async def test_run_evaluation(mock_session: Session):
    # Setup
    service = EvaluationService(mock_session)
    evaluation = Evaluation(
        id=1,
        name="test-eval",
        dataset_path="dummy",
        metric="exact_match",
        prompt_id=1,
        status="pending",
        user_id=1,
    )
    prompt = Prompt(id=1, name="test", template="test", user_id=1)
    # Create properly encrypted token
    from cryptography.fernet import Fernet
    from core.config import get_settings

    settings = get_settings()
    cipher = Fernet(settings.ENCRYPTION_KEY.encode())
    encrypted_token = cipher.encrypt(b"test_token").decode()

    token = Token(
        id=1,
        user_id=1,
        provider="openai",
        encrypted_token=encrypted_token,
        label="test",
    )

    # Mock get
    def get_side_effect(model, id):
        if model == Evaluation:
            return evaluation
        if model == Prompt:
            return prompt
        return None

    mock_session.get.side_effect = get_side_effect

    # Mock exec for token
    mock_exec = MagicMock()
    mock_session.exec.return_value = mock_exec
    mock_exec.first.return_value = token

    # Mock load_dataset
    service.load_dataset = MagicMock(
        return_value=[{"input": "Hello", "expected": "Hi there"}]
    )

    # Mock run_inference
    with patch("services.inference_service.run_inference") as mock_run_inference:
        mock_run_inference.return_value = "Hi there"  # Async mock return value?
        # Since run_inference is awaited, the mock should be awaitable or return a future?
        # If using AsyncMock (Python 3.8+), it handles await automatically.
        # If using MagicMock, we need to set return_value to a future or use
        # side_effect async.

        async def async_return(*args, **kwargs):
            return "Hi there"

        mock_run_inference.side_effect = async_return

        # Run
        await service.run_evaluation(1)

        # Verify
        assert evaluation.status == "completed"
        # Verify results were added
        assert (
            mock_session.add.call_count >= 3
        )  # eval update + 2 results + eval completion
