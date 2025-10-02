"""Add text extraction fields to uploaded_documents

Revision ID: ccc65f2dcc7f
Revises: bbb64f1dcc6f
Create Date: 2025-08-11 18:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'ccc65f2dcc7f'
down_revision = 'bbb64f1dcc6f'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add text extraction fields to uploaded_documents table
    op.add_column('uploaded_documents', sa.Column('extracted_text', sa.Text(), nullable=True))
    op.add_column('uploaded_documents', sa.Column('text_extracted', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('uploaded_documents', sa.Column('word_count', sa.Integer(), nullable=True))
    op.add_column('uploaded_documents', sa.Column('processing_status', sa.String(length=50), nullable=False, server_default='pending'))
    op.add_column('uploaded_documents', sa.Column('processed_at', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    # Remove text extraction fields from uploaded_documents table
    op.drop_column('uploaded_documents', 'processed_at')
    op.drop_column('uploaded_documents', 'processing_status')
    op.drop_column('uploaded_documents', 'word_count')
    op.drop_column('uploaded_documents', 'text_extracted')
    op.drop_column('uploaded_documents', 'extracted_text')
