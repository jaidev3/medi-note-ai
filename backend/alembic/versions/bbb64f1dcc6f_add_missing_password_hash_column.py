"""Add missing password_hash column to professional table

Revision ID: bbb64f1dcc6f
Revises: aaa63f0bcc5f
Create Date: 2025-01-10 18:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'bbb64f1dcc6f'
down_revision: Union[str, Sequence[str], None] = 'aaa63f0bcc5f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add password_hash column to professional table if it doesn't exist."""
    # Check if password_hash column already exists
    connection = op.get_bind()
    inspector = sa.inspect(connection)
    
    # Check if professional table exists first
    table_names = inspector.get_table_names()
    if 'professional' not in table_names:
        # Table doesn't exist yet, skip this migration (initial migration will handle it)
        return
    
    # Get columns for professional table
    columns = [col['name'] for col in inspector.get_columns('professional')]
    
    if 'password_hash' not in columns:
        # Only add if column doesn't exist
        op.add_column('professional', sa.Column('password_hash', sa.String(length=255), nullable=False, server_default=''))
        # Remove the server default after adding the column
        op.alter_column('professional', 'password_hash', server_default=None)
    # If column exists, this is a no-op (initial migration already created it)


def downgrade() -> None:
    """Remove password_hash column from professional table if it exists."""
    # Check if column exists before dropping
    connection = op.get_bind()
    inspector = sa.inspect(connection)
    
    # Check if professional table exists
    table_names = inspector.get_table_names()
    if 'professional' not in table_names:
        return
    
    columns = [col['name'] for col in inspector.get_columns('professional')]
    
    if 'password_hash' in columns:
        op.drop_column('professional', 'password_hash')
