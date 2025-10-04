"""sync database with current models

Revision ID: 1f7403afebc7
Revises: 
Create Date: 2025-09-18 08:03:10.116795

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision: str = '1f7403afebc7'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
   

    op.drop_constraint('PRIMARY', 'order_books', type_='primary')
    
    # 2. 删除列
    op.drop_column('order_books', 'id')
    op.drop_column('order_books', 'created_at')
    
    # 3. 创建新的复合主键
    op.create_primary_key(None, 'order_books', ['order_id', 'book_id'])



def downgrade() -> None:
    """Downgrade schema."""
    # 1. 删除复合主键
    op.drop_constraint(None, 'order_books', type_='primary')
    
    # 2. 添加列
    op.add_column('order_books', sa.Column('created_at', mysql.DATETIME(), server_default=sa.text('(now())'), nullable=False))
    op.add_column('order_books', sa.Column('id', mysql.VARCHAR(collation='utf8mb4_unicode_ci', length=36), nullable=False))
    
    # 3. 重新创建原来的主键
    op.create_primary_key('PRIMARY', 'order_books', ['id'])
    
    # 4. 重新创建索引
    op.create_index(op.f('uq_order_book'), 'order_books', ['order_id', 'book_id'], unique=True)
    op.create_index(op.f('ix_order_books_order_id'), 'order_books', ['order_id'], unique=False)
    op.create_index(op.f('ix_order_books_book_id'), 'order_books', ['book_id'], unique=False)

    # ### end Alembic commands ###
