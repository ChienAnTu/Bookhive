from sqlalchemy import Column, String, Text, DateTime, Enum, ForeignKey
from sqlalchemy.sql import func
from models.base import Base

COMPLAINT_STATUS_ENUM = ("pending", "investigating", "resolved", "closed")
COMPLAINT_TYPE_ENUM   = ("book-condition", "delivery", "user-behavior", "other")

class Complaint(Base):
    __tablename__ = "complaint"

    id              = Column(String(36), primary_key=True)
    order_id        = Column(String(36), nullable=True)  # TODO: Modify when order list/table is created
    complainant_id  = Column(String(25), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True)
    respondent_id   = Column(String(25), ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True, index=True)

    type            = Column(Enum(*COMPLAINT_TYPE_ENUM, name="complaint_type_enum"), nullable=False)
    subject         = Column(String(255), nullable=False)
    description     = Column(Text, nullable=False)

    status          = Column(Enum(*COMPLAINT_STATUS_ENUM, name="complaint_status_enum"), nullable=False, default="pending", index=True)
    admin_response  = Column(Text, nullable=True)

    created_at      = Column(DateTime, server_default=func.now(), nullable=False, index=True)
    updated_at      = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

class ComplaintMessage(Base):
    __tablename__ = "complaint_message"

    id           = Column(String(36), primary_key=True)
    complaint_id = Column(String(36), ForeignKey("complaint.id", ondelete="CASCADE"), nullable=False, index=True)
    sender_id    = Column(String(25), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True)
    body         = Column(Text, nullable=False)
    created_at   = Column(DateTime, server_default=func.now(), nullable=False)
