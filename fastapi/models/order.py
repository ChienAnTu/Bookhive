"""
Order model - supports multi-book orders matching frontend interface
"""

import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, DateTime, Enum, ForeignKey, 
    Integer, Text, UniqueConstraint
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from models.base import Base

# Order status enum - matches frontend OrderStatus
ORDER_STATUS_ENUM = (
    "PENDING_PAYMENT",
    "PENDING_SHIPMENT", 
    "BORROWING",
    "OVERDUE",
    "RETURNED",
    "COMPLETED",
    "CANCELED"
)

# Delivery method enum - matches frontend DeliveryMethod
DELIVERY_METHOD_ENUM = ("post", "pickup")

# Carrier options enum - matches frontend ShippingRef.carrier
CARRIER_ENUM = ("AUSPOST", "OTHER")


class Order(Base):
    """
    Order table - matches frontend Order interface
    """
    __tablename__ = "orders"
    
    # Core fields
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    owner_id = Column(String(25), ForeignKey("users.user_id", ondelete="CASCADE"), 
             nullable=False, index=True)
    borrower_id = Column(String(25), ForeignKey("users.user_id", ondelete="CASCADE"), 
                    nullable=False, index=True)
    status = Column(Enum(*ORDER_STATUS_ENUM, name="order_status_enum"), 
                   nullable=False, default="PENDING_PAYMENT", index=True)
    
    # Time fields - matching frontend Order
    start_at = Column(DateTime, nullable=True)
    due_at = Column(DateTime, nullable=True)
    returned_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    canceled_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Delivery method
    delivery_method = Column(Enum(*DELIVERY_METHOD_ENUM, name="delivery_method_enum"), 
                           nullable=False)
    
    # Shipping tracking - matching frontend Order.shippingOut
    shipping_out_carrier = Column(Enum(*CARRIER_ENUM, name="shipping_out_carrier_enum"), nullable=True)
    shipping_out_tracking_number = Column(String(100), nullable=True)
    shipping_out_tracking_url = Column(String(500), nullable=True)
    
    # Return shipping tracking - matching frontend Order.shippingReturn
    shipping_return_carrier = Column(Enum(*CARRIER_ENUM, name="shipping_return_carrier_enum"), nullable=True)
    shipping_return_tracking_number = Column(String(100), nullable=True)
    shipping_return_tracking_url = Column(String(500), nullable=True)

    # Borrower shipping info
    contact_name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=True)
    street = Column(String(255), nullable=False)
    city = Column(String(50), nullable=False)
    postcode = Column(String(20), nullable=False)
    country = Column(String(50), nullable=False)
            
    # Pricing in cents - matching frontend Money type
    deposit_amount = Column(Integer, nullable=False, default=0)
    service_fee_amount = Column(Integer, nullable=False, default=0)
    shipping_out_fee_amount = Column(Integer, nullable=True)
    sale_price_amount = Column(Integer, nullable=True)
    late_fee_amount = Column(Integer, nullable=True)
    damage_fee_amount = Column(Integer, nullable=True)
    total_paid_amount = Column(Integer, nullable=False, default=0)
    total_refunded_amount = Column(Integer, nullable=True)
    
    # Notes - matching frontend Order.notes
    notes = Column(Text, nullable=True)
    
    # Relationships
    books = relationship("OrderBook", back_populates="order", cascade="all, delete-orphan")
    owner = relationship("User", foreign_keys=[owner_id])
    borrower = relationship("User", foreign_keys=[borrower_id])


class OrderBook(Base):
    """
    Order-Book association table for multi-book orders
    """
    __tablename__ = "order_books"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id = Column(String(36), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    book_id = Column(String(36), ForeignKey("book.id", ondelete="CASCADE"), 
                    nullable=False, index=True)
    
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    
    # Ensure no duplicate books in same order
    __table_args__ = (
        UniqueConstraint('order_id', 'book_id', name='uq_order_book'),
    )
    
    # Relationships
    order = relationship("Order", back_populates="books")
    book = relationship("Book")