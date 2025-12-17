from datetime import datetime

from sqlmodel import Field, SQLModel

from models.region import Region


class Workspace(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    region: str = Field(default=Region.US_EAST_1.value)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # In future, relationships to Project, User etc.
    # users: List["User"] = Relationship(back_populates="workspace")
