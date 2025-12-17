"""Encryption key rotation service."""

import uuid
from datetime import datetime

from cryptography.fernet import Fernet
from sqlmodel import Session, select

from core.config import get_settings
from models.encryption_key import EncryptionKey
from models.token import Token

settings = get_settings()


class KeyRotationService:
    """Service for managing encryption key rotation."""

    def __init__(self, session: Session):
        self.session = session

    def get_active_key(self) -> EncryptionKey:
        """Get the currently active encryption key."""
        key = self.session.exec(
            select(EncryptionKey).where(EncryptionKey.is_active == True)  # noqa: E712
        ).first()

        if not key:
            # Create initial key from environment variable
            return self._create_initial_key()

        return key

    def _create_initial_key(self) -> EncryptionKey:
        """Create initial key from environment variable."""
        key_id = str(uuid.uuid4())
        master_key = settings.ENCRYPTION_KEY.encode()
        master_cipher = Fernet(master_key)

        # Encrypt the key with master key (for storage)
        encrypted_key = master_cipher.encrypt(
            settings.ENCRYPTION_KEY.encode()).decode()

        key_record = EncryptionKey(
            key_id=key_id,
            encrypted_key=encrypted_key,
            is_active=True,
        )
        self.session.add(key_record)
        self.session.commit()
        return key_record

    def rotate_key(self) -> tuple[str, int]:
        """
        Rotate encryption key and re-encrypt all tokens.

        Returns:
            Tuple of (new_key_id, re_encrypted_count)
        """
        # Get current active key
        old_key = self.get_active_key()

        # Decrypt old key
        master_key = settings.ENCRYPTION_KEY.encode()
        master_cipher = Fernet(master_key)
        old_key_value = master_cipher.decrypt(
            old_key.encrypted_key.encode()).decode()
        old_cipher = Fernet(old_key_value.encode())

        # Generate new key
        new_key_id = str(uuid.uuid4())
        new_key_value = Fernet.generate_key().decode()
        new_cipher = Fernet(new_key_value.encode())

        # Encrypt new key with master key
        encrypted_new_key = master_cipher.encrypt(
            new_key_value.encode()).decode()

        # Create new key record
        new_key_record = EncryptionKey(
            key_id=new_key_id,
            encrypted_key=encrypted_new_key,
            is_active=True,
        )
        self.session.add(new_key_record)

        # Deactivate old key
        old_key.is_active = False
        old_key.rotated_at = datetime.utcnow()
        self.session.add(old_key)

        # Re-encrypt all tokens
        tokens = self.session.exec(select(Token)).all()
        re_encrypted_count = 0

        for token in tokens:
            try:
                # Decrypt with old key
                decrypted_token = old_cipher.decrypt(
                    token.encrypted_token.encode()
                ).decode()

                # Encrypt with new key
                token.encrypted_token = new_cipher.encrypt(
                    decrypted_token.encode()
                ).decode()
                token.key_id = new_key_id

                self.session.add(token)
                re_encrypted_count += 1
            except Exception:
                # If decryption fails, token might be using a different key
                # Skip it for now (could be from a previous rotation)
                continue

        self.session.commit()

        return (new_key_id, re_encrypted_count)
