## models/cart.py

import uuid
from datetime import datetime
from typing import List, Optional
from sqlalchemy import Column, String, DateTime, ForeignKey, DECIMAL, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from pydantic import BaseModel, Field

from models.base import Base

# --- ORM Models ---

ACTION_TYPE_ENUM = ("borrow", "purchase")

class Cart(Base):
    __tablename__ = "cart"

    cart_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(25), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    items = relationship("CartItem", back_populates="cart", cascade="all, delete-orphan")


class CartItem(Base):
    __tablename__ = "cart_item"

    cart_item_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    cart_id = Column(String(36), ForeignKey("cart.cart_id", ondelete="CASCADE"), nullable=False)
    book_id = Column(String(36), ForeignKey("book.id", ondelete="CASCADE"), nullable=False)
    owner_id = Column(String(25), ForeignKey("users.user_id"), nullable=False)
    action_type = Column(Enum(*ACTION_TYPE_ENUM, name="action_type_enum"), nullable=False)
    price = Column(DECIMAL(10, 2), nullable=True)
    deposit = Column(DECIMAL(10, 2), nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    cart = relationship("Cart", back_populates="items")

# --- Pydantic Schemas ---

class CartItemCreate(BaseModel):
    bookId: str
    ownerId: str
    actionType: str
    price: Optional[float] = None
    deposit: Optional[float] = None


class CartItemResponse(BaseModel):
    cartItemId: str = Field(..., alias="cart_item_id")
    cartId: str = Field(..., alias="cart_id")
    bookId: str = Field(..., alias="book_id")
    ownerId: str = Field(..., alias="owner_id")
    actionType: str = Field(..., alias="action_type")
    price: Optional[float] = None
    deposit: Optional[float] = None
    createdAt: datetime = Field(..., alias="created_at")

    class Config:
        from_attributes = True
        populate_by_name = True


class CartResponse(BaseModel):
    cartId: str = Field(..., alias="cart_id")
    userId: str = Field(..., alias="user_id")
    items: List[CartItemResponse] = []

    class Config:
        from_attributes = True
        populate_by_name = True

class CartItemUpdate(BaseModel):
    actionType: Optional[str] = None
    price: Optional[float] = None
    deposit: Optional[float] = None