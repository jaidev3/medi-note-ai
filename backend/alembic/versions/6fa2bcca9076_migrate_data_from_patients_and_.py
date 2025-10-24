"""Migrate data from patients and professional tables to users table

Revision ID: 6fa2bcca9076
Revises: a210d5660c59
Create Date: 2025-10-24 22:23:39.052555

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6fa2bcca9076'
down_revision: Union[str, Sequence[str], None] = 'a210d5660c59'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Since the old tables were already dropped in the previous migration,
    # this migration is a placeholder for future data migration if needed.
    # The actual data migration would need to be done from database backups
    # or other data sources if the original tables no longer exist.

    # For now, this migration is effectively a no-op since there's no data to migrate.
    # If you need to migrate data, you would need to:
    # 1. Restore the old tables from a database backup
    # 2. Update this migration to properly handle the data transfer
    # 3. Or create a separate data import script

    # Log that this migration ran but didn't perform data migration
    op.execute("DO $$ BEGIN RAISE NOTICE 'Data migration skipped - old tables no longer exist'; END $$;")


def downgrade() -> None:
    """Downgrade schema."""
    # Since this migration was a no-op (no data was migrated),
    # the downgrade is also a no-op.
    op.execute("DO $$ BEGIN RAISE NOTICE 'Data migration downgrade - no action taken'; END $$;")
