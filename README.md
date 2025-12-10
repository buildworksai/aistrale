# AISTRALE

**Turn AI from a black box into an engineered system**

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://www.python.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)](https://www.typescriptlang.org/)

AISTRALE is an LLM engineering platform for managing model inference, telemetry tracking, and observability. Supports HuggingFace Hub and OpenAI SDK with secure token management, distributed tracing, and performance monitoring.

**Built by:** [BuildWorks.AI](https://buildworks.ai)  
**Website:** [https://aistrale.com](https://aistrale.com)  
**License:** [Apache License 2.0](LICENSE)

---

## Features

- **Multi-Provider LLM Inference**: HuggingFace Hub and OpenAI SDK support
- **Telemetry Tracking**: Comprehensive tracking of inference execution, tokens, and performance
- **Secure Token Management**: Encrypted storage and management of API tokens
- **Observability Stack**: Structured logging, Prometheus metrics, OpenTelemetry tracing, Sentry error tracking
- **Session-Based Authentication**: Redis-backed sessions with RBAC
- **Health Monitoring**: Health checks and readiness probes
- **Docker Deployment**: Complete Docker Compose setup with all services

## Tech Stack

### Backend
- **Framework**: FastAPI, Uvicorn
- **Database**: PostgreSQL 17 with pgvector, SQLModel, Alembic
- **Authentication**: Session-based with Redis
- **LLM SDKs**: HuggingFace Hub, OpenAI SDK
- **Observability**: structlog, Prometheus, OpenTelemetry, Sentry

### Frontend
- **Framework**: React 18, TypeScript 5
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM

### Infrastructure
- **Containerization**: Docker, Docker Compose
- **Monitoring**: Prometheus, Grafana
- **Tracing**: Jaeger
- **Caching**: Redis

## Deployment

### Docker Production
Build and run the production container:
```bash
docker-compose -f docker/docker-compose.prod.yml up --build -d
```

### AWS Deployment (Terraform)
1. Navigate to `terraform/` directory.
2. Initialize Terraform: `terraform init`
3. Apply configuration: `terraform apply`

## Load Testing
Run Locust for load testing:
```bash
pip install locust
locust -f tests/load/locustfile.py
```
Open http://localhost:8089 to start the test.

## Development

### Prerequisites

- Python 3.11+
- Node.js 18+
- Docker and Docker Compose
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/buildworksai/aistrale.git
   cd aistrale
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start services**
   ```bash
   docker-compose up -d
   ```

4. **Run database migrations**
   ```bash
   cd backend
   alembic upgrade head
   ```

5. **Access the application**
   - **API**: http://localhost:16000
   - **Frontend**: http://localhost:16500
   - **API Docs**: http://localhost:16000/docs
   - **Grafana**: http://localhost:3000 (admin/admin)
   - **Jaeger**: http://localhost:16686
   - **Prometheus**: http://localhost:9090

### Default Credentials

Default admin user (created via seeder):
- **Email**: `admin@buildworks.ai`
- **Password**: Check seeder script or environment variables

## Development

### Backend Development

```bash
cd backend
pip install -e ".[test]"
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Development

```bash
cd frontend
npm install
npm run dev
```

### Running Tests

```bash
# Backend tests
cd backend
pytest --cov=. --cov-report=html

# Frontend tests (when implemented)
cd frontend
npm test
```

### Code Quality

```bash
# Backend
cd backend
black .
isort .
flake8 .
mypy .

# Frontend
cd frontend
npm run lint
npm run type-check
```

## Architecture Documentation

AISTRALE follows the C4 Model for software architecture documentation. See [docs/c4-model/](docs/c4-model/) for detailed architecture diagrams:

- **Context Diagram**: System in context of users and external systems
- **Container Diagram**: High-level technical building blocks
- **Component Diagram**: API application component breakdown
- **Deployment Diagram**: Production deployment architecture

All diagrams are in Mermaid format and can be viewed on GitHub or using [Mermaid Live Editor](https://mermaid.live).

## Project Structure

```
aistrale/
├── backend/              # FastAPI backend
│   ├── api/             # API routes
│   ├── core/            # Core utilities (config, security, etc.)
│   ├── models/          # SQLModel database models
│   ├── services/        # Business logic
│   ├── tests/           # Test suite
│   └── alembic/         # Database migrations
├── frontend/            # React frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   └── lib/         # Utilities
├── docker-compose.yml   # Docker services
├── prometheus.yml       # Prometheus config
└── .cursor/rules/       # Cursor IDE rules
```

## Documentation

- **Architecture**: See `.cursor/rules/00-core-principles.mdc`
- **Getting Started**: See `.cursor/rules/01-getting-started.mdc`
- **API Documentation**: http://localhost:16000/docs (Swagger UI)
- **Engineering Gaps Analysis**: `reports/engineering_gaps_analysis.md`

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Security

For security vulnerabilities, please see [SECURITY.md](SECURITY.md).

## License

Copyright 2025 AISTRALE  
Copyright 2025 BuildWorks.AI

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

## Support

- **Website**: https://aistrale.com
- **Issues**: https://github.com/buildworksai/aistrale/issues
- **Email**: info@buildworks.ai

---

**AISTRALE Build by Buildworks.AI**

