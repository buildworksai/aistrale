"""Permission management API endpoints."""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Request, Query
from sqlmodel import Session, select, and_
from pydantic import BaseModel

from core.database import get_session
from api.deps import get_current_user_id, require_admin
from models.permission import Permission
from services.permission_service import PermissionService
import structlog

logger = structlog.get_logger()
router = APIRouter()


class PermissionCreate(BaseModel):
    user_id: int
    resource_type: str
    resource_id: Optional[str] = None
    action: str
    granted: bool = True


class PermissionRead(BaseModel):
    id: int
    user_id: int
    resource_type: str
    resource_id: Optional[str]
    action: str
    granted: bool

    class Config:
        from_attributes = True


class PermissionUpdate(BaseModel):
    action: Optional[str] = None
    granted: Optional[bool] = None


class PermissionBulkUpdate(BaseModel):
    user_ids: List[int]
    resource_type: str
    resource_id: Optional[str] = None
    action: str
    granted: bool


@router.get("/", response_model=List[PermissionRead])
def list_permissions(
    request: Request,
    user_id: Optional[int] = Query(None),
    resource_type: Optional[str] = Query(None),
    resource_id: Optional[str] = Query(None),
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id),
) -> List[Permission]:
    """List permissions with optional filters."""
    query = select(Permission)

    conditions = []
    if user_id:
        conditions.append(Permission.user_id == user_id)
    if resource_type:
        conditions.append(Permission.resource_type == resource_type)
    if resource_id:
        conditions.append(Permission.resource_id == resource_id)

    if conditions:
        query = query.where(and_(*conditions))

    permissions = session.exec(query).all()
    return permissions


@router.post("/", response_model=PermissionRead, status_code=201)
def create_permission(
    request: Request,
    permission_data: PermissionCreate,
    session: Session = Depends(get_session),
    user_id: int = Depends(require_admin),
) -> Permission:
    """Create a new permission (admin only)."""
    permission = Permission(
        user_id=permission_data.user_id,
        resource_type=permission_data.resource_type,
        resource_id=permission_data.resource_id,
        action=permission_data.action,
        granted=permission_data.granted,
    )
    session.add(permission)
    session.commit()
    session.refresh(permission)

    logger.info(
        "permission_created",
        permission_id=permission.id,
        user_id=user_id,
    )

    return permission


@router.post("/bulk", response_model=List[PermissionRead], status_code=201)
def create_bulk_permissions(
    request: Request,
    bulk_data: PermissionBulkUpdate,
    session: Session = Depends(get_session),
    user_id: int = Depends(require_admin),
) -> List[Permission]:
    """Create multiple permissions at once (admin only)."""
    permissions = []
    for user_id_val in bulk_data.user_ids:
        permission = Permission(
            user_id=user_id_val,
            resource_type=bulk_data.resource_type,
            resource_id=bulk_data.resource_id,
            action=bulk_data.action,
            granted=bulk_data.granted,
        )
        session.add(permission)
        permissions.append(permission)

    session.commit()
    for perm in permissions:
        session.refresh(perm)

    logger.info(
        "permissions_created_bulk",
        count=len(permissions),
        user_id=user_id,
    )

    return permissions


@router.get("/{permission_id}", response_model=PermissionRead)
def get_permission(
    request: Request,
    permission_id: int,
    session: Session = Depends(get_session),
    user_id: int = Depends(get_current_user_id),
) -> Permission:
    """Get a specific permission."""
    permission = session.get(Permission, permission_id)
    if not permission:
        raise HTTPException(status_code=404, detail="Permission not found")
    return permission


@router.patch("/{permission_id}", response_model=PermissionRead)
def update_permission(
    request: Request,
    permission_id: int,
    permission_data: PermissionUpdate,
    session: Session = Depends(get_session),
    user_id: int = Depends(require_admin),
) -> Permission:
    """Update a permission (admin only)."""
    permission = session.get(Permission, permission_id)
    if not permission:
        raise HTTPException(status_code=404, detail="Permission not found")

    if permission_data.action:
        permission.action = permission_data.action
    if permission_data.granted is not None:
        permission.granted = permission_data.granted

    session.add(permission)
    session.commit()
    session.refresh(permission)

    logger.info(
        "permission_updated",
        permission_id=permission.id,
        user_id=user_id,
    )

    return permission


@router.delete("/{permission_id}", status_code=204)
def delete_permission(
    request: Request,
    permission_id: int,
    session: Session = Depends(get_session),
    user_id: int = Depends(require_admin),
) -> None:
    """Delete a permission (admin only)."""
    permission = session.get(Permission, permission_id)
    if not permission:
        raise HTTPException(status_code=404, detail="Permission not found")

    session.delete(permission)
    session.commit()

    logger.info(
        "permission_deleted",
        permission_id=permission_id,
        user_id=user_id,
    )


@router.get("/check/{user_id}/{resource_type}/{action}")
def check_permission(
    request: Request,
    user_id: int,
    resource_type: str,
    action: str,
    resource_id: Optional[str] = Query(None),
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id),
) -> dict:
    """Check if a user has a specific permission."""
    permission_service = PermissionService()
    # In real implementation, this would use the session to query DB
    # For now, use the service's check_permission method
    has_permission = permission_service.check_permission(
        user_id=user_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
    )

    return {
        "user_id": user_id,
        "resource_type": resource_type,
        "resource_id": resource_id,
        "action": action,
        "granted": has_permission,
    }

