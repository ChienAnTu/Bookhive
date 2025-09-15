from sqlalchemy.orm import Session
from fastapi import HTTPException
from models.order import Order, OrderBook
from models.user import User
from models.book import Book
from typing import List, Tuple, Optional, Literal, Dict, Any
from pydantic import BaseModel
from datetime import datetime, timezone

class CreateOrderRequestData(BaseModel):
    owner_id: str
    borrower_id: str
    book_ids: List[str]

    # delivery method
    delivery_method: Literal["post", "pickup"]

    # pricing (required fields)
    service_fee_amount: int
    total_paid_amount: int
    
    # pricing (optional fields - can be None for different business scenarios)
    deposit_amount: Optional[int] = None  # None for purchase-only orders
    shipping_out_fee_amount: Optional[int] = None
    sale_price_amount: Optional[int] = None
    notes: Optional[str] = None

    # address (borrower's delivery address)
    contact_name: str
    phone: Optional[str] = None
    street: str
    city: str
    postcode: str
    country: str = "Australia"


class OrderBusinessService:
    """
    Order business logic service - handles validation, business rules, and complex operations
    """
    
    def __init__(self, db: Session):
        self.db = db
    
    def validate_users(self, owner_id: str, borrower_id: str, current_user: User) -> Tuple[User, User]:
        """
        Validate owner and borrower users
        
        Returns:
            tuple: (owner, borrower)
            
        Raises:
            HTTPException: If validation fails
        """
        # Check if borrower is current user
        if current_user.user_id != borrower_id:
            raise HTTPException(
                status_code=403, 
                detail="You are not allowed to create an order for another user"
            )
        
        # Validate users exist
        owner = self.db.query(User).filter(User.user_id == owner_id).first()
        borrower = self.db.query(User).filter(User.user_id == borrower_id).first()

        if not owner:
            raise HTTPException(status_code=404, detail="The owner doesn't exist")
        if not borrower:
            raise HTTPException(status_code=404, detail="The borrower doesn't exist")
            
        return owner, borrower
    
    def validate_books(self, book_ids: List[str], owner_id: str) -> List[Book]:
        """
        Validate books for the order
        
        Args:
            book_ids: List of book IDs
            owner_id: Expected owner ID
            
        Returns:
            list: List of Book objects
            
        Raises:
            HTTPException: If validation fails
        """
        # Check books exist
        books = self.db.query(Book).filter(Book.id.in_(book_ids)).all()
        if len(books) != len(book_ids):
            raise HTTPException(status_code=404, detail="Part of books doesn't exist")
        
        # Check books belong to one owner
        book_owners = set(book.owner_id for book in books)
        if len(book_owners) > 1:
            raise HTTPException(
                status_code=400, 
                detail="Cannot borrow books from different owners in the same order"
            )
        
        if owner_id not in book_owners:
            raise HTTPException(
                status_code=400, 
                detail="The owner of the book does not match the owner of the order"
            )
        
        # Check book availability
        unavailable_books = [book.title_en for book in books if book.status != 'listed']
        if unavailable_books:
            raise HTTPException(
                status_code=400, 
                detail=f"The following books are not available for borrowing: {', '.join(unavailable_books)}"
            )
        
        return books
    
    def create_order_with_validation(self, order_data: CreateOrderRequestData, current_user: User) -> Order:
        """
        Create order with full business validation
        
        Args:
            order_data: CreateOrderRequestData
            current_user: Current authenticated user
            
        Returns:
            Order: Created order instance
            
        Raises:
            HTTPException: If validation fails
        """
        # Validate users
        owner, borrower = self.validate_users(
            order_data.owner_id, 
            order_data.borrower_id, 
            current_user
        )
        
        # Validate books
        books = self.validate_books(order_data.book_ids, order_data.owner_id)
        
        # Create order using OrderService
        order = OrderService.create_order(order_data)
        
        # Save to database
        self.db.add(order)
        self.db.commit()
        self.db.refresh(order)
        
        return order

    def get_user_orders_paginated(
        self, 
        current_user: User, 
        page: int = 1, 
        page_size: int = 20, 
        status_filter: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Get paginated orders for current user with business logic
        """
        # Build base query - users can only see orders they're involved in
        query = self.db.query(Order).filter(
            (Order.owner_id == current_user.user_id) | 
            (Order.borrower_id == current_user.user_id)
        )
        
        # Apply filters
        if status_filter:
            query = query.filter(Order.status == status_filter)
        
        # Get pagination data
        total = query.count()
        offset = (page - 1) * page_size
        orders = query.offset(offset).limit(page_size).all()
        
        # Convert to frontend format
        order_dicts = [OrderService.to_frontend_dict(order) for order in orders]
        
        return {
            "orders": order_dicts,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size
        }

    def get_order_by_id(self, order_id: str, current_user: User) -> Order:
        """
        Get order by ID with permission check
        """
        order = self.db.query(Order).filter(Order.id == order_id).first()
        
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        # Check permission - user must be owner or borrower
        if order.owner_id != current_user.user_id and order.borrower_id != current_user.user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        return order

    def set_order_status(self, order: Order, new_status: str) -> Order:
        """
        Common method: Update status and timestamps
        """
        order.status = new_status
        now = datetime.now(timezone.utc)
        
        if new_status == "BORROWING":
            order.start_at = now
            # TODO: Calculate due_at based on book lending periods
        elif new_status == "RETURNED":
            order.returned_at = now
        elif new_status == "COMPLETED":
            order.completed_at = now
        elif new_status == "CANCELED":
            order.canceled_at = now
        
        self.db.commit()
        self.db.refresh(order)
        return order

    def update_order_status(self, order_id: str, new_status: str, current_user: User) -> Order:
        """
        Update order status with business logic validation
        """
        order = self.get_order_by_id(order_id, current_user)
        # TODO: Add status transition validation logic here
        return self.set_order_status(order, new_status)

    def cancel_order(self, order_id: str, current_user: User) -> Order:
        """
        Cancel order with business validation
        """
        order = self.get_order_by_id(order_id, current_user)
        
        # Only borrower can cancel
        if order.borrower_id != current_user.user_id:
            raise HTTPException(status_code=403, detail="Only borrower can cancel order")
        
        # Check if order can be canceled
        if order.status not in ["PENDING_PAYMENT", "PENDING_SHIPMENT"]:
            raise HTTPException(
                status_code=400, 
                detail=f"Cannot cancel order with status {order.status}"
            )
        
        return self.set_order_status(order, "CANCELED")

    def get_user_borrowing_orders(self, current_user: User) -> List[Dict[str, Any]]:
        """
        Get user's borrowing orders (where user is borrower)
        """
        orders = self.db.query(Order).filter(
            Order.borrower_id == current_user.user_id
        ).order_by(Order.created_at.desc()).all()
        
        return [OrderService.to_frontend_dict(order) for order in orders]

    def get_user_lending_orders(self, current_user: User) -> List[Dict[str, Any]]:
        """
        Get user's lending orders (where user is owner)
        """
        orders = self.db.query(Order).filter(
            Order.owner_id == current_user.user_id
        ).order_by(Order.created_at.desc()).all()
        
        return [OrderService.to_frontend_dict(order) for order in orders]
    
    def get_orders_by_book_id(self, book_id: str, current_user: User) -> List[Dict[str, Any]]:
        """
        Get all historical and current orders for a certain book
        """
        # Query all orders including this book
        orders = self.db.query(Order).join(OrderBook).filter(
            OrderBook.book_id == book_id
        ).order_by(Order.created_at.desc()).all()
        
        # Users can only view orders related to themselves
        user_orders = [
            order for order in orders 
            if order.owner_id == current_user.user_id or order.borrower_id == current_user.user_id
        ]
        
        return [OrderService.to_frontend_dict(order) for order in user_orders]

    def get_active_orders_by_book_id(self, book_id: str, current_user: User) -> List[Dict[str, Any]]:
        """
        Get the ongoing order for a certain book
        """
        active_statuses = ["PENDING_PAYMENT", "PENDING_SHIPMENT", "BORROWING", "OVERDUE"]
        
        orders = self.db.query(Order).join(OrderBook).filter(
            OrderBook.book_id == book_id,
            Order.status.in_(active_statuses)
        ).order_by(Order.created_at.desc()).all()
        
        user_orders = [
            order for order in orders 
            if order.owner_id == current_user.user_id or order.borrower_id == current_user.user_id
        ]
        
        return [OrderService.to_frontend_dict(order) for order in user_orders]


class OrderService:
    """
    Order service for data conversion and order creation
    """
    
    @staticmethod
    def to_frontend_dict(order: Order) -> dict:
        """
        Convert Order to frontend format matching Order interface exactly
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
        
        # Build result matching frontend Order interface exactly
        result = {
            "id": str(order.id),
            "ownerId": str(order.owner_id),
            "borrowerId": str(order.borrower_id),
            "bookIds": [str(book.book_id) for book in order.books],
            "status": order.status,
            "createdAt": to_iso_string(order.created_at),
            "updatedAt": to_iso_string(order.updated_at),
            "deliveryMethod": order.delivery_method,
            
            # Required Money fields - handle None values appropriately
            "deposit": {"amount": order.deposit_amount or 0},  # Handle None case for purchase-only orders
            "serviceFee": {"amount": order.service_fee_amount},
            "totalPaid": {"amount": order.total_paid_amount},
        }
        
        # Add optional time fields
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
            
        # Add optional shipping fields
        if shipping_out:
            result["shippingOut"] = shipping_out
        if shipping_return:
            result["shippingReturn"] = shipping_return
            
        # Add optional Money fields
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
            
        # Add optional notes
        if order.notes:
            result["notes"] = order.notes
            
        return result
    
    @staticmethod
    def create_order(order_data: CreateOrderRequestData) -> Order:
        """
        Create new order from validated CreateOrderRequestData
        
        Args:
            order_data: CreateOrderRequestData object containing all order information
            
        Returns:
            Order: Created order instance
            
        Raises:
            ValueError: If validation fails
        """
        if not order_data.book_ids:
            raise ValueError("At least one book_id must be provided")
        
        # Create order matching your model structure exactly
        order = Order(
            owner_id=order_data.owner_id,
            borrower_id=order_data.borrower_id,
            delivery_method=order_data.delivery_method,
            
            # Required pricing fields
            service_fee_amount=order_data.service_fee_amount,
            total_paid_amount=order_data.total_paid_amount,
            
            # Optional pricing fields (can be None)
            deposit_amount=order_data.deposit_amount,  # Can be None for purchase-only
            shipping_out_fee_amount=order_data.shipping_out_fee_amount,
            sale_price_amount=order_data.sale_price_amount,
            notes=order_data.notes,

            # Address fields (borrower's delivery address)
            contact_name=order_data.contact_name,
            phone=order_data.phone,
            street=order_data.street,
            city=order_data.city,
            postcode=order_data.postcode,
            country=order_data.country,
        )

        # Add books to the order
        for book_id in order_data.book_ids:
            order.books.append(OrderBook(order_id=order.id, book_id=book_id))
        
        return order