from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean
from sqlalchemy.sql import func
from .base import Base

class Message(Base):
    __tablename__ = "messages"

    message_id = Column(String(25), primary_key=True, index=True)
    sender_id = Column(String(25), ForeignKey("users.user_id"), nullable=False)
    receiver_id = Column(String(25), ForeignKey("users.user_id"), nullable=False)
    content = Column(String(1000), nullable=False)
    timestamp = Column(DateTime, server_default=func.now(), nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)
