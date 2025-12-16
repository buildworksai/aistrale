---
trigger: always_on
description: LLM-specific features and patterns for AISTRALE
globs: backend/**/*.py, frontend/**/*.{ts,tsx}
---

# 🤖 AISTRALE LLM Features Standards

**⚠️ CRITICAL**: These patterns define how LLM features are implemented in AISTRALE.

## BuildWorks-11001 LLM Provider Support

### Supported Providers
- **HuggingFace Hub**: Primary provider for model inference
- **OpenAI**: Secondary provider for GPT models
- **Future**: Support for additional providers (Anthropic, Cohere, etc.)

### Provider Abstraction
```python
# ✅ GOOD: Provider abstraction pattern
from enum import Enum
from typing import Protocol

class LLMProvider(str, Enum):
    HUGGINGFACE = "huggingface"
    OPENAI = "openai"

class LLMClient(Protocol):
    """Protocol for LLM clients."""
    async def run_inference(
        self,
        model: str,
        inputs: str,
        **kwargs
    ) -> dict:
        """Run inference with the provider."""
        ...

class HuggingFaceClient:
    """HuggingFace inference client."""
    def __init__(self, token: str):
        from huggingface_hub import InferenceClient
        self.client = InferenceClient(token=token)
    
    async def run_inference(
        self,
        model: str,
        inputs: str,
        **kwargs
    ) -> dict:
        """Run HuggingFace inference."""
        result = self.client.post(
            json={"inputs": inputs, "model": model, **kwargs}
        )
        return {
            "output": result,
            "provider": "huggingface"
        }

class OpenAIClient:
    """OpenAI inference client."""
    def __init__(self, api_key: str):
        from openai import OpenAI
        self.client = OpenAI(api_key=api_key)
    
    async def run_inference(
        self,
        model: str,
        inputs: str,
        **kwargs
    ) -> dict:
        """Run OpenAI inference."""
        response = self.client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": inputs}],
            **kwargs
        )
        return {
            "output": response.choices[0].message.content,
            "provider": "openai"
        }
```

## BuildWorks-11002 Inference Service

### Inference Service Pattern
```python
# ✅ GOOD: Inference service implementation
from typing import Optional
from models.token import Token
from core.database import get_session
from sqlmodel import Session, select

class InferenceService:
    """Service for running LLM inference."""
    
    def __init__(self, db: Session):
        self.db = db
    
    async def run_inference(
        self,
        model: str,
        inputs: str,
        provider: LLMProvider,
        user_id: str,
        config: Optional[dict] = None
    ) -> dict:
        """Run inference with telemetry tracking."""
        import time
        start_time = time.time()
        
        # Get token for provider
        token = self._get_token(provider, user_id)
        
        # Get client
        client = self._get_client(provider, token)
        
        try:
            # Run inference
            result = await client.run_inference(
                model=model,
                inputs=inputs,
                **(config or {})
            )
            
            duration = time.time() - start_time
            
            # Log telemetry
            await self._log_telemetry(
                model=model,
                provider=provider.value,
                tokens=result.get("tokens", 0),
                duration=duration,
                status="success",
                user_id=user_id
            )
            
            return result
        except Exception as e:
            duration = time.time() - start_time
            await self._log_telemetry(
                model=model,
                provider=provider.value,
                tokens=0,
                duration=duration,
                status="error",
                user_id=user_id,
                error=str(e)
            )
            raise
    
    def _get_token(self, provider: LLMProvider, user_id: str) -> str:
        """Get token for provider."""
        result = self.db.exec(
            select(Token).where(
                Token.provider == provider.value,
                Token.user_id == user_id
            )
        )
        token = result.first()
        if not token:
            raise NotFoundError("Token", f"{provider.value} for user {user_id}")
        return token.get_token()  # Decrypt token
    
    def _get_client(self, provider: LLMProvider, token: str) -> LLMClient:
        """Get client for provider."""
        if provider == LLMProvider.HUGGINGFACE:
            return HuggingFaceClient(token)
        elif provider == LLMProvider.OPENAI:
            return OpenAIClient(token)
        else:
            raise ValueError(f"Unsupported provider: {provider}")
```

## BuildWorks-11003 Telemetry Tracking

### Telemetry Model
```python
# ✅ GOOD: Telemetry model for tracking inference
from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional

class Telemetry(SQLModel, table=True):
    """Telemetry record for inference tracking."""
    id: Optional[str] = Field(default=None, primary_key=True)
    user_id: str = Field(index=True)
    model: str
    provider: str
    tokens: int
    duration: float  # Duration in seconds
    status: str  # "success" or "error"
    error: Optional[str] = None
    created_at: Optional[datetime] = Field(default_factory=datetime.utcnow)
```

### Telemetry Logging
```python
# ✅ GOOD: Telemetry logging
async def _log_telemetry(
    self,
    model: str,
    provider: str,
    tokens: int,
    duration: float,
    status: str,
    user_id: str,
    error: Optional[str] = None
):
    """Log telemetry record."""
    telemetry = Telemetry(
        user_id=user_id,
        model=model,
        provider=provider,
        tokens=tokens,
        duration=duration,
        status=status,
        error=error
    )
    self.db.add(telemetry)
    self.db.commit()
```

## BuildWorks-11004 Token Management

### Token Storage
```python
# ✅ GOOD: Secure token storage
from sqlmodel import SQLModel, Field
from cryptography.fernet import Fernet
from core.config import get_settings

settings = get_settings()
cipher = Fernet(settings.ENCRYPTION_KEY.encode())

class Token(SQLModel, table=True):
    """Token model with encrypted storage."""
    id: Optional[str] = Field(default=None, primary_key=True)
    user_id: str = Field(index=True)
    provider: str
    encrypted_token: str
    created_at: Optional[datetime] = Field(default_factory=datetime.utcnow)
    
    def set_token(self, token: str):
        """Encrypt and store token."""
        self.encrypted_token = cipher.encrypt(token.encode()).decode()
    
    def get_token(self) -> str:
        """Decrypt and return token."""
        return cipher.decrypt(self.encrypted_token.encode()).decode()
```

## BuildWorks-11005 Future LLM Features (Roadmap)

### Prompt Management (Future)
```python
# ✅ GOOD: Prompt management pattern (to be implemented)
class Prompt(SQLModel, table=True):
    """Prompt template with versioning."""
    id: Optional[str] = Field(default=None, primary_key=True)
    name: str
    version: int
    template: str  # Jinja2 template
    variables: dict  # Template variables
    created_at: Optional[datetime] = Field(default_factory=datetime.utcnow)

def render_prompt(prompt: Prompt, variables: dict) -> str:
    """Render prompt template with variables."""
    from jinja2 import Template
    template = Template(prompt.template)
    return template.render(**variables)
```

### Cost Tracking (Future)
```python
# ✅ GOOD: Cost tracking pattern (to be implemented)
class CostRecord(SQLModel, table=True):
    """Cost tracking for LLM usage."""
    id: Optional[str] = Field(default=None, primary_key=True)
    user_id: str
    model: str
    provider: str
    tokens: int
    cost: float  # Cost in USD
    created_at: Optional[datetime] = Field(default_factory=datetime.utcnow)

def calculate_cost(provider: str, model: str, tokens: int) -> float:
    """Calculate cost based on provider and model."""
    # Pricing per 1K tokens
    pricing = {
        "openai": {
            "gpt-3.5-turbo": 0.002,
            "gpt-4": 0.03
        },
        "huggingface": {
            "default": 0.0  # Free for now
        }
    }
    
    rate = pricing.get(provider, {}).get(model, 0.0)
    return (tokens / 1000) * rate
```

### Evaluation Framework (Future)
```python
# ✅ GOOD: Evaluation framework pattern (to be implemented)
class Evaluation(SQLModel, table=True):
    """Evaluation record for model outputs."""
    id: Optional[str] = Field(default=None, primary_key=True)
    inference_id: str
    metric: str  # "accuracy", "relevance", "quality"
    score: float  # 0.0 to 1.0
    evaluator: str  # "human" or "automated"
    created_at: Optional[datetime] = Field(default_factory=datetime.utcnow)
```

## BuildWorks-11006 LLM Observability

### LLM-Specific Metrics
```python
# ✅ GOOD: LLM-specific Prometheus metrics
from prometheus_client import Counter, Histogram

LLM_REQUESTS = Counter(
    'llm_requests_total',
    'Total LLM requests',
    ['provider', 'model', 'status']
)

LLM_LATENCY = Histogram(
    'llm_latency_seconds',
    'LLM request latency',
    ['provider', 'model']
)

LLM_TOKENS = Histogram(
    'llm_tokens_total',
    'Total tokens used',
    ['provider', 'model']
)

LLM_COST = Histogram(
    'llm_cost_usd',
    'LLM cost in USD',
    ['provider', 'model']
)
```

## BuildWorks-11007 LLM Best Practices

### Do's
- ✅ Always track telemetry for all inference calls
- ✅ Encrypt tokens at rest
- ✅ Use provider abstraction for flexibility
- ✅ Log all LLM calls with context
- ✅ Handle rate limits gracefully
- ✅ Implement retry logic for transient failures
- ✅ Track costs for billing

### Don'ts
- ❌ Don't log tokens or sensitive data
- ❌ Don't store tokens in plain text
- ❌ Don't make synchronous LLM calls
- ❌ Don't ignore rate limits
- ❌ Don't skip telemetry tracking

---

**Next Steps**: 
- Review `09-observability.mdc` for LLM tracing
- Check `08-auth-security.mdc` for token security
- Implement prompt management and cost tracking
