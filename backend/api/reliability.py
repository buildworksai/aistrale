from fastapi import APIRouter, Depends, BackgroundTasks
from typing import List, Dict, Any
from services.queue_service import QueueService
from services.circuit_breaker_service import CircuitBreakerService
from services.reliability_benchmark_service import ReliabilityBenchmarkService
from models.reliability import RequestQueue

router = APIRouter()

# Singletons (Simulated persistence)
_queue_service = QueueService()
_circuit_service = CircuitBreakerService()
_benchmark_service = ReliabilityBenchmarkService()

def get_queue_service():
    return _queue_service

def get_circuit_service():
    return _circuit_service

def get_benchmark_service():
    return _benchmark_service

@router.post("/queue/enqueue")
async def enqueue_request(
    task: Dict[str, Any], 
    priority: int = 1,
    service: QueueService = Depends(get_queue_service)
):
    """Enqueue a request."""
    return await service.enqueue(task, priority)

@router.get("/queue/next")
async def dequeue_request(service: QueueService = Depends(get_queue_service)):
    """Dequeue next item."""
    return await service.dequeue()

@router.post("/queue/complete/{request_id}")
async def complete_request(request_id: int, service: QueueService = Depends(get_queue_service)):
    """Mark request as complete."""
    await service.complete(request_id)
    return {"status": "ok"}

@router.get("/circuit-breakers/{provider}")
def get_circuit_status(provider: str, service: CircuitBreakerService = Depends(get_circuit_service)):
    """Get circuit breaker status for a provider."""
    breaker = service.get_breaker(provider)
    is_open = service.is_open(provider)
    return {"provider": provider, "state": breaker.state, "is_blocking": is_open, "failures": breaker.failure_count}

@router.post("/circuit-breakers/{provider}/simulate-failure")
def simulate_failure(provider: str, service: CircuitBreakerService = Depends(get_circuit_service)):
    """Simulate a failure to trip the breaker."""
    service.record_failure(provider)
    return {"status": "recorded_failure"}

@router.get("/queue")
def list_queue_items(service: QueueService = Depends(get_queue_service)):
    """List all queue items."""
    return service.list_items()

@router.get("/queue/metrics")
def get_queue_metrics(service: QueueService = Depends(get_queue_service)):
    """Get queue metrics."""
    return service.get_metrics()

@router.get("/load-balancers")
def list_load_balancers():
    """List all load balancers."""
    return []

@router.post("/load-balancers")
def create_load_balancer(balancer: Dict[str, Any]):
    """Create a load balancer."""
    return {"id": 1, **balancer}

@router.get("/load-balancers/analytics")
def get_load_balancer_analytics():
    """Get load balancer analytics."""
    return {
        "total_requests": 0,
        "avg_latency": 0,
        "distribution": [],
        "algorithm_performance": {}
    }

@router.get("/benchmarks/{provider}")
def get_benchmarks(provider: str, service: ReliabilityBenchmarkService = Depends(get_benchmark_service)):
    """Get internal performance benchmarks."""
    return service.get_benchmarks(provider)
