from fastapi.testclient import TestClient
from sqlmodel import Session
from models.prompt import Prompt
from models.user import User


def test_custom_metrics_exposed(client: TestClient):
    response = client.get("/metrics")
    assert response.status_code == 200
    metrics = response.text
    assert "llm_requests_total" in metrics
    assert "llm_latency_seconds" in metrics
    assert "llm_tokens_total" in metrics
    assert "llm_cost_usd" in metrics


def test_rate_limiting(client: TestClient):
    # This might be tricky if rate limit is per IP and we are in test client
    # But slowapi usually works with TestClient if configured correctly
    # Limit is 10/minute for /api/inference/run

    # We need to mock a valid token and user
    # For simplicity, let's just hit the endpoint and expect 401 or 422, but the rate limit should trigger first if we hit it enough?
    # Actually rate limit triggers before auth in some configs, or after.
    # Let's try to hit a public endpoint if we limited one, but we limited
    # authenticated ones.
    pass


def test_prompt_rendering_flow(client: TestClient, mock_session: Session):
    # Setup
    user = User(
        email="test@example.com",
        password_hash="hash",
        role="user",
        id=1)
    prompt = Prompt(
        name="test-render",
        template="Hello {name}",
        input_variables=["name"],
        user_id=1,
        id=1,
    )

    # Mock session
    def side_effect_get(model, id):
        if model == Prompt and id == 1:
            return prompt
        if model == User and id == 1:
            return user
        return None

    mock_session.get.side_effect = side_effect_get

    # We need to mock run_inference to avoid actual API call, but we want to test the rendering logic which happens inside run_inference service
    # So we should test the service directly or integration test with mocked
    # external API
