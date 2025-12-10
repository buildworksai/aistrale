from fastapi import APIRouter, Depends
from pydantic import BaseModel
from services.dlp_service import DLPService
from services.pii_detection_service import PIIDetectionService

router = APIRouter()

class RedactRequest(BaseModel):
    text: str

class RedactResponse(BaseModel):
    redacted_text: str

def get_dlp_service():
    """Dependency to get DLP service instance."""
    pii_service = PIIDetectionService()
    return DLPService(pii_service=pii_service)

@router.post("/redact", response_model=RedactResponse)
def redact_pii(
    request: RedactRequest,
    dlp_service: DLPService = Depends(get_dlp_service)
):
    """Redact PII from text."""
    # Scan content using DLP service (checks both custom rules and PII)
    is_blocked, processed_text, violations = dlp_service.scan_content(request.text)
    
    # If blocked, we might want to return an error or just the info.
    # For a Redaction Tester UI, we likely want the processed result.
    return RedactResponse(redacted_text=processed_text)
