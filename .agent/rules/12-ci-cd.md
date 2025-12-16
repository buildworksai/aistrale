---
trigger: always_on
description: CI/CD pipeline standards and deployment patterns for AISTRALE
globs: .github/workflows/**/*.yml, docker-compose.yml, Dockerfile*
---

# 🚀 AISTRALE CI/CD Standards

**⚠️ CRITICAL**: CI/CD pipeline ensures code quality, security, and reliable deployments.

## BuildWorks-12001 CI/CD Pipeline Structure

### Pipeline Stages
1. **Lint & Format**: Code quality checks
2. **Test**: Run test suite with coverage
3. **Security**: Dependency and code scanning
4. **Build**: Create Docker images
5. **Deploy**: Deploy to staging/production

### GitHub Actions Workflow
```yaml
# ✅ GOOD: Complete CI/CD workflow
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - name: Install dependencies
        run: |
          cd backend
          pip install black isort flake8 mypy
      - name: Format check
        run: |
          cd backend
          black --check .
          isort --check .
      - name: Lint
        run: |
          cd backend
          flake8 .
          mypy .

  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: pgvector/pgvector:pg17
        env:
          POSTGRES_PASSWORD: password
          POSTGRES_USER: user
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - name: Install dependencies
        run: |
          cd backend
          pip install -e ".[test]"
      - name: Run migrations
        run: |
          cd backend
          alembic upgrade head
        env:
          DATABASE_URL: postgresql://user:password@localhost:5432/test_db
      - name: Run tests
        run: |
          cd backend
          pytest --cov=. --cov-report=xml --cov-report=term
        env:
          DATABASE_URL: postgresql://user:password@localhost:5432/test_db
          REDIS_URL: redis://localhost:6379
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./backend/coverage.xml

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - name: Install security tools
        run: |
          pip install safety pip-audit
      - name: Security scan
        run: |
          cd backend
          safety check
          pip-audit

  build:
    needs: [lint, test, security]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build Docker image
        run: |
          docker build -t buildworks-api:latest ./backend
          docker build -t buildworks-web:latest ./frontend
```

## BuildWorks-12002 Deployment Strategy

### Staging Deployment
```yaml
# ✅ GOOD: Staging deployment workflow
# .github/workflows/deploy-staging.yml
name: Deploy to Staging

on:
  push:
    branches: [develop]

jobs:
  deploy-staging:
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to staging
        run: |
          # Deployment commands
          echo "Deploying to staging..."
```

### Production Deployment
```yaml
# ✅ GOOD: Production deployment workflow
# .github/workflows/deploy-production.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy-production:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to production
        run: |
          # Deployment commands
          echo "Deploying to production..."
```

## BuildWorks-12003 Docker Best Practices

### Multi-stage Dockerfile
```dockerfile
# ✅ GOOD: Multi-stage Dockerfile for backend
# backend/Dockerfile
FROM python:3.11-slim as builder

WORKDIR /app

# Install dependencies
COPY pyproject.toml .
RUN pip install --user -e .

FROM python:3.11-slim

WORKDIR /app

# Copy installed packages
COPY --from=builder /root/.local /root/.local

# Copy application code
COPY . .

# Make sure scripts are executable
ENV PATH=/root/.local/bin:$PATH

# Run as non-root user
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Frontend Dockerfile
```dockerfile
# ✅ GOOD: Multi-stage Dockerfile for frontend
# frontend/Dockerfile
FROM node:20-alpine as builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

## BuildWorks-12004 Database Migration in CI/CD

### Migration Workflow
```yaml
# ✅ GOOD: Database migration in CI/CD
- name: Run migrations
  run: |
    cd backend
    alembic upgrade head
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

### Migration Safety
- ✅ Always backup database before migrations in production
- ✅ Test migrations on staging first
- ✅ Run migrations in separate step before deployment
- ✅ Verify migration success before proceeding

## BuildWorks-12005 Environment Management

### Environment Variables
```yaml
# ✅ GOOD: Environment variable management
env:
  DATABASE_URL: ${{ secrets.DATABASE_URL }}
  REDIS_URL: ${{ secrets.REDIS_URL }}
  SECRET_KEY: ${{ secrets.SECRET_KEY }}
  SENTRY_DSN: ${{ secrets.SENTRY_DSN }}
```

### Secrets Management
- ✅ Use GitHub Secrets for sensitive data
- ✅ Never commit secrets to repository
- ✅ Rotate secrets regularly
- ✅ Use different secrets for staging and production

## BuildWorks-12006 Quality Gates

### Required Checks
- ✅ All linting checks must pass
- ✅ All tests must pass
- ✅ Coverage must meet threshold (>80%)
- ✅ Security scans must pass
- ✅ No critical vulnerabilities

### Quality Gate Configuration
```yaml
# ✅ GOOD: Quality gates
- name: Check coverage threshold
  run: |
    coverage=$(pytest --cov=. --cov-report=term | grep TOTAL | awk '{print $NF}' | sed 's/%//')
    if (( $(echo "$coverage < 80" | bc -l) )); then
      echo "Coverage $coverage% is below 80% threshold"
      exit 1
    fi
```

## BuildWorks-12007 Rollback Strategy

### Rollback Procedures
```bash
# ✅ GOOD: Rollback procedure
# 1. Revert code
git revert <commit-hash>

# 2. Rollback database migration
alembic downgrade -1

# 3. Redeploy previous version
docker-compose up -d
```

## BuildWorks-12008 CI/CD Best Practices

### Do's
- ✅ Run tests on every PR
- ✅ Require all checks to pass before merge
- ✅ Use separate environments for staging and production
- ✅ Automate deployments
- ✅ Monitor deployment health
- ✅ Keep deployment logs

### Don'ts
- ❌ Don't skip quality checks
- ❌ Don't deploy directly to production
- ❌ Don't ignore failed tests
- ❌ Don't commit secrets
- ❌ Don't skip security scans

---

**Next Steps**: 
- Setup GitHub Actions workflows
- Configure environment secrets
- Test CI/CD pipeline on staging
- Review `00-core-principles.mdc` for architectural principles
