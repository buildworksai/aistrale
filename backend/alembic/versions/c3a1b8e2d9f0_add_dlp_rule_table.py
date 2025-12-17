"""add dlp rule table

Revision ID: c3a1b8e2d9f0
Revises: 47f60d855c9e
Create Date: 2025-12-17 00:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "c3a1b8e2d9f0"
down_revision: str | Sequence[str] | None = "47f60d855c9e"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Create DLPRule table."""
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()

    if "dlprule" not in tables:
        op.create_table(
            "dlprule",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("name", sa.String(), nullable=False),
            sa.Column("pattern", sa.String(), nullable=False),
            sa.Column("action", sa.String(), nullable=False, server_default="warn"),
            sa.Column(
                "is_active",
                sa.Boolean(),
                nullable=False,
                server_default=sa.text("true"),
            ),
            sa.Column(
                "priority",
                sa.Integer(),
                nullable=False,
                server_default=sa.text("0"),
            ),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(op.f("ix_dlprule_name"), "dlprule", ["name"], unique=False)


def downgrade() -> None:
    """Drop DLPRule table."""
    op.drop_index(op.f("ix_dlprule_name"), table_name="dlprule")
    op.drop_table("dlprule")
