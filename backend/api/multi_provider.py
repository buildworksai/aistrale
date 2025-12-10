from fastapi import APIRouter, Depends
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

@router.get("/ab-test/{test_id}")
def get_ab_test_results(
    test_id: int,
    service: ABTestService = Depends(get_ab_test_service)
):
    """Get results of an A/B test."""
    return service.get_results(test_id)

@router.post("/resolve-model")
def resolve_model_name(
    unified_name: str, 
    preferred_provider: Optional[str] = None,
    service: ModelAbstractionService = Depends(get_model_abstraction_service)
):
    """Resolve a unified model name to a provider-specific model."""
    return service.resolve_model(unified_name, preferred_provider)
