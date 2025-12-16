import pytest
import os
from app.services.field_encryption_service import FieldEncryptionService
from cryptography.fernet import Fernet


def test_encryption_initialization_generated_key():
    # Ensure no env var
    if "ENCRYPTION_KEY" in os.environ:
        del os.environ["ENCRYPTION_KEY"]

    service = FieldEncryptionService()
    assert service.fernet is not None


def test_encryption_initialization_provided_key():
    key = Fernet.generate_key().decode()
    service = FieldEncryptionService(key=key)
    assert service._key == key


def test_encrypt_decrypt_cycle():
    service = FieldEncryptionService()
    original_text = "Sensitive Data"
    encrypted = service.encrypt_field(original_text)

    assert encrypted != original_text
    assert encrypted != ""

    decrypted = service.decrypt_field(encrypted)
    assert decrypted == original_text


def test_decrypt_invalid_token():
    service = FieldEncryptionService()
    with pytest.raises(Exception):
        service.decrypt_field("invalid_token_string")
