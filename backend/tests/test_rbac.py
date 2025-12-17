from sqlmodel import Session, SQLModel, create_engine

from models.permission import Permission
from models.user import User
from services.permission_service import PermissionService


def _make_session() -> Session:
    engine = create_engine("sqlite://")
    SQLModel.metadata.create_all(engine)
    return Session(engine)


def test_permission_check_admin():
    with _make_session() as session:
        session.add(User(id=1, email="admin@example.com", password_hash="x", role="admin"))
        session.commit()

        service = PermissionService(session)
        assert (
            service.check_permission(
                user_id=1,
                action="delete",
                resource_type="project",
                resource_id="100",
            )
            is True
        )


def test_permission_check_restricted():
    with _make_session() as session:
        session.add(User(id=2, email="user2@example.com", password_hash="x", role="user"))
        session.add(
            Permission(
                user_id=2,
                resource_type="project",
                resource_id="100",
                action="read",
                granted=True,
            )
        )
        session.commit()

        service = PermissionService(session)

        assert (
            service.check_permission(
                user_id=2,
                action="read",
                resource_type="project",
                resource_id="100",
            )
            is True
        )

        assert (
            service.check_permission(
                user_id=2,
                action="delete",
                resource_type="project",
                resource_id="100",
            )
            is False
        )


def test_permission_check_denied():
    with _make_session() as session:
        service = PermissionService(session)
        assert (
            service.check_permission(
                user_id=99,
                action="read",
                resource_type="project",
            )
            is False
        )


def test_grant_permission():
    with _make_session() as session:
        session.add(User(id=3, email="user3@example.com", password_hash="x", role="user"))
        session.commit()

        service = PermissionService(session)
        perm = service.grant_permission(user_id=3, action="write", resource_type="prompt")
        assert perm.user_id == 3
        assert perm.action == "write"
        assert perm.granted is True

        persisted = session.get(Permission, perm.id)
        assert persisted is not None
