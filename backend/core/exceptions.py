class BaseAPIException(Exception):
    def __init__(
        self, message: str, status_code: int = 500, error_code: str = "INTERNAL_ERROR"
    ):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code


class InferenceError(BaseAPIException):
    def __init__(self, message: str):
        super().__init__(message, status_code=500, error_code="INFERENCE_ERROR")


class AuthenticationError(BaseAPIException):
    def __init__(self, message: str):
        super().__init__(message, status_code=401, error_code="AUTHENTICATION_ERROR")


class ValidationError(BaseAPIException):
    def __init__(self, message: str):
        super().__init__(message, status_code=400, error_code="VALIDATION_ERROR")


class NotFoundError(BaseAPIException):
    def __init__(self, message: str):
        super().__init__(message, status_code=404, error_code="NOT_FOUND")
