"""Admin API endpoints."""

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from core.database import get_session
from api.deps import require_admin
from services.key_rotation_service import KeyRotationService
from models.encryption_key import EncryptionKey

router = APIRouter()


@router.post("/rotate-encryption-key")
def rotate_encryption_key(
    session: Session = Depends(get_session),
    user_id: int = Depends(require_admin),
) -> dict:
    """
    Rotate encryption key and re-encrypt all tokens (admin only).
    
    This operation:
    1. Generates a new encryption key
    2. Re-encrypts all tokens with the new key
    3. Deactivates the old key
    
    Returns:
        Status and count of re-encrypted tokens
    """
    rotation_service = KeyRotationService(session)
    
    try:
        new_key_id, re_encrypted_count = rotation_service.rotate_key()
        return {
            "status": "success",
            "message": "Encryption key rotated successfully",
            "new_key_id": new_key_id,
            "re_encrypted_tokens": re_encrypted_count,
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Key rotation failed: {str(e)}"
        )


@router.get("/active-key")
def get_active_key(
    session: Session = Depends(get_session),
    user_id: int = Depends(require_admin),
) -> EncryptionKey:
    """
    Get the current active encryption key (admin only).
    """
    rotation_service = KeyRotationService(session)
    active_key = rotation_service.get_active_key()
    return active_key

