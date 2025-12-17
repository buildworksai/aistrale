from datetime import datetime

from cryptography.fernet import Fernet
from sqlmodel import Field, SQLModel, select

from core.config import get_settings
from models.encryption_key import EncryptionKey

settings = get_settings()


def get_active_encryption_key(session=None) -> tuple[str, str]:
    """
    Get the active encryption key.

    Args:
        session: Optional database session

    Returns:
        Tuple of (key_id, key_value)
    """
    # Try to get active key from database if session provided
    if session and hasattr(session, "exec"):
        try:
            active_key = session.exec(
                select(EncryptionKey).where(
                    EncryptionKey.is_active.is_(True)
                )
            ).first()

            if active_key:
                # Decrypt the key using master key
                master_key = settings.ENCRYPTION_KEY.encode()
                master_cipher = Fernet(master_key)
                decrypted_key = master_cipher.decrypt(
                    active_key.encrypted_key.encode()
                ).decode()
                return (active_key.key_id, decrypted_key)
        except Exception:
            # If database lookup fails, fall back to environment variable
            pass

    # Fallback to environment variable for backward compatibility
    key = (
        settings.ENCRYPTION_KEY
        if settings.ENCRYPTION_KEY
        else Fernet.generate_key().decode()
    )
    return ("legacy", key)


class Token(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    provider: str  # "huggingface", "openai", "groq", "anthropic", "gemini"
    encrypted_token: str
    key_id: str = Field(default="legacy")  # Key version identifier
    label: str
    is_default: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    def set_token(self, token: str, session=None):
        """Encrypt token using active key."""
        key_id, key_value = get_active_encryption_key(session)
        cipher = Fernet(key_value.encode())
        self.encrypted_token = cipher.encrypt(token.encode()).decode()
        self.key_id = key_id

    def get_token_value(self, session) -> str:
        """Decrypt token using the key_id (requires session)."""
        key_id, key_value = get_active_encryption_key(session)

        # If key_id doesn't match, try to find the correct key
        if self.key_id not in (key_id, "legacy"):
            # Look up the key by key_id
            key_record = session.exec(
                select(EncryptionKey).where(
                    EncryptionKey.key_id == self.key_id)).first()
            if key_record:
                master_key = settings.ENCRYPTION_KEY.encode()
                master_cipher = Fernet(master_key)
                key_value = master_cipher.decrypt(
                    key_record.encrypted_key.encode()
                ).decode()

        cipher = Fernet(key_value.encode())
        return cipher.decrypt(self.encrypted_token.encode()).decode()

    @property
    def token_value(self) -> str:
        """Decrypt token (backward compatibility - uses active key)."""
        # For backward compatibility, use active key from environment
        # This will be replaced by get_token_value() in key rotation service
        _, key_value = get_active_encryption_key()
        cipher = Fernet(key_value.encode())
        return cipher.decrypt(self.encrypted_token.encode()).decode()


class TokenCreate(SQLModel):
    provider: str
    token_value: str
    label: str
    is_default: bool = False


class TokenRead(SQLModel):
    id: int
    user_id: int
    provider: str
    label: str
    is_default: bool
    created_at: datetime
    # We generally don't return the token value for security, or maybe masked?
    # But if the user needs to see it once, we might return it.
    # For now, let's NOT return the token value in the list.
