from fastapi import APIRouter, Depends, Query
from typing import List, Dict, Any, Optional
from services.health_service import HealthService
from services.comparison_service import ComparisonService
from services.ab_test_service import ABTestService
from services.model_abstraction_service import ModelAbstractionService
from models.multi_provider import ProviderHealth, ABTest, ProviderComparison

router = APIRouter()

# Dependency Injection (Simple instantiation for demo)
def get_health_service():
    return HealthService()

def get_comparison_service():
    return ComparisonService()

def get_ab_test_service():
    return ABTestService()

def get_model_abstraction_service():
    return ModelAbstractionService()

@router.get("/health", response_model=List[ProviderHealth])
def get_provider_health(service: HealthService = Depends(get_health_service)):
    """Get health status of all providers."""
    return service.monitor_all()

@router.post("/compare")
def compare_providers(
    provider1: str, 
    provider2: str, 
    metric: str = "quality",
    service: ComparisonService = Depends(get_comparison_service)
):
    """Compare two providers side-by-side."""
    return service.compare_providers(provider1, provider2, metric)

@router.post("/ab-test/start")
async def start_ab_test(
    name: str, 
    prompt: str, 
    providers: List[str],
    service: ABTestService = Depends(get_ab_test_service)
):
    """Start an A/B test."""
    return await service.start_test(name, prompt, providers)

@router.get("/ab-test")
def list_ab_tests(service: ABTestService = Depends(get_ab_test_service)):
    """List all A/B tests."""
    return service.list_tests()

@router.get("/ab-test/{test_id}")
def get_ab_test_results(
    test_id: int,
    service: ABTestService = Depends(get_ab_test_service)
):
    """Get results of an A/B test."""
    return service.get_results(test_id)

@router.get("/routing")
def list_routing_rules():
    """List all smart routing rules."""
    return []

@router.post("/routing")
def create_routing_rule(rule: Dict[str, Any]):
    """Create a smart routing rule."""
    return {"id": 1, **rule}

@router.get("/models")
def list_models(service: ModelAbstractionService = Depends(get_model_abstraction_service)):
    """List all model mappings."""
    return service.list_mappings()

@router.post("/resolve-model")
def resolve_model_name(
    unified_name: str = Query(..., description="Unified model name to resolve"),
    preferred_provider: Optional[str] = Query(None, description="Preferred provider"),
    service: ModelAbstractionService = Depends(get_model_abstraction_service)
):
    """Resolve a unified model name to a provider-specific model."""
    result = service.resolve_model(unified_name, preferred_provider)
    # Map response to match frontend expectations
    return {
        "unified_name": result.get("unified_name", unified_name),
        "provider": result.get("provider"),
        "provider_model": result.get("actual_model", result.get("model")),
        "capabilities": service.get_capabilities(unified_name),
        "pricing": result.get("pricing", {})
    }
