import pytest
from services.permission_service import PermissionService

def test_permission_check_admin():
    service = PermissionService()
    # User 1 is admin in our simulation
    assert service.check_permission(user_id=1, action="delete", resource_type="project", resource_id="100") is True

def test_permission_check_restricted():
    service = PermissionService()
    # User 2 can read projects
    assert service.check_permission(user_id=2, action="read", resource_type="project", resource_id="100") is True
    # But cannot delete
    assert service.check_permission(user_id=2, action="delete", resource_type="project", resource_id="100") is False

def test_permission_check_denied():
    service = PermissionService()
    # User 99 has no permissions
    assert service.check_permission(user_id=99, action="read", resource_type="project") is False

def test_grant_permission():
    service = PermissionService()
    perm = service.grant_permission(user_id=3, action="write", resource_type="prompt")
    assert perm.user_id == 3
    assert perm.action == "write"
    assert perm.granted is True
