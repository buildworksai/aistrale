from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


from cryptography.fernet import Fernet
from core.config import get_settings

settings = get_settings()
# Ensure encryption key is valid or generate one for dev if missing (though config enforces it)
# For safety in this environment, if no key is provided, we might crash. 
# But let's assume it's provided or we default for dev.
key = settings.ENCRYPTION_KEY if settings.ENCRYPTION_KEY else Fernet.generate_key().decode()
cipher = Fernet(key.encode())

class Token(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    provider: str  # "huggingface" or "openai"
    encrypted_token: str
    label: str
    is_default: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    def set_token(self, token: str):
        self.encrypted_token = cipher.encrypt(token.encode()).decode()

    @property
    def token_value(self) -> str:
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
