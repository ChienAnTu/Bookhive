from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean
from sqlalchemy.sql import func
from .base import Base

class Message(Base):
    __tablename__ = "messages"

    message_id = Column(String(25), primary_key=True, index=True)
    sender_id = Column(String(25), ForeignKey("users.user_id"), nullable=False)
    receiver_id = Column(String(25), ForeignKey("users.user_id"), nullable=False)
    # Text content of the message; may be null when sending image-only messages
    content = Column(String(1000), nullable=True)
    # Relative public path under /media for an attached image (e.g., /media/messageAttachments/{user_id}/{file})
    image_path = Column(String(255), nullable=True)
    timestamp = Column(DateTime, server_default=func.now(), nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)
