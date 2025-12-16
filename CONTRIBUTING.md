# Contributing to AISTRALE

Thank you for your interest in contributing to AISTRALE. This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and professional environment. See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) for details.

## Getting Started

1. **Fork the repository**
2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/aistrale.git
   cd aistrale
   ```
3. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Setup

Follow the [README.md](README.md) Quick Start guide to set up your development environment.

## Contribution Guidelines

### Code Standards

- **Python (backend)**:
  - Run `ruff` and `mypy` (configured in `backend/pyproject.toml`)
  - Keep function/type annotations consistent
  - Follow FastAPI + SQLModel patterns already used in `backend/api/` and `backend/models/`

- **TypeScript (frontend / extensions / SDKs)**:
  - Keep TypeScript strictness and linting clean (see each package's config)
  - Prefer typed APIs and avoid `any`

- **Testing**:
  - Aim for >80% test coverage
  - All tests must pass in CI before opening a PR

### Commit Messages

Use clear, descriptive commit messages:

```
feat: Add HuggingFace model selection UI
fix: Resolve token encryption key rotation issue
docs: Update API documentation
test: Add integration tests for inference service
refactor: Simplify telemetry tracking logic
```

### Pull Request Process

1. **Update documentation** if needed
2. **Add tests** for new features
3. **Ensure all tests pass**
4. **Run code quality checks**
   ```bash
   # Backend
   cd backend
   black . && isort . && flake8 . && mypy .
   pytest --cov=. --cov-report=term
   
   # Frontend
   cd frontend
   npm run lint && npm run type-check
   ```
5. **Create Pull Request**
   - Use clear title and description
   - Reference related issues
   - Include screenshots for UI changes

### PR Review Criteria

- Code follows project standards
- Tests are included and passing
- Documentation is updated
- No breaking changes (or clearly documented)
- Security considerations addressed

## Project Structure

- **Backend**: `backend/` - FastAPI application
- **Frontend**: `frontend/` - React application
- **Documentation**: `docs/` and `reports/`
- **Scripts**: `scripts/` (if exists)

## Areas for Contribution

- **Bug Fixes**: Check [Issues](https://github.com/buildworksai/aistrale/issues)
- **Features**: Discuss in Issues before implementation
- **Documentation**: Improve clarity and completeness
- **Tests**: Increase test coverage
- **Performance**: Optimize queries and rendering
- **Security**: Report vulnerabilities (see [SECURITY.md](SECURITY.md))

## Questions?

- Open an [Issue](https://github.com/buildworksai/aistrale/issues)
- Check existing documentation


---

**Thank you for contributing to AISTRALE!**

