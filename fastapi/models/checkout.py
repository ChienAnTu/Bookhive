import uuid
from sqlalchemy import Column, String, Numeric, TIMESTAMP, ForeignKey, func
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from pydantic import BaseModel
from typing import Optional, List

Base = declarative_base()

# -------- SQLAlchemy Models --------
class Checkout(Base):
    __tablename__ = "checkout"

    checkout_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), nullable=False)

    # Address fields
    contact_name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=False)
    street = Column(String(255), nullable=False)
    city = Column(String(100), nullable=False)
    postcode = Column(String(10), nullable=False)
    country = Column(String(100), nullable=False)

    # Fee summary
    deposit = Column(Numeric(10, 2), default=0.00)
    service_fee = Column(Numeric(10, 2), default=0.00)
    shipping_fee = Column(Numeric(10, 2), default=0.00)
    total_due = Column(Numeric(10, 2), default=0.00)

    status = Column(String(20), default="PENDING")

    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    # Relationship: one checkout has many items
    items = relationship("CheckoutItem", back_populates="checkout", cascade="all, delete-orphan")


class CheckoutItem(Base):
    __tablename__ = "checkout_item"

    item_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    checkout_id = Column(String(36), ForeignKey("checkout.checkout_id"), nullable=False)
    book_id = Column(String(36), nullable=False)
    owner_id = Column(String(36), nullable=False)

    action_type = Column(String(20), nullable=False)  # BORROW / BUY
    price = Column(Numeric(10, 2), nullable=True)
    deposit = Column(Numeric(10, 2), nullable=True)

    shipping_method = Column(String(50), nullable=True)   # Delivery / Pickup
    shipping_quote = Column(Numeric(10, 2), nullable=True)

    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    checkout = relationship("Checkout", back_populates="items")

# -------- Pydantic Schemas --------
class CheckoutItemBase(BaseModel):
    book_id: str
    owner_id: str
    action_type: str
    price: Optional[float] = None
    deposit: Optional[float] = None
    shipping_method: Optional[str] = None
    shipping_quote: Optional[float] = None

class CheckoutItemCreate(CheckoutItemBase):
    pass

class CheckoutItemResponse(CheckoutItemBase):
    item_id: str
    created_at: str
    updated_at: str

    class Config:
        orm_mode = True


class CheckoutBase(BaseModel):
    user_id: str
    contact_name: str
    phone: str
    street: str
    city: str
    postcode: str
    country: str
    deposit: Optional[float] = 0.00
    service_fee: Optional[float] = 0.00
    shipping_fee: Optional[float] = 0.00
    total_due: Optional[float] = 0.00
    status: Optional[str] = "PENDING"

class CheckoutCreate(CheckoutBase):
    items: List[CheckoutItemCreate]

class CheckoutResponse(CheckoutBase):
    checkout_id: str
    created_at: str
    updated_at: str
    items: List[CheckoutItemResponse] = []

    class Config:
        orm_mode = True