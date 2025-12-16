"""Workspace management API endpoints."""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlmodel import Session, select
from pydantic import BaseModel, ConfigDict

from core.database import get_session
from api.deps import get_current_user_id, require_admin
from models.workspace import Workspace
from services.region_service import RegionService
import structlog

logger = structlog.get_logger()
router = APIRouter()


class WorkspaceCreate(BaseModel):
    name: str
    region: Optional[str] = None


class WorkspaceRead(BaseModel):
    id: int
    name: str
    region: str
    created_at: str

    model_config = ConfigDict(from_attributes=True)


class WorkspaceUpdate(BaseModel):
    name: Optional[str] = None
    region: Optional[str] = None


@router.get("", response_model=List[WorkspaceRead])
@router.get("/", response_model=List[WorkspaceRead])
def list_workspaces(
    request: Request,
    session: Session = Depends(get_session),
    user_id: int = Depends(get_current_user_id),
) -> List[Workspace]:
    """List all workspaces accessible to the user."""
    # In future, filter by user permissions
    workspaces = session.exec(select(Workspace)).all()
    return workspaces


@router.post("/", response_model=WorkspaceRead, status_code=201)
def create_workspace(
    request: Request,
    workspace_data: WorkspaceCreate,
    session: Session = Depends(get_session),
    user_id: int = Depends(get_current_user_id),
) -> Workspace:
    """Create a new workspace."""
    # Validate region if provided
    if workspace_data.region:
        region_service = RegionService()
        try:
            region_service.validate_workspace_region(workspace_data.region)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
    else:
        # Use default region
        region_service = RegionService()
        workspace_data.region = region_service.get_default_region().value

    workspace = Workspace(
        name=workspace_data.name,
        region=workspace_data.region,
    )
    session.add(workspace)
    session.commit()
    session.refresh(workspace)

    logger.info(
        "workspace_created",
        workspace_id=workspace.id,
        workspace_name=workspace.name,
        region=workspace.region,
        user_id=user_id,
    )

    return workspace


@router.get("/{workspace_id}", response_model=WorkspaceRead)
def get_workspace(
    request: Request,
    workspace_id: int,
    session: Session = Depends(get_session),
    user_id: int = Depends(get_current_user_id),
) -> Workspace:
    """Get a specific workspace."""
    workspace = session.get(Workspace, workspace_id)
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    return workspace


@router.patch("/{workspace_id}", response_model=WorkspaceRead)
def update_workspace(
    request: Request,
    workspace_id: int,
    workspace_data: WorkspaceUpdate,
    session: Session = Depends(get_session),
    user_id: int = Depends(get_current_user_id),
) -> Workspace:
    """Update a workspace."""
    workspace = session.get(Workspace, workspace_id)
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    # Validate region if provided
    if workspace_data.region:
        region_service = RegionService()
        try:
            region_service.validate_workspace_region(workspace_data.region)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        workspace.region = workspace_data.region

    if workspace_data.name:
        workspace.name = workspace_data.name

    session.add(workspace)
    session.commit()
    session.refresh(workspace)

    logger.info(
        "workspace_updated",
        workspace_id=workspace.id,
        user_id=user_id,
    )

    return workspace


@router.delete("/{workspace_id}", status_code=204)
def delete_workspace(
    request: Request,
    workspace_id: int,
    session: Session = Depends(get_session),
    user_id: int = Depends(require_admin),
) -> None:
    """Delete a workspace (admin only)."""
    workspace = session.get(Workspace, workspace_id)
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    session.delete(workspace)
    session.commit()

    logger.info(
        "workspace_deleted",
        workspace_id=workspace_id,
        user_id=user_id,
    )
