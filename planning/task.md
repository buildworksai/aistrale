# Project Tasks

- [ ] **Initialization**
    - [ ] Create project structure (backend, frontend)
    - [ ] Setup `docker-compose.yml`
    - [ ] Setup `backend/Dockerfile` and `requirements.txt`
    - [ ] Setup `frontend/Dockerfile` and `package.json`

- [ ] **Backend Implementation**
    - [ ] **Core**
        - [ ] Setup FastAPI app and Config
        - [ ] Setup Database (SQLModel) and Redis connection
    - [ ] **Auth**
        - [ ] Implement User Model & Seeding (`admin@buildworks.ai`)
        - [ ] Implement Session Middleware (Redis)
        - [ ] Implement Login/Logout endpoints
        - [ ] Implement RBAC dependencies
    - [ ] **Features**
        - [ ] Implement Token Management (CRUD)
        - [ ] Implement Inference Service (HF Hub & OpenAI SDKs)
        - [ ] Implement Telemetry Logging (DB)
        - [ ] Create API Endpoints for Inference & Telemetry

- [ ] **Frontend Implementation**
    - [ ] **Setup**
        - [ ] Initialize Vite React App
        - [ ] Configure Tailwind CSS
        - [ ] Setup API Client (Axios/Fetch with credentials)
    - [ ] **UI Components**
        - [ ] Login Page
        - [ ] Dashboard Layout (Sidebar, Header)
        - [ ] Token Management UI
        - [ ] Inference Playground UI (Auto/Manual toggle, Output display)
        - [ ] Telemetry/Reports UI
    - [ ] **Integration**
        - [ ] Connect Auth flows
        - [ ] Connect Inference & Token APIs

- [ ] **Verification**
    - [ ] Verify Docker Compose build & run
    - [ ] Verify Admin Login & Session persistence
    - [ ] Verify Token Storage
    - [ ] Verify Inference (HF & OpenAI)
    - [ ] Verify Telemetry logging
