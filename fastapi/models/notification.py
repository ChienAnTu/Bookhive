from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean
from sqlalchemy.sql import func
from .base import Base

class Notification(Base):
    __tablename__ = "notifications"

    notification_id = Column(String(25), primary_key=True, index=True)
    user_id = Column(String(25), ForeignKey("users.user_id"), nullable=False)
    title = Column(String(100), nullable=False)
    message = Column(String(500), nullable=False)
    notification_type = Column(String(50), nullable=False)
    is_read = Column(Boolean, default=False)
    timestamp = Column(DateTime, server_default=func.now(), nullable=False)
