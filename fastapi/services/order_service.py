# ==================== Service Layer ====================

from sqlalchemy.orm import Session
from fastapi import HTTPException
from models.order import Order, OrderBook
from models.user import User
from models.book import Book
from typing import List, Tuple


class OrderBusinessService:
    """
    Order business logic service - handles validation and business rules
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
    
    
    def create_order_with_validation(self, order_data, current_user: User) -> Order:
        """
        Create order with full business validation
        
        Args:
            order_data: CreateOrderRequest data
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
        order = OrderService.create_order(
            owner_id=order_data.owner_id,
            borrower_id=order_data.borrower_id,
            book_ids=order_data.book_ids,
            delivery_method=order_data.delivery_method,
            deposit_amount=order_data.deposit_amount,
            service_fee_amount=order_data.service_fee_amount,
            shipping_out_fee_amount=order_data.shipping_out_fee_amount,
            sale_price_amount=order_data.sale_price_amount,
            notes=order_data.notes,
            # Address fields
            borrower_contact_name=order_data.borrower_contact_name,
            borrower_phone=getattr(order_data, 'borrower_phone', None),
            borrower_street=order_data.borrower_street,
            borrower_city=order_data.borrower_city,
            borrower_postcode=order_data.borrower_postcode,
            borrower_country=order_data.borrower_country,
            # Optional owner address fields
            owner_contact_name=getattr(order_data, 'owner_contact_name', None),
            owner_phone=getattr(order_data, 'owner_phone', None),
            owner_street=getattr(order_data, 'owner_street', None),
            owner_city=getattr(order_data, 'owner_city', None),
            owner_postcode=getattr(order_data, 'owner_postcode', None),
            owner_country=getattr(order_data, 'owner_country', None),
        )
        
        # Save to database
        self.db.add(order)
        self.db.commit()
        self.db.refresh(order)
        
        return order


class OrderService:
    """
    Order service for data conversion and order creation
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
    def create_order(owner_id: str, borrower_id: str, book_ids: List[str], 
                    delivery_method: str, **kwargs) -> Order:
        """
        Create new order with books using separated pricing logic
        """
        if not book_ids:
            raise ValueError("At least one book_id must be provided")
        
        # Extract pricing parameters
        sale_price_amount = kwargs.get('sale_price_amount')
        custom_deposit = kwargs.get('deposit_amount')
        custom_service_fee = kwargs.get('service_fee_amount')
        shipping_out_fee_amount = kwargs.get('shipping_out_fee_amount')
        
        # Calculate pricing using OrderPricing class
        deposit_amount = OrderPricing.calculate_deposit_amount(
            sale_price_amount=sale_price_amount,
            custom_deposit=custom_deposit
        )
        
        service_fee_amount = OrderPricing.calculate_service_fee(
            custom_service_fee=custom_service_fee
        )
        
        # Create order with calculated pricing
        order = Order(
            owner_id=owner_id,
            borrower_id=borrower_id,
            delivery_method=delivery_method,
            deposit_amount=deposit_amount,
            service_fee_amount=service_fee_amount,
            shipping_out_fee_amount=shipping_out_fee_amount,
            sale_price_amount=sale_price_amount,
            notes=kwargs.get('notes'),
            # Borrower address (required)
            borrower_contact_name=kwargs['borrower_contact_name'],
            borrower_phone=kwargs.get('borrower_phone'),
            borrower_street=kwargs['borrower_street'],
            borrower_city=kwargs['borrower_city'],
            borrower_postcode=kwargs['borrower_postcode'],
            borrower_country=kwargs['borrower_country'],
            # Owner address (optional)
            owner_contact_name=kwargs.get('owner_contact_name'),
            owner_phone=kwargs.get('owner_phone'),
            owner_street=kwargs.get('owner_street'),
            owner_city=kwargs.get('owner_city'),
            owner_postcode=kwargs.get('owner_postcode'),
            owner_country=kwargs.get('owner_country'),
        )
        
        # Add books to order
        for book_id in book_ids:
            order_book = OrderBook(book_id=book_id)
            order.books.append(order_book)
        
        # Calculate total paid amount
        order.total_paid_amount = OrderService.calculate_total(order)
        
        return order
    
    @staticmethod
    def calculate_total(order: Order) -> int:
        """
        Calculate the total amount paid for an order
        """
        total = order.service_fee_amount or 0

        if order.delivery_method != "pickup":
            if order.sale_price_amount:
                # Purchase order
                total += order.sale_price_amount
            else:
                # Lending order
                total += order.deposit_amount or 0

            if order.shipping_out_fee_amount:
                total += order.shipping_out_fee_amount

        # If pickup method, only return service fee
        return total
    
    @staticmethod
    def update_order_pricing(order: Order, **pricing_updates) -> Order:
        """
        Update order pricing with new fees or adjustments
        """
        # Update individual pricing fields
        for field, value in pricing_updates.items():
            if hasattr(order, field):
                setattr(order, field, value)
        
        # Recalculate total if any pricing fields were updated
        pricing_fields = {
            'deposit_amount', 'service_fee_amount', 'shipping_out_fee_amount',
            'sale_price_amount', 'late_fee_amount', 'damage_fee_amount'
        }
        
        if pricing_fields.intersection(pricing_updates.keys()):
            order.total_paid_amount = OrderService.calculate_total(order)
        
        return order