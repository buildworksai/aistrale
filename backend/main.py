import uuid
from contextlib import asynccontextmanager

import sentry_sdk
import structlog
from alembic.config import Config
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Third-party imports
from prometheus_fastapi_instrumentator import Instrumentator
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from sqlmodel import Session, select
from starsessions import SessionAutoloadMiddleware, SessionMiddleware
from starsessions.stores.memory import InMemoryStore
from starsessions.stores.redis import RedisStore

from alembic import command

# Local imports
from api import auth, inference, prompts, telemetry, tokens, users
from core.branding import get_full_product_name
from core.config import get_settings
from core.database import engine
from core.exceptions import BaseAPIException
from core.limiter import limiter
from core.logging_config import configure_logging
from core.security import get_password_hash
from core.security_headers import SecurityHeadersMiddleware
from core.tracing import configure_tracing
from models.user import User

settings = get_settings()

configure_logging()
logger = structlog.get_logger()

if settings.SENTRY_DSN:
    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        traces_sample_rate=1.0,
        profiles_sample_rate=1.0,
    )


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events."""
    # Startup
    logger.info("application_starting")
    
    # Run Alembic migrations
    try:
        alembic_cfg = Config("alembic.ini")
        # Ensure we use the correct database URL
        alembic_cfg.set_main_option("sqlalchemy.url", str(settings.DATABASE_URL))
        # Check for multiple heads and upgrade to all heads if needed
        try:
            from alembic import script
            script_dir = script.ScriptDirectory.from_config(alembic_cfg)
            heads = script_dir.get_revisions("heads")
            if len(heads) > 1:
                # Multiple heads - upgrade to all heads
                command.upgrade(alembic_cfg, "heads")
            else:
                command.upgrade(alembic_cfg, "head")
        except Exception:
            # Fallback: try upgrading to heads directly
            command.upgrade(alembic_cfg, "heads")
        logger.info("database_migrations_applied")
    except Exception as e:
        logger.error("migration_error", error=str(e))

    # Seed admin user
    try:
        with Session(engine) as session:
            admin = session.exec(
                select(User).where(User.email == "admin@buildworks.ai")
            ).first()
            if not admin:
                admin = User(
                    email="admin@buildworks.ai",
                    password_hash=get_password_hash("admin@134"),
                    role="admin",
                )
                session.add(admin)
                session.commit()
                logger.info("admin_user_seeded")
    except Exception as e:
        logger.error("admin_seed_failed", error=str(e))
    
    # Start scheduler
    try:
        from core.scheduler import start_scheduler
        start_scheduler()
        logger.info("scheduler_started")
    except Exception as e:
        logger.error("scheduler_start_failed", error=str(e))
    
    yield
    
    # Shutdown
    logger.info("application_shutting_down")
    from core.scheduler import shutdown_scheduler
    shutdown_scheduler()
    logger.info("scheduler_shutdown")


app = FastAPI(title=get_full_product_name(), lifespan=lifespan)

# Instrument Prometheus
Instrumentator().instrument(app).expose(app)

# Add Limiter to app state
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS configuration - allow frontend origin (must be defined FIRST so it runs LAST and processes all responses)
origins = [
    "http://localhost:16500",
    "http://localhost:3000",
    "http://127.0.0.1:16500",
    "http://127.0.0.1:3000",
]

# Security Middleware (added first, runs last - outermost)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(SlowAPIMiddleware)

# Configure Tracing
if settings.JAEGER_ENABLED:
    try:
        configure_tracing(app, service_name=get_full_product_name())
    except Exception as e:
        # Log error but don't crash app if tracing fails
        logger.error("tracing_setup_failed", error=str(e))

# CORS fallback middleware - handles OPTIONS and ensures CORS headers on all responses
# Added before CORS middleware so it runs after (innermost)
@app.middleware("http")
async def cors_fallback_middleware(request: Request, call_next):
    """Ensure CORS headers are always present, even if other middleware fails."""
    # Handle OPTIONS preflight requests
    if request.method == "OPTIONS":
        origin = request.headers.get("origin")
        if origin in origins:
            response = JSONResponse(
                status_code=200,
                content={}
            )
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
            response.headers["Access-Control-Allow-Headers"] = "*"
            response.headers["Access-Control-Max-Age"] = "3600"
            return response
    
    try:
        response = await call_next(request)
        # Ensure CORS headers are present even if middleware didn't add them
        origin = request.headers.get("origin")
        if origin in origins:
            if "Access-Control-Allow-Origin" not in response.headers:
                response.headers["Access-Control-Allow-Origin"] = origin
                response.headers["Access-Control-Allow-Credentials"] = "true"
        return response
    except Exception as e:
        # Create error response with CORS headers
        error_response = JSONResponse(
            status_code=500,
            content={"detail": "Internal server error"}
        )
        origin = request.headers.get("origin")
        if origin in origins:
            error_response.headers["Access-Control-Allow-Origin"] = origin
            error_response.headers["Access-Control-Allow-Credentials"] = "true"
        return error_response

# CORS middleware - added LAST so it runs FIRST (innermost, processes requests first)
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)

@app.middleware("http")
async def logging_middleware(request: Request, call_next):
    request_id = str(uuid.uuid4())
    structlog.contextvars.clear_contextvars()
    structlog.contextvars.bind_contextvars(request_id=request_id)

    log = logger.bind(
        method=request.method,
        path=request.url.path,
        client_ip=request.client.host if request.client else None,
    )

    log.info("request_started")

    try:
        response = await call_next(request)
        log.info(
            "request_finished",
            status_code=response.status_code,
        )
        return response
    except Exception as e:
        log.error("request_failed", error=str(e), exc_info=True)
        raise


@app.exception_handler(BaseAPIException)
async def api_exception_handler(request: Request, exc: BaseAPIException):
    response = JSONResponse(
        status_code=exc.status_code,
        content={"error": {"code": exc.error_code, "message": exc.message}},
    )
    # Add CORS headers to error responses
    origin = request.headers.get("origin")
    if origin in origins:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
    return response

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle HTTP exceptions (401, 403, etc.) with CORS headers."""
    response = JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )
    # Add CORS headers to error responses
    origin = request.headers.get("origin")
    if origin in origins:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
    return response

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle all unhandled exceptions (500 errors) with CORS headers."""
    logger.error("unhandled_exception", error=str(exc), exc_info=True)
    response = JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )
    # Add CORS headers to error responses
    origin = request.headers.get("origin")
    if origin in origins:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
    return response


app.add_middleware(SessionAutoloadMiddleware)

if settings.TESTING:
    session_store = InMemoryStore()
else:
    session_store = RedisStore(settings.REDIS_URL)

app.add_middleware(
    SessionMiddleware,
    store=session_store,
    cookie_https_only=False,  # For dev
)




app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(tokens.router, prefix="/api/tokens", tags=["tokens"])
app.include_router(inference.router, prefix="/api/inference", tags=["inference"])
app.include_router(prompts.router, prefix="/api/prompts", tags=["prompts"])
app.include_router(telemetry.router, prefix="/api/telemetry", tags=["telemetry"])
from api import admin
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])

# New Feature Routers
from api import multi_provider, reliability, webhooks, security_audit, dlp, cost, compliance, workspaces, projects, permissions, regions, evaluation
app.include_router(multi_provider.router, prefix="/api/multi-provider", tags=["Multi-Provider"])
app.include_router(reliability.router, prefix="/api/reliability", tags=["Reliability"])
app.include_router(webhooks.router, prefix="/api/webhooks", tags=["Webhooks"])
app.include_router(security_audit.router, prefix="/api/security-audit", tags=["Security Audit"])
app.include_router(dlp.router, prefix="/api/dlp", tags=["DLP"])
app.include_router(cost.router, prefix="/api/cost", tags=["Cost"])
app.include_router(compliance.router, prefix="/api/compliance", tags=["Compliance"])
app.include_router(workspaces.router, prefix="/api/workspaces", tags=["Workspaces"])
app.include_router(projects.router, prefix="/api/projects", tags=["Projects"])
app.include_router(permissions.router, prefix="/api/permissions", tags=["Permissions"])
app.include_router(regions.router, prefix="/api/regions", tags=["Regions"])
app.include_router(evaluation.router, prefix="/api/evaluation", tags=["Evaluation"])


@app.get("/")
def read_root():
    return {"message": f"Welcome to {get_full_product_name()} API"}


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/ready")
async def readiness_check():
    # Check DB connection
    try:
        with Session(engine) as session:
            session.exec(select(User).limit(1))
    except Exception as e:
        logger.error("readiness_check_failed", error=str(e))
        return JSONResponse(
            status_code=503,
            content={"status": "not ready", "error": "Database unavailable"},
        )

    return {"status": "ready"}
