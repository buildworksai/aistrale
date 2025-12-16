from services.optimization_service import OptimizationService


def test_analyze_prompt_verbose():
    service = OptimizationService()
    prompt = "Could you please kindly help me with this task? I would appreciate it if you could ensure it works. Thank you very much."

    analysis = service.analyze_prompt(prompt)

    # Should detect polite fillers
    assert any("polite fillers" in s for s in analysis["suggestions"])
    assert analysis["efficiency_score"] < 1.0


def test_analyze_prompt_clean():
    service = OptimizationService()
    prompt = "Summarize this text."

    analysis = service.analyze_prompt(prompt)

    assert len(analysis["suggestions"]) == 0
    assert analysis["efficiency_score"] == 1.0


def test_generate_recommendations():
    service = OptimizationService()
    recs = service.generate_recommendations(workspace_id=1)

    assert len(recs) >= 2
    assert recs[0].recommendation_type == "model_switch"
    assert recs[0].potential_savings > 0
