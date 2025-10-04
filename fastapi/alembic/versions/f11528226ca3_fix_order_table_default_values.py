"""fix order table default values

Revision ID: f11528226ca3
Revises: 1f7403afebc7
Create Date: 2025-09-18 08:17:27.762883

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f11528226ca3'
down_revision: Union[str, Sequence[str], None] = '1f7403afebc7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 修复 Orders 表的默认值
    op.alter_column('orders', 'status',
                   existing_type=sa.Enum('PENDING_PAYMENT','PENDING_SHIPMENT','BORROWING','OVERDUE','RETURNED','COMPLETED','CANCELED'),
                   server_default='PENDING_PAYMENT')
    
    op.alter_column('orders', 'service_fee_amount',
                   existing_type=sa.DECIMAL(10, 2),
                   server_default='0.00')
    
    op.alter_column('orders', 'total_paid_amount',
                   existing_type=sa.DECIMAL(10, 2),
                   server_default='0.00')
    
    op.alter_column('orders', 'deposit_or_sale_amount',
                   existing_type=sa.DECIMAL(10, 2),
                   server_default='0.00')
    
    op.alter_column('orders', 'country',
                   existing_type=sa.String(50),
                   server_default='Australia')

def downgrade() -> None:
    # 回滚：移除默认值
    op.alter_column('orders', 'country',
                   existing_type=sa.String(50),
                   server_default=None)
    
    op.alter_column('orders', 'deposit_or_sale_amount',
                   existing_type=sa.DECIMAL(10, 2),
                   server_default=None)
    
    op.alter_column('orders', 'total_paid_amount',
                   existing_type=sa.DECIMAL(10, 2),
                   server_default=None)
    
    op.alter_column('orders', 'service_fee_amount',
                   existing_type=sa.DECIMAL(10, 2),
                   server_default=None)
    
    op.alter_column('orders', 'status',
                   existing_type=sa.Enum('PENDING_PAYMENT','PENDING_SHIPMENT','BORROWING','OVERDUE','RETURNED','COMPLETED','CANCELED'),
                   server_default=None)