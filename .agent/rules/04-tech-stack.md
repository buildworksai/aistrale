---
trigger: always_on
description: Technology stack standards and approved dependencies for AISTRALE
globs: **/*
---

# AISTRALE Technology Stack

**⚠️ CRITICAL**: All technology versions, package names, and Docker images are defined here. Other files MUST reference these variables, not hardcode tech versions.

## BuildWorks-12000 Central Tech Stack Registry (SINGLE SOURCE OF TRUTH)

### Environment Variables for Tech Stack
```bash
# Backend Framework
FASTAPI_VERSION=latest
UVICORN_VERSION=latest
PYTHON_VERSION=3.11

# Database
POSTGRES_VERSION=17
POSTGRES_IMAGE=pgvector/pgvector:pg17
SQLMODEL_VERSION=latest
ALEMBIC_VERSION=latest

# Authentication & Security
BCRYPT_VERSION=latest
REDIS_VERSION=alpine
REDIS_IMAGE=redis:alpine

# Validation
PYDANTIC_VERSION=latest
PYDANTIC_SETTINGS_VERSION=latest

# Frontend
VITE_VERSION=latest
REACT_VERSION=18
TYPESCRIPT_VERSION=5
TAILWIND_VERSION=latest
NODE_VERSION=20

# LLM SDKs
HUGGINGFACE_HUB_VERSION=latest
OPENAI_SDK_VERSION=latest

# Observability (Phase 2 - Implemented)
STRUCTLOG_VERSION=latest
PROMETHEUS_FASTAPI_INSTRUMENTATOR_VERSION=latest
OPENTELEMETRY_VERSION=latest
SENTRY_SDK_VERSION=latest

# Testing & Quality
PYTEST_VERSION=latest
PYTEST_ASYNCIO_VERSION=latest
BLACK_VERSION=latest
FLAKE8_VERSION=latest
ESLINT_VERSION=latest

# Infrastructure
PROMETHEUS_IMAGE=prom/prometheus:latest
GRAFANA_IMAGE=grafana/grafana:latest
JAEGER_IMAGE=jaegertracing/all-in-one:latest
```

## BuildWorks-12001 Allowed Stack (authoritative)

### Backend (Python/FastAPI)
- **Framework**: FastAPI (latest), Uvicorn (latest)
- **Database**: PostgreSQL 17 with pgvector, SQLModel (latest), Alembic (latest)
- **Authentication**: Pure session-based with Redis, bcrypt (latest)
- **Validation**: Pydantic (latest), Pydantic Settings (latest)
- **Caching**: Redis (alpine)
- **LLM SDKs**: HuggingFace Hub (latest), OpenAI SDK (latest)
- **Observability**: 
  - structlog (latest) - Structured logging
  - prometheus-fastapi-instrumentator (latest) - Metrics
  - OpenTelemetry (latest) - Distributed tracing
  - Sentry SDK (latest) - Error tracking
- **HTTP Client**: httpx (latest), requests (latest)
- **Testing**: pytest (latest), pytest-asyncio (latest)
- **Code Quality**: Black (latest), Flake8 (latest), mypy (latest)

### Frontend (Vite/React)
- **Build Tool**: Vite (latest)
- **Framework**: React 18, TypeScript 5
- **Routing**: React Router DOM (latest)
- **Styling**: Tailwind CSS (latest)
- **HTTP Client**: Fetch API (built-in) or axios (if needed)
- **Development**: ESLint (latest), Prettier (latest)

### Infrastructure & DevOps
- **Containerization**: Docker, Docker Compose
- **Database**: PostgreSQL 17 with pgvector (Alpine)
- **Caching**: Redis (Alpine)
- **Monitoring**: Prometheus (latest), Grafana (latest)
- **Tracing**: Jaeger (latest)
- **Environment**: Python 3.11+, Node.js 18+

## BuildWorks-12002 Banned Technologies (by exclusion)
- Any tech not listed above is banned for this repository unless formally approved.
- **Specifically banned**:
  - Node.js backend (use Python/FastAPI)
  - Prisma (use SQLModel/Alembic)
  - tRPC (use REST APIs)
  - Express.js (use FastAPI)
  - JWT tokens (use session-based auth only)
  - Redux Toolkit (use React state management)
  - Next.js (use Vite/React)

## BuildWorks-12003 Migration & Exceptions
- Any deviation requires:
  - Rationale, risk assessment, and plan
  - Entry in documentation
  - Cross-reference to this rule ID in PR description

## BuildWorks-12004 LLM SDK Standards

### HuggingFace Hub Integration
```python
# ✅ REQUIRED: HuggingFace Hub integration
from huggingface_hub import InferenceClient

def get_hf_client(token: str) -> InferenceClient:
    """Get HuggingFace inference client"""
    return InferenceClient(token=token)

async def run_hf_inference(
    client: InferenceClient,
    model: str,
    inputs: str
) -> dict:
    """Run HuggingFace model inference"""
    return client.post(
        json={
            "inputs": inputs,
            "model": model
        }
    )
```

### OpenAI SDK Integration
```python
# ✅ REQUIRED: OpenAI SDK integration
from openai import OpenAI

def get_openai_client(api_key: str) -> OpenAI:
    """Get OpenAI client"""
    return OpenAI(api_key=api_key)

async def run_openai_inference(
    client: OpenAI,
    model: str,
    prompt: str
) -> dict:
    """Run OpenAI model inference"""
    response = client.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": prompt}]
    )
    return response.choices[0].message.content
```

## BuildWorks-12005 Service Integration Examples

### Redis Session Storage
```python
# ✅ REQUIRED: Redis integration for sessions
from starsessions.stores.redis import RedisStore
from starsessions import SessionMiddleware

def get_redis_store(redis_url: str) -> RedisStore:
    """Get Redis store for sessions"""
    return RedisStore(redis_url)
```

### Prometheus Metrics
```python
# ✅ REQUIRED: Prometheus metrics (Phase 2 - Implemented)
from prometheus_fastapi_instrumentator import Instrumentator

def setup_metrics(app: FastAPI):
    """Setup Prometheus metrics"""
    Instrumentator().instrument(app).expose(app)
```

### OpenTelemetry Tracing
```python
# ✅ REQUIRED: OpenTelemetry tracing (Phase 2 - Implemented)
from core.tracing import configure_tracing

def setup_tracing(app: FastAPI, service_name: str):
    """Setup distributed tracing"""
    configure_tracing(app, service_name=service_name)
```

## BuildWorks-12006 Files That Reference This Central Registry
- `05-python-standards.mdc` - Python-specific tech
- `06-typescript-standards.mdc` - TypeScript-specific tech
- `09-observability.mdc` - Observability tech stack
- `11-llm-features.mdc` - LLM SDK standards

---

**Next Steps**: Review technology-specific standards in `05-python-standards.mdc` and `06-typescript-standards.mdc`.
