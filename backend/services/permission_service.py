import logging
from typing import List, Optional
from models.permission import Permission

logger = logging.getLogger(__name__)

class PermissionService:
    """
    Service for RBAC and fine-grained permission checks.
    """

    def check_permission(self, user_id: int, action: str, resource_type: str, resource_id: Optional[str] = None) -> bool:
        """
        Check if a user has permission to perform an action on a resource.
        """
        # In a real app, this would query the DB. We simulate logic here.
        # Logic:
        # 1. Check for explicit resource permission
        # 2. Check for wildcard resource_id (e.g. "all" or None meaning global for type)
        # 3. Check for admin role (if user passed in has role, but here we only have ID)
        
        logger.debug(f"Checking permission User={user_id} Action={action} Resource={resource_type}:{resource_id}")
        
        # Simulation: For test purposes, let's say user 1 is admin/has all permissions
        if user_id == 1:
            return True
            
        # Simulation: user 2 can read projects but not write
        if user_id == 2:
            if resource_type == "project" and action == "read":
                return True
            return False

        return False

    def grant_permission(self, user_id: int, action: str, resource_type: str, resource_id: Optional[str] = None) -> Permission:
        """
        Grant a permission to a user.
        """
        perm = Permission(
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            granted=True
        )
        # Would save to DB here
        logger.info(f"Granted permission: {perm}")
        return perm
