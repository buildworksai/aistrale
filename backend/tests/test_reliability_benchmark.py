import pytest
import logging
from backend.services.reliability_benchmark_service import ReliabilityBenchmarkService

def test_record_metric_alert(caplog):
    service = ReliabilityBenchmarkService()
    
    with caplog.at_level(logging.WARNING):
        # Baseline is 450. Recording 600 should trigger alert (>20% deviation)
        service.record_metric("openai", "latency_ms", 600)
    
    assert "PERFORMANCE ALERT" in caplog.text

def test_record_metric_normal(caplog):
    service = ReliabilityBenchmarkService()
    
    with caplog.at_level(logging.WARNING):
        # Baseline 450. Recording 460 is fine.
        service.record_metric("openai", "latency_ms", 460)
        
    assert "PERFORMANCE ALERT" not in caplog.text

def test_update_baseline():
    service = ReliabilityBenchmarkService()
    
    # Update existing
    service.update_baseline("openai", "latency_ms", [100, 200, 300]) # Avg 200
    
    benchmarks = service.get_benchmarks("openai")
    b = next(b for b in benchmarks if b.metric == "latency_ms")
    
    assert b.baseline_value == 200.0
