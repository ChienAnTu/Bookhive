from sqlalchemy import Column, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.sql import func
from models.base import Base
import uuid

class Blacklist(Base):
    __tablename__ = "blacklists"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(25), ForeignKey('users.user_id'), nullable=False)
    blocked_user_id = Column(String(25), ForeignKey('users.user_id'), nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    __table_args__ = (UniqueConstraint('user_id', 'blocked_user_id', name='uq_user_blocked'),)
