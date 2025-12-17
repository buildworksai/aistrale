"""Encryption key management model."""

from datetime import datetime

from sqlmodel import Field, SQLModel


class EncryptionKey(SQLModel, table=True):
    """Encryption key for token encryption."""

    id: int | None = Field(default=None, primary_key=True)
    key_id: str = Field(unique=True, index=True)  # Unique identifier
    encrypted_key: str  # Key encrypted with master key
    is_active: bool = Field(default=True, index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    rotated_at: datetime | None = None
