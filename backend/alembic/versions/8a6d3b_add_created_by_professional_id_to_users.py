"""add created_by_professional_id to users

Revision ID: 8a6d3b_add_created_by_professional_id_to_users
Revises: b9306d2f354f_merge_migrations
Create Date: 2025-10-24 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '8a6d3b'
down_revision = 'b9306d2f354f'
branch_labels = None
depends_on = None


def upgrade():
    # Add column
    op.add_column('users', sa.Column('created_by_professional_id', postgresql.UUID(as_uuid=True), nullable=True))
    # Add FK constraint to users.id (self-referential)
    op.create_foreign_key(
        'fk_users_created_by_professional_id_users',
        'users', 'users', ['created_by_professional_id'], ['id'], ondelete='SET NULL'
    )


def downgrade():
    # Drop FK then column
    op.drop_constraint('fk_users_created_by_professional_id_users', 'users', type_='foreignkey')
    op.drop_column('users', 'created_by_professional_id')
