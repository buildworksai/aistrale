"""add encryption key management

Revision ID: f6e5d4c3b2a1
Revises: a1b2c3d4e5f6
Create Date: 2025-01-27 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f6e5d4c3b2a1'
down_revision: Union[str, Sequence[str], None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create encryption_key table
    op.create_table(
        'encryptionkey',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('key_id', sa.String(), nullable=False),
        sa.Column('encrypted_key', sa.String(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('rotated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_encryptionkey_key_id'), 'encryptionkey', ['key_id'], unique=True)
    op.create_index(op.f('ix_encryptionkey_is_active'), 'encryptionkey', ['is_active'], unique=False)
    
    # Add key_id to token table
    op.add_column('token', sa.Column('key_id', sa.String(), nullable=True, server_default='legacy'))
    
    # Migrate existing ENCRYPTION_KEY to first key record
    # This will be done in application code on startup if needed


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('token', 'key_id')
    op.drop_index(op.f('ix_encryptionkey_is_active'), table_name='encryptionkey')
    op.drop_index(op.f('ix_encryptionkey_key_id'), table_name='encryptionkey')
    op.drop_table('encryptionkey')

