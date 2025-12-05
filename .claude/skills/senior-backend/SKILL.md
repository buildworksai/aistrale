---
name: senior-backend
description: Comprehensive backend development skill for building scalable LLM engineering platforms using FastAPI, Python, PostgreSQL, HuggingFace Hub, OpenAI SDK. Includes API scaffolding, database optimization, security implementation, LLM integration patterns, telemetry tracking, and performance tuning. Use when designing APIs, optimizing database queries, implementing business logic, handling authentication/authorization, integrating LLM providers, or reviewing backend code.
status: ✅ Working
last-validated: 2025-01-27
---

# Senior Backend

Complete toolkit for senior backend with modern tools and best practices for LLM engineering platforms.

## Quick Start

This skill provides comprehensive backend development guidance for building LLM engineering platforms using FastAPI, PostgreSQL, and Python.

**Key Focus Areas:**
- FastAPI API design and patterns
- PostgreSQL database optimization
- Session-based authentication and RBAC
- HuggingFace Hub integration
- OpenAI SDK integration
- Telemetry tracking and observability
- LLM inference service patterns

## Tech Stack

**Languages:** Python 3.9+
**Backend:** FastAPI (latest), Uvicorn
**Database:** PostgreSQL 17 with pgvector, SQLModel, Alembic
**Authentication:** Session-based with Redis
**LLM SDKs:** HuggingFace Hub, OpenAI SDK
**Observability:** structlog, Prometheus, OpenTelemetry, Sentry
**APIs:** REST APIs
**DevOps:** Docker, Docker Compose, GitHub Actions
**Testing:** pytest, pytest-asyncio

## Development Workflow

### 1. Setup and Configuration

```bash
# Install dependencies
cd backend
pip install -e ".[test]"

# Configure environment
cp .env.example .env
```

### 2. Database Migrations

```bash
# Create migration
alembic revision --autogenerate -m "description"

# Apply migration
alembic upgrade head
```

### 3. Run Development Server

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Best Practices Summary

### Code Quality
- Follow established patterns from `.cursor/rules/`
- Write comprehensive tests (>80% coverage)
- Use type hints everywhere
- Document complex logic

### Performance
- Measure before optimizing
- Use connection pooling
- Optimize database queries
- Monitor in production (Prometheus)

### Security
- Validate all inputs (Pydantic)
- Use parameterized queries (SQLModel)
- Encrypt tokens at rest
- Implement rate limiting
- Session-based authentication only

### LLM Integration
- Provider abstraction pattern
- Secure token storage
- Telemetry tracking for all calls
- Error handling with retries
- Observability (logging, metrics, tracing)

### Maintainability
- Write clear code
- Use consistent naming
- Add helpful comments
- Keep it simple

## Common Commands

```bash
# Development (FastAPI)
uvicorn main:app --reload
pytest backend/tests/
black backend/
isort backend/
flake8 backend/
mypy backend/

# Database
alembic upgrade head
alembic revision --autogenerate -m "description"

# Docker
docker-compose up -d
docker-compose logs -f api
```

## Troubleshooting

### Common Issues

- **Database connection errors:** Check DATABASE_URL in `.env`
- **Redis connection errors:** Check REDIS_URL in `.env`
- **Migration conflicts:** Use `alembic merge` to resolve
- **LLM API errors:** Check token encryption and provider configuration

### Getting Help

- Review `.cursor/rules/` for patterns
- Check FastAPI and PostgreSQL best practices
- Review error logs with structured logging
- Check Prometheus metrics and Jaeger traces

## Resources

- **Cursor Rules:** `.cursor/rules/05-python-standards.mdc`
- **Testing:** `.cursor/rules/06-testing.mdc`
- **Observability:** `.cursor/rules/09-observability.mdc`
- **LLM Features:** `.cursor/rules/11-llm-features.mdc`

