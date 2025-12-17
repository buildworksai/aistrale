from datetime import datetime

from sqlmodel import Field, Relationship, SQLModel


class EvaluationBase(SQLModel):
    name: str = Field(index=True)
    dataset_path: str
    metric: str
    # pending, running, completed, failed
    status: str = Field(default="pending")
    prompt_id: int = Field(foreign_key="prompt.id")


class Evaluation(EvaluationBase, table=True):
    id: int | None = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    user_id: int | None = Field(default=None, foreign_key="user.id")

    results: list["EvaluationResult"] = Relationship(
        back_populates="evaluation")


class EvaluationResultBase(SQLModel):
    input: str
    output: str
    score: float
    feedback: str | None = None
    evaluation_id: int = Field(foreign_key="evaluation.id")


class EvaluationResult(EvaluationResultBase, table=True):
    id: int | None = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    evaluation: Evaluation = Relationship(back_populates="results")


class EvaluationCreate(EvaluationBase):
    pass


class EvaluationRead(EvaluationBase):
    id: int
    created_at: datetime
    updated_at: datetime
    user_id: int | None
