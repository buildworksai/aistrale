import uuid

import sentry_sdk
import structlog
from alembic.config import Config
from fastapi import FastAPI, Request
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

app = FastAPI(title=get_full_product_name())

# Instrument Prometheus
Instrumentator().instrument(app).expose(app)

# Add Limiter to app state
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Security Middleware
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(SlowAPIMiddleware)

# Configure Tracing
if settings.JAEGER_ENABLED:
    try:
        configure_tracing(app, service_name=get_full_product_name())
    except Exception as e:
        # Log error but don't crash app if tracing fails
        logger.error("tracing_setup_failed", error=str(e))


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
        log.error("request_failed", error=str(e))
        raise e


@app.exception_handler(BaseAPIException)
async def api_exception_handler(request: Request, exc: BaseAPIException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": {"code": exc.error_code, "message": exc.message}},
    )


origins = [
    "http://localhost:16500",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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


@app.on_event("startup")
def on_startup():
    # Run Alembic migrations
    try:
        alembic_cfg = Config("alembic.ini")
        # Ensure we use the correct database URL
        alembic_cfg.set_main_option("sqlalchemy.url", str(settings.DATABASE_URL))
        command.upgrade(alembic_cfg, "head")
        print("Database migrations applied successfully")
    except Exception as e:
        print(f"Error applying migrations: {e}")

    # init_db() # No longer needed as Alembic handles schema creation

    # Seed admin user
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
            print("Admin user seeded")


app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(tokens.router, prefix="/api/tokens", tags=["tokens"])
app.include_router(inference.router, prefix="/api/inference", tags=["inference"])
app.include_router(prompts.router, prefix="/api/prompts", tags=["prompts"])
app.include_router(telemetry.router, prefix="/api/telemetry", tags=["telemetry"])


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
