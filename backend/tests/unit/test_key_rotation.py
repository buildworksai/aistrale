"""Tests for key rotation service."""

import pytest
from sqlmodel import Session, create_engine, SQLModel
from cryptography.fernet import Fernet
from models.encryption_key import EncryptionKey
from models.token import Token
from services.key_rotation_service import KeyRotationService
from core.config import get_settings


@pytest.fixture
def test_db():
    """Create test database."""
    engine = create_engine("sqlite:///:memory:")
    SQLModel.metadata.create_all(engine)
    
    with Session(engine) as session:
        yield session
    
    SQLModel.metadata.drop_all(engine)


@pytest.fixture
def test_token(test_db):
    """Create test token."""
    settings = get_settings()
    master_key = settings.ENCRYPTION_KEY.encode()
    master_cipher = Fernet(master_key)
    
    # Create initial key
    key_id = "test-key-1"
    test_key = Fernet.generate_key().decode()
    encrypted_key = master_cipher.encrypt(test_key.encode()).decode()
    
    key_record = EncryptionKey(
        key_id=key_id,
        encrypted_key=encrypted_key,
        is_active=True,
    )
    test_db.add(key_record)
    test_db.commit()
    
    # Create token encrypted with this key
    cipher = Fernet(test_key.encode())
    encrypted_token = cipher.encrypt(b"test_token_value").decode()
    
    token = Token(
        user_id=1,
        provider="openai",
        encrypted_token=encrypted_token,
        key_id=key_id,
        label="Test Token",
    )
    test_db.add(token)
    test_db.commit()
    test_db.refresh(token)
    
    return token


class TestKeyRotationService:
    """Test key rotation service."""

    def test_get_active_key(self, test_db):
        """Test getting active key."""
        service = KeyRotationService(test_db)
        key = service.get_active_key()
        
        assert key is not None
        assert key.is_active is True

    def test_rotate_key(self, test_db, test_token):
        """Test key rotation."""
        service = KeyRotationService(test_db)
        
        old_key_id = test_token.key_id
        new_key_id, re_encrypted_count = service.rotate_key()
        
        assert new_key_id != old_key_id
        assert re_encrypted_count == 1
        
        # Check old key is deactivated
        from sqlmodel import select
        old_key = test_db.exec(
            select(EncryptionKey).where(EncryptionKey.key_id == old_key_id)
        ).first()
        assert old_key.is_active is False
        
        # Check new key is active
        new_key = test_db.exec(
            select(EncryptionKey).where(EncryptionKey.key_id == new_key_id)
        ).first()
        assert new_key.is_active is True
        
        # Check token was re-encrypted
        test_db.refresh(test_token)
        assert test_token.key_id == new_key_id

