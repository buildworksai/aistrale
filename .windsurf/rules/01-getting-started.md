---
trigger: always_on
description: Getting started guide for AISTRALE development
globs: **/*
---

# Getting Started with AISTRALE

**Product**: AISTRALE - Turn AI from a black box into an engineered system  
**Company**: BuildWorks.AI  
**Website**: https://aistrale.com

**⚠️ CRITICAL**: Follow these steps to set up your development environment.

## Prerequisites

- **Python**: 3.11+ (check with `python --version`)
- **Node.js**: 18+ (check with `node --version`)
- **Docker**: Latest version with Docker Compose
- **Git**: Latest version

## Initial Setup

### 1. Clone Repository
```bash
git clone <repository-url>
cd huggingface
```

### 2. Environment Configuration

Create `.env` file in project root:
```bash
# Database
DATABASE_URL=postgresql://user:password@db:5432/huggingface_db

# Redis
REDIS_URL=redis://redis:6379

# Security
SECRET_KEY=<generate-secure-key>
SENTRY_DSN=<your-sentry-dsn>

# CORS
ALLOWED_ORIGINS=http://localhost:16500

# Branding
COMPANY_NAME=BuildWorks.AI
PRODUCT_NAME=AISTRALE
PRODUCT_TAGLINE="Turn AI from a black box into an engineered system"
FOOTER_TEXT="AISTRALE Build by Buildworks.AI"
WEBSITE_URL=https://aistrale.com
```

### 3. Start Services with Docker Compose

```bash
docker-compose up -d
```

This starts:
- **API**: `http://localhost:16000`
- **Frontend**: `http://localhost:16500`
- **PostgreSQL**: `localhost:15432`
- **Redis**: `localhost:16379`
- **Prometheus**: `http://localhost:9090`
- **Grafana**: `http://localhost:3000` (admin/admin)
- **Jaeger**: `http://localhost:16686`

### 4. Database Migrations

Run migrations:
```bash
cd backend
alembic upgrade head
```

### 5. Verify Setup

- Check API health: `curl http://localhost:16000/health`
- Check frontend: Open `http://localhost:16500`
- Check metrics: `curl http://localhost:16000/metrics`

## Development Workflow

### Backend Development

1. **Activate virtual environment** (if using one):
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies**:
   ```bash
   pip install -e ".[test]"
   ```

3. **Run tests**:
   ```bash
   pytest
   ```

4. **Run with hot reload**:
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

### Frontend Development

1. **Install dependencies**:
   ```bash
   cd frontend
   npm install
   ```

2. **Run development server**:
   ```bash
   npm run dev
   ```

3. **Run tests** (when implemented):
   ```bash
   npm test
   ```

### Code Quality Checks

**Backend**:
```bash
# Format code
black .
isort .

# Lint code
flake8 .
mypy .

# Run tests with coverage
pytest --cov=. --cov-report=html
```

**Frontend**:
```bash
# Format code
npm run format

# Lint code
npm run lint

# Type check
npm run type-check
```

## Project Structure

```
huggingface/
├── backend/              # FastAPI backend
│   ├── api/             # API routes
│   ├── core/            # Core utilities (config, security, etc.)
│   ├── models/          # SQLModel database models
│   ├── services/       # Business logic
│   ├── tests/           # Test suite
│   └── alembic/         # Database migrations
├── frontend/            # React frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   └── lib/         # Utilities
├── docker-compose.yml    # Docker services
├── prometheus.yml        # Prometheus config
└── .cursor/rules/        # Cursor rules
```

## Common Tasks

### Create Database Migration

```bash
cd backend
alembic revision --autogenerate -m "description"
alembic upgrade head
```

### Add New Dependency

**Backend**:
1. Add to `backend/pyproject.toml` under `[project.dependencies]`
2. Run `pip install -e .`

**Frontend**:
1. Add to `frontend/package.json`
2. Run `npm install`

### Access Services

- **API Docs**: `http://localhost:16000/docs` (Swagger UI)
- **Grafana**: `http://localhost:3000` (admin/admin)
- **Jaeger**: `http://localhost:16686`
- **Prometheus**: `http://localhost:9090`

## Troubleshooting

### Database Connection Issues
- Check PostgreSQL is running: `docker ps | grep db`
- Verify DATABASE_URL in `.env`
- Check logs: `docker logs db`

### Redis Connection Issues
- Check Redis is running: `docker ps | grep redis`
- Verify REDIS_URL in `.env`
- Check logs: `docker logs redis`

### Port Conflicts
- Change ports in `docker-compose.yml` if needed
- Update `ALLOWED_ORIGINS` in `.env` if frontend port changes

## Next Steps

1. Read `00-core-principles.mdc` for architectural principles
2. Review `04-tech-stack.mdc` for technology standards
3. Check `05-code-quality.mdc` for coding standards
4. See `06-testing.mdc` for testing patterns

---

**Questions?** Check the engineering gaps analysis in `reports/engineering_gaps_analysis.md` for implementation priorities.
