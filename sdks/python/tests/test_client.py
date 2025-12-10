import os
import pytest
from aistrale.client import Aistrale

# Set TEST_MODE to ensure we don't try to hit real localhost during CI/unit test
os.environ["AISTRALE_TEST_MODE"] = "true"

def test_client_init():
    client = Aistrale(api_key="sk-test")
    assert client.api_key == "sk-test"

def test_run_sync():
    client = Aistrale(api_key="sk-test")
    response = client.run("Hello sync")
    assert "Mock response" in response["choices"][0]["message"]["content"]
    assert "Hello sync" in response["choices"][0]["message"]["content"]

@pytest.mark.asyncio
async def test_run_async():
    client = Aistrale(api_key="sk-test")
    response = await client.run_async("Hello async")
    assert "Mock response" in response["choices"][0]["message"]["content"]

def test_context_manager():
    with Aistrale(api_key="sk-test") as client:
        response = client.run("In context")
        assert "Mock response" in response["choices"][0]["message"]["content"]
