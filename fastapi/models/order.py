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
    
    # Delivery - matching frontend Order.deliveryMethod
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


class OrderService:
    """
    Order service for data conversion and business logic
    """
    
    @staticmethod
    def to_frontend_dict(order: Order) -> dict:
        """
        Convert Order to frontend format
        """
        # Build ShippingRef objects
        shipping_out = None
        if order.shipping_out_tracking_number:
            shipping_out = {
                "carrier": order.shipping_out_carrier,
                "trackingNumber": order.shipping_out_tracking_number,
                "trackingUrl": order.shipping_out_tracking_url,
            }
            
        shipping_return = None
        if order.shipping_return_tracking_number:
            shipping_return = {
                "carrier": order.shipping_return_carrier,
                "trackingNumber": order.shipping_return_tracking_number,
                "trackingUrl": order.shipping_return_tracking_url,
            }
        
        # Convert datetime to ISO string
        def to_iso_string(dt):
            return dt.isoformat() + 'Z' if dt else None
        
        # Build result matching frontend Order interface
        result = {
            "id": str(order.id),
            "ownerId": str(order.owner_id),
            "borrowerId": str(order.borrower_id),
            "bookIds": [str(book.book_id) for book in order.books],
            "status": order.status,
            "createdAt": to_iso_string(order.created_at),
            "updatedAt": to_iso_string(order.updated_at),
            "deliveryMethod": order.delivery_method,
            "deposit": {"amount": order.deposit_amount},
            "serviceFee": {"amount": order.service_fee_amount},
            "totalPaid": {"amount": order.total_paid_amount},
        }
        
        # Add optional fields
        if order.start_at:
            result["startAt"] = to_iso_string(order.start_at)
        if order.due_at:
            result["dueAt"] = to_iso_string(order.due_at)
        if order.returned_at:
            result["returnedAt"] = to_iso_string(order.returned_at)
        if order.completed_at:
            result["completedAt"] = to_iso_string(order.completed_at)
        if order.canceled_at:
            result["canceledAt"] = to_iso_string(order.canceled_at)
            
        if shipping_out:
            result["shippingOut"] = shipping_out
        if shipping_return:
            result["shippingReturn"] = shipping_return
            
        if order.shipping_out_fee_amount:
            result["shippingOutFee"] = {"amount": order.shipping_out_fee_amount}
        if order.sale_price_amount:
            result["salePrice"] = {"amount": order.sale_price_amount}
        if order.late_fee_amount:
            result["lateFee"] = {"amount": order.late_fee_amount}
        if order.damage_fee_amount:
            result["damageFee"] = {"amount": order.damage_fee_amount}
        if order.total_refunded_amount:
            result["totalRefunded"] = {"amount": order.total_refunded_amount}
            
        if order.notes:
            result["notes"] = order.notes
            
        return result
    
    @staticmethod
    def create_order(owner_id: str, borrower_id: str, book_ids: list, 
                delivery_method: str, **kwargs) -> Order:
        """
        Create new order with books
        """
        sale_price_amount = kwargs.get('sale_price_amount')
        
        order = Order(
            owner_id=owner_id,
            borrower_id=borrower_id,
            delivery_method=delivery_method,
            deposit_amount=kwargs.get('deposit_amount', 0) if not sale_price_amount else 0,  # 购买时无押金
            service_fee_amount=kwargs.get('service_fee_amount', 200),  # $2.00 default
            shipping_out_fee_amount=kwargs.get('shipping_out_fee_amount'),
            sale_price_amount=sale_price_amount,
            notes=kwargs.get('notes'),
        )
        
        # Add books to order
        for book_id in book_ids:
            order_book = OrderBook(book_id=book_id)
            order.books.append(order_book)
        
        # Calculate total paid (initial payment)
        total = order.service_fee_amount
        
        if order.sale_price_amount:
            # purchase
            total += order.sale_price_amount
        else:
            # lending
            total += order.deposit_amount
        
        if order.shipping_out_fee_amount:
            total += order.shipping_out_fee_amount
            
        order.total_paid_amount = total
        
        return order