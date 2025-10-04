"""fix updated_at on update behavior

Revision ID: 69513e069445
Revises: f11528226ca3
Create Date: 2025-09-18 08:24:26.844363

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '69513e069445'
down_revision: Union[str, Sequence[str], None] = 'f11528226ca3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
