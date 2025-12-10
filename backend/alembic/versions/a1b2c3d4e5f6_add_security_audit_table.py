"""add security audit table

Revision ID: a1b2c3d4e5f6
Revises: de9c1517c9c5
Create Date: 2025-01-27 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = 'de9c1517c9c5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'securityaudit',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('event_type', sa.String(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('ip_address', sa.String(), nullable=False),
        sa.Column('user_agent', sa.String(), nullable=True),
        sa.Column('details', postgresql.JSON(astext_type=sa.Text()), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['user.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_securityaudit_event_type'), 'securityaudit', ['event_type'], unique=False)
    op.create_index(op.f('ix_securityaudit_user_id'), 'securityaudit', ['user_id'], unique=False)
    op.create_index(op.f('ix_securityaudit_created_at'), 'securityaudit', ['created_at'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_securityaudit_created_at'), table_name='securityaudit')
    op.drop_index(op.f('ix_securityaudit_user_id'), table_name='securityaudit')
    op.drop_index(op.f('ix_securityaudit_event_type'), table_name='securityaudit')
    op.drop_table('securityaudit')

