from typing import Any, List, Optional, Mapping
from langchain.llms.base import LLM
from aistrale.client import Aistrale

class AistraleLLM(LLM):
    """
    Aistrale LLM wrapper for LangChain.
    """
    
    model: str = "gpt-3.5-turbo"
    provider: str = "openai"
    temperature: float = 0.7
    api_key: Optional[str] = None
    
    _client: Aistrale = None

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self._client = Aistrale(api_key=self.api_key)

    @property
    def _llm_type(self) -> str:
        return "aistrale"

    def _call(self, prompt: str, stop: Optional[List[str]] = None) -> str:
        """
        Run the LLM on the given prompt and return the string prediction.
        """
        response = self._client.run(
            prompt, 
            model=self.model, 
            provider=self.provider,
            temperature=self.temperature,
            stop=stop
        )
        return response["choices"][0]["message"]["content"]
    
    @property
    def _identifying_params(self) -> Mapping[str, Any]:
        """Get the identifying parameters."""
        return {
            "model": self.model, 
            "provider": self.provider,
            "temperature": self.temperature
        }
