"""add_project_and_permission_tables

Revision ID: 47f60d855c9e
Revises: f1b539cd6b66
Create Date: 2025-12-10 19:08:50.951866

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "47f60d855c9e"
down_revision: str | Sequence[str] | None = "f1b539cd6b66"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Create project and permission tables."""
    # Check if tables exist
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()

    # Create project table
    if "project" not in tables:
        op.create_table(
            "project",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("name", sa.String(), nullable=False),
            sa.Column("workspace_id", sa.Integer(), nullable=False),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                nullable=False,
                server_default=sa.text("(now() AT TIME ZONE 'utc'::text)"),
            ),
            sa.ForeignKeyConstraint(["workspace_id"], ["workspace.id"]),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(
            op.f("ix_project_name"),
            "project",
            ["name"],
            unique=False)
        op.create_index(
            op.f("ix_project_workspace_id"),
            "project",
            ["workspace_id"],
            unique=False)

    # Create permission table
    if "permission" not in tables:
        op.create_table(
            "permission",
            sa.Column(
                "id",
                sa.Integer(),
                nullable=False),
            sa.Column(
                "user_id",
                sa.Integer(),
                nullable=False),
            sa.Column(
                "resource_type",
                sa.String(),
                nullable=False),
            sa.Column(
                "resource_id",
                sa.String(),
                nullable=True),
            sa.Column(
                "action",
                sa.String(),
                nullable=False),
            sa.Column(
                "granted",
                sa.Boolean(),
                nullable=False,
                server_default=sa.text("true")),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(
            op.f("ix_permission_user_id"),
            "permission",
            ["user_id"],
            unique=False)
        op.create_index(
            op.f("ix_permission_resource_type"),
            "permission",
            ["resource_type"],
            unique=False,
        )
        op.create_index(
            op.f("ix_permission_resource_id"),
            "permission",
            ["resource_id"],
            unique=False,
        )
        op.create_index(
            op.f("ix_permission_action"),
            "permission",
            ["action"],
            unique=False)


def downgrade() -> None:
    """Drop project and permission tables."""
    op.drop_index(op.f("ix_permission_action"), table_name="permission")
    op.drop_index(op.f("ix_permission_resource_id"), table_name="permission")
    op.drop_index(op.f("ix_permission_resource_type"), table_name="permission")
    op.drop_index(op.f("ix_permission_user_id"), table_name="permission")
    op.drop_table("permission")
    op.drop_index(op.f("ix_project_workspace_id"), table_name="project")
    op.drop_index(op.f("ix_project_name"), table_name="project")
    op.drop_table("project")
