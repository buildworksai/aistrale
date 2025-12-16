"""add_workspace_table

Revision ID: f1b539cd6b66
Revises: f6e5d4c3b2a1
Create Date: 2025-12-10 19:03:11.355369

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "f1b539cd6b66"
down_revision: Union[str, Sequence[str], None] = "f6e5d4c3b2a1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create workspace table."""
    # Check if table exists
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()

    if "workspace" not in tables:
        op.create_table(
            "workspace",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("name", sa.String(), nullable=False),
            sa.Column(
                "region", sa.String(), nullable=False, server_default="us-east-1"
            ),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                nullable=False,
                server_default=sa.text("(now() AT TIME ZONE 'utc'::text)"),
            ),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(
            op.f("ix_workspace_name"),
            "workspace",
            ["name"],
            unique=False)


def downgrade() -> None:
    """Drop workspace table."""
    op.drop_index(op.f("ix_workspace_name"), table_name="workspace")
    op.drop_table("workspace")
