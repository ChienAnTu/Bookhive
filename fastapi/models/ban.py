from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.sql import func
from models.base import Base
import uuid

class Ban(Base):
    __tablename__ = "bans"

    ban_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(25), ForeignKey('users.user_id'), nullable=False)
    reason = Column(Text, nullable=False)
    banned_at = Column(DateTime, server_default=func.now(), nullable=False)
    banned_by = Column(String(25), ForeignKey('users.user_id'), nullable=False)
    is_active = Column(Boolean, default=True)
