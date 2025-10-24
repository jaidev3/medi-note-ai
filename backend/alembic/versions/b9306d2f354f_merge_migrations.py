"""merge migrations

Revision ID: b9306d2f354f
Revises: 477ed4484f77, b1c2d3e4f5g6
Create Date: 2025-10-24 23:13:37.109398

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b9306d2f354f'
down_revision: Union[str, Sequence[str], None] = ('477ed4484f77', 'b1c2d3e4f5g6')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
