"""
Order model - supports multi-book orders matching frontend interface exactly
"""

import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, DateTime, Enum, ForeignKey, 
    Text, DECIMAL
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
SHIPPING_METHOD_ENUM = ("post", "pickup")

# Carrier options enum - matches frontend ShippingRef.carrier
CARRIER_ENUM = ("AUSPOST", "OTHER")

ORDER_TYPE_ENUM = ("borrow", "purchase")

class Order(Base):
    """
    Order table - matches frontend Order interface exactly
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
    
    action_type = Column(Enum(*ORDER_TYPE_ENUM, name="order_type_enum"), nullable=False)

    # Time tracking
    start_at = Column(DateTime, nullable=True)
    due_at = Column(DateTime, nullable=True)
    returned_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    canceled_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Delivery or pickup 
    shipping_method = Column(Enum(*SHIPPING_METHOD_ENUM, name="delivery_method_enum"), 
                           nullable=False)
    
    # Shipping Out info 
    shipping_out_carrier = Column(Enum(*CARRIER_ENUM, name="shipping_out_carrier_enum"), nullable=True)
    shipping_out_tracking_number = Column(String(100), nullable=True)
    shipping_out_tracking_url = Column(String(500), nullable=True)
    
    # Shipping Return info
    shipping_return_carrier = Column(Enum(*CARRIER_ENUM, name="shipping_return_carrier_enum"), nullable=True)
    shipping_return_tracking_number = Column(String(100), nullable=True)
    shipping_return_tracking_url = Column(String(500), nullable=True)
    
    # Pricing
    # Core pricing
    deposit_or_sale_amount = Column(DECIMAL(10, 2), nullable=False, default=0.00) 
    service_fee_amount = Column(DECIMAL(10, 2), nullable=False, default=0.00)
    shipping_out_fee_amount = Column(DECIMAL(10, 2), nullable=True)  # Optional
    
    # Totals
    total_paid_amount = Column(DECIMAL(10, 2), nullable=False, default=0.00)     # Initial payment
    total_refunded_amount = Column(DECIMAL(10, 2), nullable=True)             # What borrower got back

    # Post-return adjustments
    late_fee_amount = Column(DECIMAL(10, 2), nullable=True)
    damage_fee_amount = Column(DECIMAL(10, 2), nullable=True)
    

    
    # Address info for delivery (borrower's address)
    contact_name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=True)
    street = Column(String(255), nullable=False)
    city = Column(String(50), nullable=False)
    postcode = Column(String(20), nullable=False)
    country = Column(String(50), nullable=False, default="Australia")
    
    # Notes
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
    order_id = Column(String(36), ForeignKey("orders.id", ondelete="CASCADE"), primary_key=True)
    book_id = Column(String(36), ForeignKey("book.id", ondelete="CASCADE"), primary_key=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    # Relationships
    order = relationship("Order", back_populates="books")
    book = relationship("Book")