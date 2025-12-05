from datetime import datetime
from typing import Optional, List
from sqlmodel import Field, SQLModel, Relationship
from sqlalchemy import Column, JSON

class EvaluationBase(SQLModel):
    name: str = Field(index=True)
    dataset_path: str
    metric: str
    status: str = Field(default="pending") # pending, running, completed, failed
    prompt_id: int = Field(foreign_key="prompt.id")

class Evaluation(EvaluationBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    user_id: Optional[int] = Field(default=None, foreign_key="user.id")
    
    results: List["EvaluationResult"] = Relationship(back_populates="evaluation")

class EvaluationResultBase(SQLModel):
    input: str
    output: str
    score: float
    feedback: Optional[str] = None
    evaluation_id: int = Field(foreign_key="evaluation.id")

class EvaluationResult(EvaluationResultBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    evaluation: Evaluation = Relationship(back_populates="results")

class EvaluationCreate(EvaluationBase):
    pass

class EvaluationRead(EvaluationBase):
    id: int
    created_at: datetime
    updated_at: datetime
    user_id: Optional[int]
