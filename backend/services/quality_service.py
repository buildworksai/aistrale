import logging
from typing import Dict, Any, List, Optional
from models.cost_optimization import ProviderPerformance

logger = logging.getLogger(__name__)

class QualityScoringService:
    """
    Service to score output quality and analyze cost/quality tradeoffs.
    """

    def calculate_quality_score(self, text: str, user_feedback: Optional[int] = None) -> float:
        """
        Calculate a quality score (0.0 to 1.0).
        For V1: Uses user feedback (1-5 stars) normalized, or heuristic based on length/structure.
        """
        if user_feedback:
            # Normalize 1-5 to 0.0-1.0
            return max(0.0, min(1.0, (user_feedback - 1) / 4))
        
        # Heuristic: Length and structure (dummy implementation)
        # In reality, this would use LLM-as-judge or readability metrics
        length_score = min(1.0, len(text) / 500)
        return round(length_score, 2)

    def analyze_tradeoff(self, providers: List[ProviderPerformance], min_quality: float = 0.8) -> Dict[str, Any]:
        """
        Analyze cost vs quality to find 'best value' and 'best quality' options.
        """
        if not providers:
            return {}
            
        # Sort by quality desc
        sorted_by_quality = sorted(providers, key=lambda p: p.quality_score, reverse=True)
        best_quality = sorted_by_quality[0]
        
        # Filter acceptable quality
        acceptable = [p for p in providers if p.quality_score >= min_quality]
        
        if not acceptable:
            best_value = best_quality # If none meet threshold, best quality is fallback
        else:
            # Best value is lowest cost among acceptable quality
            best_value = min(acceptable, key=lambda p: p.avg_cost_per_1k_tokens)
            
        return {
            "best_quality": {
                "provider": best_quality.provider,
                "model": best_quality.model,
                "score": best_quality.quality_score,
                "cost": best_quality.avg_cost_per_1k_tokens
            },
            "best_value": {
                "provider": best_value.provider,
                "model": best_value.model,
                "score": best_value.quality_score,
                "cost": best_value.avg_cost_per_1k_tokens
            },
            "recommendation": best_value.provider if best_value.avg_cost_per_1k_tokens < best_quality.avg_cost_per_1k_tokens * 0.5 else best_quality.provider
        }
