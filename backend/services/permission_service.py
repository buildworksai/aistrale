import logging

from sqlmodel import Session, select

from models.permission import Permission
from models.user import User

logger = logging.getLogger(__name__)


class PermissionService:
    """
    Service for RBAC and fine-grained permission checks.
    """

    def __init__(self, session: Session):
        self._session = session

    def check_permission(
        self,
        user_id: int,
        action: str,
        resource_type: str,
        resource_id: str | None = None,
    ) -> bool:
        """
        Check if a user has permission to perform an action on a resource.
        """
        # In a real app, this would query the DB. We simulate logic here.
        # Logic:
        # 1. Check for explicit resource permission
        # 2. Check for wildcard resource_id (e.g. "all" or None meaning global for type)
        # 3. Check for admin role (if user passed in has role, but here we only
        # have ID)

        logger.debug(
            "Checking permission User=%s Action=%s Resource=%s:%s",
            user_id,
            action,
            resource_type,
            resource_id,
        )

        user = self._session.get(User, user_id)
        if user and user.role == "admin":
            return True

        query = select(Permission).where(
            Permission.user_id == user_id,
            Permission.resource_type == resource_type,
            Permission.action == action,
            Permission.granted.is_(True),
        )

        permissions = self._session.exec(query).all()
        if not permissions:
            return False

        if resource_id is None:
            return any(
                p.resource_id is None or p.resource_id == "all" for p in permissions
            )

        return any(p.resource_id in (resource_id, "all") for p in permissions)

    def grant_permission(
        self,
        user_id: int,
        action: str,
        resource_type: str,
        resource_id: str | None = None,
    ) -> Permission:
        """
        Grant a permission to a user.
        """
        perm = Permission(
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            granted=True,
        )
        self._session.add(perm)
        self._session.commit()
        self._session.refresh(perm)
        logger.info("Granted permission: %s", perm)
        return perm
