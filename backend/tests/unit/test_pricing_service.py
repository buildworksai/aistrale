"""Tests for pricing service."""

import pytest
from services.pricing_service import PricingService


class TestPricingService:
    """Test pricing service."""

    def test_get_pricing_openai(self):
        """Test OpenAI pricing."""
        pricing = PricingService.get_pricing("openai", "gpt-3.5-turbo")
        assert pricing["input"] == 0.5
        assert pricing["output"] == 1.5

    def test_get_pricing_anthropic(self):
        """Test Anthropic pricing."""
        pricing = PricingService.get_pricing(
            "anthropic", "claude-3-5-sonnet-20241022")
        assert pricing["input"] == 3.0
        assert pricing["output"] == 15.0

    def test_get_pricing_gemini(self):
        """Test Gemini pricing."""
        pricing = PricingService.get_pricing("gemini", "gemini-pro")
        assert pricing["input"] == 0.5
        assert pricing["output"] == 1.5

    def test_get_pricing_groq(self):
        """Test Groq pricing."""
        pricing = PricingService.get_pricing("groq", "llama-3.3-70b-versatile")
        assert pricing["input"] == 0.59
        assert pricing["output"] == 0.79

    def test_get_pricing_huggingface(self):
        """Test HuggingFace pricing (free)."""
        pricing = PricingService.get_pricing("huggingface", "any-model")
        assert pricing["input"] == 0.0
        assert pricing["output"] == 0.0

    def test_calculate_cost(self):
        """Test cost calculation."""
        cost = PricingService.calculate_cost(
            provider="openai",
            model="gpt-3.5-turbo",
            input_tokens=1000,
            output_tokens=500,
        )
        # (1000/1M * 0.5) + (500/1M * 1.5) = 0.0005 + 0.00075 = 0.00125
        assert cost == pytest.approx(0.00125, rel=1e-6)

    def test_calculate_cost_none_tokens(self):
        """Test cost calculation with None tokens."""
        cost = PricingService.calculate_cost(
            provider="openai",
            model="gpt-3.5-turbo",
            input_tokens=None,
            output_tokens=None,
        )
        assert cost == 0.0

    def test_calculate_cost_zero_tokens(self):
        """Test cost calculation with zero tokens."""
        cost = PricingService.calculate_cost(
            provider="openai",
            model="gpt-3.5-turbo",
            input_tokens=0,
            output_tokens=0)
        assert cost == 0.0
