"""change embedding dimension to 768

Revision ID: a1b2c3d4e5f6
Revises: 5dbbc5ec085f
Create Date: 2025-10-13 14:50:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from pgvector.sqlalchemy import vector


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '5dbbc5ec085f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - change embedding dimension from 1536 to 768."""
    # Drop the existing index first
    op.drop_index('ix_notes_embedding_cosine', table_name='session_soap_notes', postgresql_using='ivfflat')
    
    # Drop the existing embedding column
    op.drop_column('session_soap_notes', 'embedding')
    
    # Add the new embedding column with 768 dimensions
    op.add_column('session_soap_notes', 
                  sa.Column('embedding', vector.VECTOR(dim=768), nullable=True))
    
    # Recreate the index
    op.create_index('ix_notes_embedding_cosine', 'session_soap_notes', ['embedding'], 
                    unique=False, postgresql_using='ivfflat', 
                    postgresql_ops={'embedding': 'vector_cosine_ops'})


def downgrade() -> None:
    """Downgrade schema - change embedding dimension back from 768 to 1536."""
    # Drop the existing index first
    op.drop_index('ix_notes_embedding_cosine', table_name='session_soap_notes', postgresql_using='ivfflat')
    
    # Drop the 768-dim embedding column
    op.drop_column('session_soap_notes', 'embedding')
    
    # Add back the 1536-dim embedding column
    op.add_column('session_soap_notes', 
                  sa.Column('embedding', vector.VECTOR(dim=1536), nullable=True))
    
    # Recreate the index
    op.create_index('ix_notes_embedding_cosine', 'session_soap_notes', ['embedding'], 
                    unique=False, postgresql_using='ivfflat', 
                    postgresql_ops={'embedding': 'vector_cosine_ops'})
