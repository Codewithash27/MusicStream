"""Application-specific exceptions mapped to HTTP responses."""

from typing import Any


class AppException(Exception):
    """Base application error."""

    def __init__(
        self,
        message: str,
        *,
        status_code: int = 400,
        code: str = "app_error",
        details: Any = None,
    ) -> None:
        self.message = message
        self.status_code = status_code
        self.code = code
        self.details = details
        super().__init__(message)


class UnauthorizedError(AppException):
    def __init__(self, message: str = "Could not validate credentials") -> None:
        super().__init__(message, status_code=401, code="unauthorized")


class ForbiddenError(AppException):
    def __init__(self, message: str = "Insufficient permissions") -> None:
        super().__init__(message, status_code=403, code="forbidden")


class ConflictError(AppException):
    def __init__(self, message: str, *, details: Any = None) -> None:
        super().__init__(message, status_code=409, code="conflict", details=details)


class NotFoundError(AppException):
    def __init__(self, message: str = "Resource not found") -> None:
        super().__init__(message, status_code=404, code="not_found")


class BadRequestError(AppException):
    def __init__(self, message: str, *, details: Any = None) -> None:
        super().__init__(message, status_code=400, code="bad_request", details=details)
