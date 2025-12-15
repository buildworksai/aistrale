"""Evaluation API endpoints."""

from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, Request, HTTPException
from sqlmodel import Session, select
from pydantic import BaseModel, ConfigDict

from core.database import get_session
from api.deps import get_current_user_id
from models.evaluation import Evaluation, EvaluationResult

router = APIRouter()


class EvaluationCreate(BaseModel):
    name: str
    dataset_path: str
    metric: str
    prompt_id: int


class EvaluationRead(BaseModel):
    id: int
    name: str
    dataset_path: str
    metric: str
    status: str
    prompt_id: int
    created_at: str
    updated_at: str
    user_id: Optional[int]

    model_config = ConfigDict(from_attributes=True)


@router.get("/", response_model=List[EvaluationRead])
def list_evaluations(
    request: Request,
    session: Session = Depends(get_session),
    user_id: int = Depends(get_current_user_id),
) -> List[Evaluation]:
    """List all evaluation suites."""
    evaluations = session.exec(
        select(Evaluation).where(Evaluation.user_id == user_id)
    ).all()
    return evaluations


@router.post("/", response_model=EvaluationRead, status_code=201)
def create_evaluation(
    request: Request,
    evaluation_data: EvaluationCreate,
    session: Session = Depends(get_session),
    user_id: int = Depends(get_current_user_id),
) -> Evaluation:
    """Create a new evaluation suite."""
    evaluation = Evaluation(
        name=evaluation_data.name,
        dataset_path=evaluation_data.dataset_path,
        metric=evaluation_data.metric,
        prompt_id=evaluation_data.prompt_id,
        user_id=user_id,
    )
    session.add(evaluation)
    session.commit()
    session.refresh(evaluation)
    return evaluation


@router.get("/{evaluation_id}/results")
def get_evaluation_results(
    request: Request,
    evaluation_id: int,
    session: Session = Depends(get_session),
    user_id: int = Depends(get_current_user_id),
) -> Dict[str, Any]:
    """Get evaluation results."""
    evaluation = session.get(Evaluation, evaluation_id)
    if not evaluation or evaluation.user_id != user_id:
        raise HTTPException(status_code=404, detail="Evaluation not found")

    results = session.exec(
        select(EvaluationResult).where(
            EvaluationResult.evaluation_id == evaluation_id
        )
    ).all()

    total_tests = len(results)
    passed = sum(1 for r in results if r.score >= 0.7)
    failed = total_tests - passed
    avg_score = sum(r.score for r in results) / total_tests if total_tests > 0 else 0

    return {
        "evaluation": evaluation,
        "results": results,
        "summary": {
            "total_tests": total_tests,
            "passed": passed,
            "failed": failed,
            "avg_score": avg_score,
        },
    }


@router.post("/{evaluation_id}/run")
def run_evaluation(
    request: Request,
    evaluation_id: int,
    session: Session = Depends(get_session),
    user_id: int = Depends(get_current_user_id),
) -> Dict[str, Any]:
    """Run an evaluation suite."""
    evaluation = session.get(Evaluation, evaluation_id)
    if not evaluation or evaluation.user_id != user_id:
        raise HTTPException(status_code=404, detail="Evaluation not found")

    evaluation.status = "running"
    session.add(evaluation)
    session.commit()

    # In a real implementation, this would trigger async evaluation
    # For now, return a placeholder
    return {"status": "started", "evaluation_id": evaluation_id}

