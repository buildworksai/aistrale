"""Project management API endpoints."""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlmodel import Session, select
from pydantic import BaseModel, ConfigDict

from core.database import get_session
from api.deps import get_current_user_id
from models.project import Project
from models.workspace import Workspace
import structlog

logger = structlog.get_logger()
router = APIRouter()


class ProjectCreate(BaseModel):
    name: str
    workspace_id: int


class ProjectRead(BaseModel):
    id: int
    name: str
    workspace_id: int
    created_at: str

    model_config = ConfigDict(from_attributes=True)


class ProjectUpdate(BaseModel):
    name: Optional[str] = None


@router.get("/", response_model=List[ProjectRead])
def list_projects(
    request: Request,
    workspace_id: Optional[int] = None,
    session: Session = Depends(get_session),
    user_id: int = Depends(get_current_user_id),
) -> List[Project]:
    """List projects, optionally filtered by workspace."""
    query = select(Project)
    if workspace_id:
        query = query.where(Project.workspace_id == workspace_id)
    projects = session.exec(query).all()
    return projects


@router.post("/", response_model=ProjectRead, status_code=201)
def create_project(
    request: Request,
    project_data: ProjectCreate,
    session: Session = Depends(get_session),
    user_id: int = Depends(get_current_user_id),
) -> Project:
    """Create a new project."""
    # Verify workspace exists
    workspace = session.get(Workspace, project_data.workspace_id)
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    project = Project(
        name=project_data.name,
        workspace_id=project_data.workspace_id,
    )
    session.add(project)
    session.commit()
    session.refresh(project)

    logger.info(
        "project_created",
        project_id=project.id,
        project_name=project.name,
        workspace_id=project.workspace_id,
        user_id=user_id,
    )

    return project


@router.get("/{project_id}", response_model=ProjectRead)
def get_project(
    request: Request,
    project_id: int,
    session: Session = Depends(get_session),
    user_id: int = Depends(get_current_user_id),
) -> Project:
    """Get a specific project."""
    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.patch("/{project_id}", response_model=ProjectRead)
def update_project(
    request: Request,
    project_id: int,
    project_data: ProjectUpdate,
    session: Session = Depends(get_session),
    user_id: int = Depends(get_current_user_id),
) -> Project:
    """Update a project."""
    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if project_data.name:
        project.name = project_data.name

    session.add(project)
    session.commit()
    session.refresh(project)

    logger.info(
        "project_updated",
        project_id=project.id,
        user_id=user_id,
    )

    return project


@router.delete("/{project_id}", status_code=204)
def delete_project(
    request: Request,
    project_id: int,
    session: Session = Depends(get_session),
    user_id: int = Depends(get_current_user_id),
) -> None:
    """Delete a project."""
    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    session.delete(project)
    session.commit()

    logger.info(
        "project_deleted",
        project_id=project_id,
        user_id=user_id,
    )
