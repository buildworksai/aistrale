from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        try:
            response = await call_next(request)
        except Exception as e:
            # If an exception occurs, create a response with security headers
            from fastapi.responses import JSONResponse

            response = JSONResponse(
                status_code=500, content={"detail": "Internal server error"}
            )
            # Don't raise, return the error response with headers

        # Security Headers (add to all responses, including errors)
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = (
            "max-age=31536000; includeSubDomains"
        )
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; img-src 'self' data: https:; "
            "script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';")
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # Ensure CORS headers are preserved (don't overwrite them)
        # CORS middleware should have already added them, but we preserve them
        # here

        return response
