import os
import pytest
# Mock langchain base
import sys
from unittest.mock import MagicMock

# Simulate langchain module if not installed to allow basic unit testing of wrapper logic
# In a real dev environment, langchain would be installed.
try:
    import langchain
except ImportError:
    # Creating a dummy LLM class to allow inheritance in our module without error
    # This is a hack for the environment constraint, normally we'd `pip install langchain`
    class MockLLM:
        def __init__(self, **kwargs):
            for k, v in kwargs.items():
                setattr(self, k, v)
    
    # Mocking appropriate modules in sys.modules
    m_llms = MagicMock()
    m_llms.base.LLM = MockLLM
    sys.modules["langchain"] = MagicMock()
    sys.modules["langchain.llms"] = m_llms
    sys.modules["langchain.llms.base"] = m_llms.base

from aistrale.integrations.langchain import AistraleLLM

def test_langchain_wrapper():
    os.environ["AISTRALE_TEST_MODE"] = "true"
    llm = AistraleLLM(api_key="sk-test", model="gpt-4", provider="openai")
    
    assert llm.model == "gpt-4"
    assert llm.provider == "openai"
    
    # Test call
    result = llm._call("Test prompt")
    assert "Mock response" in result
