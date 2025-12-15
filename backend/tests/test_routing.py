import pytest
from services.routing_service import RoutingService

def test_route_manual_high_quality():
    service = RoutingService()
    # Requesting very high quality, should get GPT-4 (0.95) or Claude (0.92)
    selection = service.route_request("chat", quality_req=0.93)
    assert selection["provider"] == "openai"
    assert selection["model"] == "gpt-4"

def test_route_cheapest_rule():
    service = RoutingService()
    # "chat" task triggers "Cheap Chat" rule -> strategy=cheapest, quality>=0.8
    # Candidates >= 0.8: gpt-3.5 (0.002), llama-2 (0.0009), claude (0.01), gpt-4 (0.03)
    # Cheapest is llama-2-70b
    selection = service.route_request("chat")
    assert selection["provider"] == "together"
    assert selection["model"] == "llama-2-70b"

def test_route_fallback():
    service = RoutingService()
    # Impossible requirement
    selection = service.route_request("chat", quality_req=1.0)
    # Should fallback to default
    assert selection["model"] == "gpt-3.5-turbo"
