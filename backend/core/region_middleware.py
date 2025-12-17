import logging
from collections.abc import Awaitable, Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from services.region_service import RegionService

logger = logging.getLogger(__name__)


class RegionMiddleware(BaseHTTPMiddleware):
    """
    Middleware to enforce data residency by checking region headers.
    """

    def __init__(self, app, region_service: RegionService):
        super().__init__(app)
        self.region_service = region_service

    async def dispatch(self, request: Request, call_next: Callable[[
            Request], Awaitable[Response]]) -> Response:
        # Check for X-Region header
        region_header = request.headers.get("X-Region")

        if region_header:
            if not self.region_service.is_region_allowed(region_header):
                return JSONResponse(
                    status_code=400, content={
                        "detail": f"Region '{region_header}' is not supported."}, )

            # Start of a "routing" check simulation
            # In a multi-region deployment, checking if we are in the correct region
            # would happen here.
            # current_region = os.getenv("CURRENT_REGION")
            # if current_region and region_header != current_region:
            # return JSONResponse(status_code=409, content={"detail": "Wrong
            # region"})

        response = await call_next(request)
        return response
