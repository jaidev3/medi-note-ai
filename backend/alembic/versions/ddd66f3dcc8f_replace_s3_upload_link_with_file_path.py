"""Replace s3_upload_link with file_path

Revision ID: ddd66f3dcc8f
Revises: ccc65f2dcc7f
Create Date: 2025-10-12 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ddd66f3dcc8f'
down_revision: Union[str, None] = 'ccc65f2dcc7f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Replace s3_upload_link column with file_path column.
    
    This migration:
    1. Adds new file_path column
    2. Migrates existing s3_upload_link data to file_path (if any exists)
    3. Drops s3_upload_link column
    """
    # Add new file_path column (nullable initially to allow data migration)
    op.add_column(
        'uploaded_documents',
        sa.Column('file_path', sa.Text(), nullable=True)
    )
    
    # Migrate data: Convert S3 URLs to placeholder local paths
    # This is a simplified migration - you may need to adjust based on your data
    op.execute("""
        UPDATE uploaded_documents
        SET file_path = CONCAT('app/data/documents/', session_id::text, '/', document_id::text, '_', document_name)
        WHERE s3_upload_link IS NOT NULL
    """)
    
    # Make file_path NOT NULL now that data is migrated
    op.alter_column('uploaded_documents', 'file_path', nullable=False)
    
    # Drop the old s3_upload_link column
    op.drop_column('uploaded_documents', 's3_upload_link')


def downgrade() -> None:
    """
    Restore s3_upload_link column (reverse migration).
    
    WARNING: This will lose the file_path data and restore placeholder S3 URLs.
    """
    # Add back s3_upload_link column (nullable initially)
    op.add_column(
        'uploaded_documents',
        sa.Column('s3_upload_link', sa.TEXT(), nullable=True)
    )
    
    # Migrate data back: Create placeholder S3 URLs
    op.execute("""
        UPDATE uploaded_documents
        SET s3_upload_link = CONCAT('s3://echo-notes-documents/documents/', session_id::text, '/', document_id::text, '_', document_name)
        WHERE file_path IS NOT NULL
    """)
    
    # Make s3_upload_link NOT NULL
    op.alter_column('uploaded_documents', 's3_upload_link', nullable=False)
    
    # Drop file_path column
    op.drop_column('uploaded_documents', 'file_path')
