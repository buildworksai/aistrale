import pytest
from services.benchmark_service import BenchmarkService

def test_compare_to_industry():
    service = BenchmarkService()
    
    # Median is 0.002
    
    # Case 1: Higher cost (0.003) -> +50%
    res = service.compare_to_industry("avg_cost_per_token", 0.003)
    assert res["comparison"] == "higher"
    assert res["diff_percent"] == 50.0
    
    # Case 2: Lower cost (0.001) -> -50% (matches 25th percentile benchmark)
    res = service.compare_to_industry("avg_cost_per_token", 0.001)
    assert res["comparison"] == "lower"
    assert res["diff_percent"] == -50.0
    
    # Case 3: Average (0.0021) -> +5% (within 10% threshold)
    res = service.compare_to_industry("avg_cost_per_token", 0.0021)
    assert res["comparison"] == "average"

def test_missing_benchmark():
    service = BenchmarkService()
    res = service.compare_to_industry("unknown_metric", 100)
    assert res["status"] == "unknown"
