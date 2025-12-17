import logging
import os

from cryptography.fernet import Fernet

logger = logging.getLogger(__name__)


class FieldEncryptionService:
    """
    Service for encrypting and decrypting sensitive field data using Fernet
    (symmetric encryption).
    """

    def __init__(self, key: str | None = None):
        """
        Initialize with a base64-encoded 32-byte key.
        If no key provided, it looks for ENCRYPTION_KEY env var.
        """
        self._key = key or os.environ.get("ENCRYPTION_KEY")

        if not self._key:
            logger.warning(
                "No ENCRYPTION_KEY provided. Generating a temporary key for this "
                "session. DATA WILL BE UNREADABLE AFTER RESTART."
            )
            self._key = Fernet.generate_key().decode()

        try:
            self.fernet = Fernet(self._key)
        except Exception as e:
            logger.error(f"Invalid encryption key: {e}")
            raise

    def encrypt_field(self, data: str) -> str:
        """
        Encrypts a string value. Returns base64 encoded string.
        """
        if not data:
            return ""
        try:
            return self.fernet.encrypt(data.encode()).decode()
        except Exception as e:
            logger.error(f"Encryption failed: {e}")
            raise

    def decrypt_field(self, token: str) -> str:
        """
        Decrypts a base64 encoded string.
        """
        if not token:
            return ""
        try:
            return self.fernet.decrypt(token.encode()).decode()
        except Exception as e:
            logger.error(f"Decryption failed: {e}")
            raise

    def rotate_key(self, new_key: str):
        """
        Update the encryption key.
        In a real scenario, this would involve re-encrypting data.
        For now, this just updates the current instance's key.
        """
        self._key = new_key
        self.fernet = Fernet(self._key)
