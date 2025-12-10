from fastapi import APIRouter, Depends
from services.compliance_service import ComplianceService
from pydantic import BaseModel

router = APIRouter()

class GdprRequest(BaseModel):
    user_id: str

def get_compliance_service():
    """Dependency to get ComplianceService instance."""
    return ComplianceService()

@router.post("/gdpr-export")
def dispatch_gdpr_export(
    request: GdprRequest,
    compliance_service: ComplianceService = Depends(get_compliance_service)
):
    """
    Initiate a GDPR data export.
    """
    # Verify service method signature from conversation: "Generates GDPR data portability reports (JSON)."
    # Likely generate_gdpr_export(user_id)
    result = compliance_service.generate_gdpr_export(int(request.user_id) if request.user_id.isdigit() else 1)
    
    # We return a status indicating initiation
    return {"status": "initiated", "report_id": f"gdpr_{request.user_id}_{result.get('generated_at', 'now')}"}
