"""Initial migration

Revision ID: 5cc54ac1772d
Revises:
Create Date: 2025-12-04 20:46:28.071951

"""

from collections.abc import Sequence
from typing import Union

import sqlalchemy as sa
import sqlmodel
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "5cc54ac1772d"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Check if tables exist before trying to alter/create them
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()
    
    # Create user table if it doesn't exist (base table for foreign keys)
    if "user" not in tables:
        op.create_table(
            "user",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("email", sa.String(), nullable=False),
            sa.Column("password_hash", sa.String(), nullable=False),
            sa.Column("role", sa.String(), nullable=False, server_default="user"),
            sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
            sa.Column("created_at", postgresql.TIMESTAMP(), nullable=False, server_default=sa.text("(now() AT TIME ZONE 'utc'::text)")),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(op.f("ix_user_email"), "user", ["email"], unique=True)
    
    # Create token table if it doesn't exist
    if "token" not in tables:
        op.create_table(
            "token",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("user_id", sa.Integer(), nullable=False),
            sa.Column("provider", sa.String(), nullable=False),
            sa.Column("encrypted_token", sa.String(), nullable=False),
            sa.Column("label", sa.String(), nullable=False),
            sa.Column("is_default", sa.Boolean(), nullable=False, server_default=sa.text("false")),
            sa.Column("created_at", postgresql.TIMESTAMP(), nullable=False, server_default=sa.text("(now() AT TIME ZONE 'utc'::text)")),
            sa.ForeignKeyConstraint(["user_id"], ["user.id"]),
            sa.PrimaryKeyConstraint("id"),
        )
    
    # Create telemetry table if it doesn't exist
    # Note: cost and prompt_id are added by later migration de9c1517c9c5
    if "telemetry" not in tables:
        op.create_table(
            "telemetry",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("user_id", sa.Integer(), nullable=False),
            sa.Column("model", sa.String(), nullable=False),
            sa.Column("sdk", sa.String(), nullable=False),
            sa.Column("input_summary", sa.String(), nullable=False),
            sa.Column("execution_time_ms", sa.Float(), nullable=False),
            sa.Column("status", sa.String(), nullable=False),
            sa.Column("error_message", sa.String(), nullable=True),
            sa.Column("timestamp", postgresql.TIMESTAMP(), nullable=False, server_default=sa.text("(now() AT TIME ZONE 'utc'::text)")),
            sa.Column("input_tokens", sa.Integer(), nullable=True),
            sa.Column("output_tokens", sa.Integer(), nullable=True),
            sa.ForeignKeyConstraint(["user_id"], ["user.id"]),
            sa.PrimaryKeyConstraint("id"),
        )
    
    if "chatmessage" in tables:
        # Table exists, alter it
        op.alter_column(
            "chatmessage",
            "content",
            existing_type=sa.TEXT(),
            type_=sqlmodel.sql.sqltypes.AutoString(),
            existing_nullable=False,
        )
        op.alter_column(
            "chatmessage",
            "created_at",
            existing_type=postgresql.TIMESTAMP(),
            nullable=False,
            existing_server_default=sa.text("(now() AT TIME ZONE 'utc'::text)"),
        )
    else:
        # Table doesn't exist, create it
        # Only create foreign key if user table exists
        fk_constraint = []
        if "user" in tables:
            fk_constraint = [sa.ForeignKeyConstraint(["user_id"], ["user.id"])]
        
        op.create_table(
            "chatmessage",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("user_id", sa.Integer(), nullable=False),
            sa.Column("role", sa.String(), nullable=False),
            sa.Column("content", sa.String(), nullable=False),
            sa.Column("created_at", postgresql.TIMESTAMP(), nullable=False, server_default=sa.text("(now() AT TIME ZONE 'utc'::text)")),
            *fk_constraint,
            sa.PrimaryKeyConstraint("id"),
        )
    
    # Ensure token.is_default has correct default
    if "token" in tables:
        columns = [col["name"] for col in inspector.get_columns("token")]
        if "is_default" in columns:
            op.alter_column(
                "token",
                "is_default",
                existing_type=sa.BOOLEAN(),
                nullable=False,
                server_default=sa.text("false"),
            )


def downgrade() -> None:
    """Downgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.alter_column(
        "token",
        "is_default",
        existing_type=sa.BOOLEAN(),
        nullable=True,
        existing_server_default=sa.text("false"),
    )
    op.alter_column(
        "chatmessage",
        "created_at",
        existing_type=postgresql.TIMESTAMP(),
        nullable=True,
        existing_server_default=sa.text("(now() AT TIME ZONE 'utc'::text)"),
    )
    op.alter_column(
        "chatmessage",
        "content",
        existing_type=sqlmodel.sql.sqltypes.AutoString(),
        type_=sa.TEXT(),
        existing_nullable=False,
    )
    # ### end Alembic commands ###
