import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from pydantic import BaseModel, Field

from models.base import Base


# --- ORM Models ---
class Review(Base):
    __tablename__ = "reviews"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id = Column(String(36), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    reviewer_id = Column(String(25), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True)
    reviewee_id = Column(String(25), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True)

    rating = Column(Integer, nullable=False)  # 1–5 stars
    comment = Column(Text, nullable=True)

    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    # Optional relationships
    order = relationship("Order", backref="reviews")
    reviewer = relationship("User", foreign_keys=[reviewer_id])
    reviewee = relationship("User", foreign_keys=[reviewee_id])


# --- Pydantic Schemas ---
class ReviewCreate(BaseModel):
    orderId: str
    reviewerId: str
    revieweeId: str
    rating: int
    comment: Optional[str] = None


class ReviewResponse(BaseModel):
    id: str
    orderId: str = Field(..., alias="order_id")
    reviewerId: str = Field(..., alias="reviewer_id")
    revieweeId: str = Field(..., alias="reviewee_id")
    rating: int
    comment: Optional[str] = None
    createdAt: datetime = Field(..., alias="created_at")

    class Config:
        from_attributes = True
        populate_by_name = True