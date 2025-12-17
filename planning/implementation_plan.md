# Implementation Plan - Hugging Face Token Manager & Inference UI

## Goal Description
Build a full-stack application to manage Hugging Face tokens and perform model inference using either OpenAI or Hugging Face SDKs. The app will feature a React frontend and a Python (FastAPI) backend, running in Docker. It includes comprehensive telemetry, RBAC, and session-based authentication.

## User Review Required
> [!NOTE]
> **Branding**: I have received the `19-branding-visual.mdc` file. I will apply the **BuildWorks.AI** branding (Deep Blue, Gold, Teal, Green) and naming conventions.
> - **Company**: BuildWorks.AI
> - **Colors**: Primary (Deep Blue #1565C0), Warning (Gold #FF8F00), Info (Teal #00ACC1), Success (Green #388E3C).

> [!NOTE]
> **Tech Stack Selection**: 
> - **Backend**: FastAPI (High performance, async support for inference).
> - **Database**: PostgreSQL 17 with `pgvector` (as requested).
> - **ORM**: SQLModel (Great synergy with FastAPI & Pydantic).
> - **Auth**: Redis-backed Server-side Sessions (using `starsessions` or similar middleware) to satisfy "Pure Sessions" requirement.
> - **Frontend**: React (Vite) + Tailwind CSS.

## Proposed Changes

### Infrastructure
#### [NEW] docker-compose.yml
- Services: `api` (16000), `web` (16500), `db` (15432), `redis` (16379).
- Networks and volume configuration.

### Backend (`backend/`)
#### [NEW] Dependencies
- `fastapi`, `uvicorn`, `sqlmodel`, `psycopg2-binary`, `pgvector`, `redis`, `huggingface_hub`, `openai`, `passlib[bcrypt]`, `pydantic-settings`.

#### [NEW] Structure
- `main.py`: App entry point.
- `core/`: Config, Security (Session, RBAC, CORS).
- `models/`: DB Models (User, Token, Telemetry).
- `api/`: Routes (Auth, Tokens, Inference, Users).
- `services/`: Logic for HF/OpenAI inference, Telemetry logging.

### Frontend (`frontend/`)
#### [NEW] Setup
- Vite + React + TypeScript.
- Tailwind CSS configuration.
- Router (React Router).

#### [NEW] Components & Pages
- `LoginPage`: Session-based login.
- `Dashboard`: Overview.
- `TokenManager`: Add/Remove HF tokens.
- `Playground`: 
  - Input: Text.
  - Options: Model selection## Proposed Changes
### Backend
#### [MODIFY] [inference.py](file:///Users/raghunathchava/Code/huggingface/backend/api/inference.py)
- Add `task` field to `InferenceRequest` model (optional, default "auto").

#### [MODIFY] [inference_service.py](file:///Users/raghunathchava/Code/huggingface/backend/services/inference_service.py)
- Refactor `run_inference` to accept `task`.
- Implement explicit routing based on `task`:
    - `text-generation`: `client.text_generation`
    - `text-to-image`: `client.text_to_image`
    - `text-to-video`: `client.text_to_video` (with fallback to `requests` if needed)
    - `image-to-video`: `client.image_to_video` (requires image input support)
    - `chat-completion`: `client.chat_completion`
    - `auto`: Keep existing fallback logic or try to infer.

### Frontend
#### [MODIFY] [Inference.tsx](file:///Users/raghunathchava/Code/huggingface/frontend/src/pages/Inference.tsx)
- Add "Task" dropdown to the form.
- Update `handleSubmit` to send `task` to backend.

## Verification Plan
### Automated Tests
- `curl` tests for each task type.
### Manual Verification
- Browser test: Select task -> Run Inference -> Verify result type (text, image, video).ic rendering tests.

### Manual Verification
1. **Setup**: Run `docker-compose up --build`.
2. **Auth**: Login as your seeded admin user. Verify session creation in Redis.
3. **Tokens**: Add a valid HF token.
5. **RBAC**: Create a standard user, verify they cannot access Admin User Management.
