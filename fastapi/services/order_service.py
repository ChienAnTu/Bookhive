from sqlalchemy.orm import Session
from fastapi import HTTPException
from models.order import Order, OrderBook
from models.user import User
from models.book import Book
from models.checkout import Checkout, CheckoutItem
from typing import List, Dict, Optional
from pydantic import BaseModel
from datetime import datetime, timezone
from collections import defaultdict
from models.service_fee import ServiceFee
from services.cart_service import remove_cart_items_by_book_ids
from models.complaint import Complaint
from sqlalchemy import or_
from services.complaint_service import ComplaintService
from typing import Set

class OrderService:
    """
    Order business logic service - handles validation, business rules, and complex operations
    """
    def __init__(self, db: Session):
        self.db = db


    @staticmethod
    def validate_checkout_item(checkout_item: CheckoutItem, db: Session, user_id: str) -> None:
   
        book: Book = db.query(Book).filter(Book.id == checkout_item.book_id).first()
        if not book:
            raise HTTPException(
                status_code=404,
                detail=f"Book with id {checkout_item.book_id} not found"
            )

        if book.status != "listed":
            raise HTTPException(
                status_code=400,
                detail=f"Book '{book.title_en}' is not available (status={book.status})"
            )

        if checkout_item.action_type.lower() == "borrow" and not book.can_rent:
            raise HTTPException(
                status_code=400,
                detail=f"Book '{book.title_en}' cannot be borrowed"
            )

        if checkout_item.action_type.lower() == "purchase" and not book.can_sell:
            raise HTTPException(
                status_code=400,
                detail=f"Book '{book.title_en}' cannot be purchased"
            )
        
        # cannot place orders for books that you have published yourself
        if checkout_item.owner_id == user_id:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot create an order for your own book '{book.title_en}'"
            )

    @staticmethod
    def split_checkout_to_orders(checkout: Checkout, db: Session, user_id: str):
        """
        Group the Checkout items by owner action_type to generate the order list 
        and verify whether each book is valid before grouping.

        Returns:
            order_data (List[List[CheckoutItem]]): 
                A list of "orders", where each inner list contains CheckoutItem objects 
                belonging to the same owner and action type. 
                Example structure:

                [
                    [CheckoutItem1, CheckoutItem2],  # owner1 borrow
                    [CheckoutItem3],                  # owner1 purchase
                    [CheckoutItem4],                  # owner2 borrow
                    [CheckoutItem5]                   # owner2 purchase
                ]
        """
        groups = defaultdict(list)

        for item in checkout.items:
            # validate books
            OrderService.validate_checkout_item(item, db, user_id=user_id)  
            
            # Group by owner_id and action_type
            key = (item.owner_id, item.action_type.lower())
            groups[key].append(item)

        # transfer to list
        orders_data = list(groups.values())
        return orders_data

    @staticmethod
    def _calculate_service_fee(db: Session, base_amount: float) -> float:
        """
        Calculate service fee
        """
        fee_rule = (
            db.query(ServiceFee)
            .filter(ServiceFee.status == True)
            .order_by(ServiceFee.created_at.desc())
            .first()
        )
        if not fee_rule:
            return 0.0

        if fee_rule.fee_type.upper() == "FIXED":
            return float(fee_rule.value)
        elif fee_rule.fee_type.upper() == "PERCENT":
            return base_amount * float(fee_rule.value) / 100.0
        else:
            return 0.0

    
    @staticmethod
    def add_calculate_order_amounts(db: Session, orders_data: List[List[CheckoutItem]]) -> List[Dict]:
        """
        For each group of CheckoutItems (owner + action_type), calculate amounts
        and return a dict that contains:
            - items: List[CheckoutItem]
            - deposit_or_sale_amount
            - service_fee_amount
            - shipping_out_fee_amount
            - order_total

        Return examples:
            [
                {
                    "items": [CheckoutItem(ci1), CheckoutItem(ci2)],  # borrow, owner1
                    "deposit_or_sale_amount": 25.0,                   # 10 + 15
                    "service_fee_amount": 5.0,                        # checkout.service_fee
                    "shipping_out_fee_amount": 3.0,                   # first post shipping_quote
                    "order_total": 33.0                                # 25 + 5 + 3
                },
                {
                    "items": [CheckoutItem(ci3)],                     # purchase, owner1
                    "deposit_or_sale_amount": 20.0,                   # purchase price
                    "service_fee_amount": 5.0,
                    "shipping_out_fee_amount": 0.0,                   # pickup, no shipping
                    "order_total": 25.0                                # 20 + 5 + 0
                },
                {
                    "items": [CheckoutItem(ci4)],                     # purchase, owner2
                    "deposit_or_sale_amount": 25.0,                   # purchase price
                    "service_fee_amount": 5.0,
                    "shipping_out_fee_amount": 4.0,                   # post shipping
                    "order_total": 34.0                                # 25 + 5 + 4
                }
            ]
        """
        results = []

        for order_items in orders_data:
            if not order_items:
                continue

            deposit_or_sale_amount = 0
            shipping_out_fee_amount = 0

            # Calculate deposit or sale price
            for item in order_items:
                if item.action_type.lower() == "purchase":
                    # for purchasing, use price
                    deposit_or_sale_amount += float(item.price or 0)
                elif item.action_type.lower() == "borrow":
                    # for borrowing, use deposit
                    deposit_or_sale_amount += float(item.deposit or 0)

            # Calculate shipping fee
            post_items = [item for item in order_items if item.shipping_method.lower() == "delivery"]
            if post_items:
                # Multiple items only post once
                # if pickup, shipping_out_fee_amount = 0
                shipping_out_fee_amount = float(post_items[0].shipping_quote or 0)

            # Calculate service fee for each order
            service_fee_amount = OrderService._calculate_service_fee(db, deposit_or_sale_amount)

            # keep original item
            results.append({
                "items": order_items,  # Keep CheckoutItem 
                "deposit_or_sale_amount": deposit_or_sale_amount,
                "service_fee_amount": service_fee_amount,
                "shipping_out_fee_amount": shipping_out_fee_amount,
                "order_total": deposit_or_sale_amount + service_fee_amount + shipping_out_fee_amount
            })

        return results
    
    @staticmethod
    def create_orders_data_with_validation(db: Session, checkout_id: str, user_id: str, payment_id: str):
        checkout = db.query(Checkout).filter(Checkout.checkout_id == checkout_id).first()
        if not checkout:
            raise HTTPException(status_code=404, detail=f"Checkout {checkout_id} not found")
        if checkout.user_id != user_id:
            raise HTTPException(status_code=403, detail="Access denied: Checkout does not belong to this user")
    
        orders_data_without_price = OrderService.split_checkout_to_orders(checkout, db, user_id=user_id)
        orders_data = OrderService.add_calculate_order_amounts(db, orders_data=orders_data_without_price)
        created_orders = []
        all_book_ids = set() # for remove items later
        for order_info in orders_data:
            items = order_info["items"]
            first_item = items[0]

            # Create order obj
            order = Order(
                owner_id = first_item.owner_id,
                borrower_id = checkout.user_id,
                action_type = first_item.action_type.lower(),
                shipping_method = "post" if first_item.shipping_method.lower() == "delivery" else "pickup",
                deposit_or_sale_amount = order_info["deposit_or_sale_amount"],
                service_fee_amount = order_info["service_fee_amount"],
                shipping_out_fee_amount = order_info["shipping_out_fee_amount"],
                total_paid_amount = order_info["order_total"],
                contact_name = checkout.contact_name,
                phone = checkout.phone,
                street = checkout.street,
                city = checkout.city,
                postcode = checkout.postcode,
                country = checkout.country,

                # new fields
                estimated_delivery_time = first_item.estimated_delivery_time,
                payment_id = payment_id,
            )
            db.add(order)
            db.flush()

            # Create OrderBook entries
            for item in items:
                order_book = OrderBook(
                    order_id=order.id,
                    book_id=item.book_id
                )
                db.add(order_book)

                # Update book status to 'unlisted'
                book = db.query(Book).filter(Book.id == item.book_id).first()
                if book:
                    book.status = "unlisted"
                    all_book_ids.add(book.id)
            created_orders.append(order)
        # checkout.status
        checkout.status = "COMPLETED"
        db.commit()

        # remove items from cart
        current_user = db.query(User).filter(User.user_id == user_id).first()
        try:
            remove_cart_items_by_book_ids(db, book_ids=list(all_book_ids), current_user=current_user)
        except Exception as e:
            print(f"Failed to clear cart items after checkout: {e}")
        return created_orders
    

    @staticmethod
    def get_orders_by_user(
        db: Session, 
        user_id: str, 
        status: Optional[str] = None, 
        skip: int = 0, 
        limit: int = 20
    ) -> List[dict]:
        
        user = db.query(User).filter(User.user_id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        if user.is_admin:
            query = db.query(Order)
        else:
            query = db.query(Order).filter(
                or_(
                    Order.borrower_id == user_id,
                    Order.owner_id == user_id
                )
            )

        if status:
            query = query.filter(Order.status == status)

        orders = query.offset(skip).limit(limit).all()  
        result = []

        for order in orders:
            books_info = []
            for ob in order.books:
                if ob.book:
                    books_info.append({
                        "title": ob.book.title_or,
                        "cover": ob.book.cover_img_url,
                    })

            result.append({
                "order_id": order.id,
                "status": order.status,
                "total_paid_amount": float(order.total_paid_amount),
                "books": books_info,
                "create_at": order.created_at,
                "due_at": order.due_at,
            })
        return result
    
    @staticmethod
    def get_order_detail(db: Session, order_id: str, current_user: User) -> Optional[Dict]:
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            return None    
        if not current_user.is_admin and order.borrower_id != current_user.user_id and order.owner_id != current_user.user_id:
            raise HTTPException(status_code=403, detail="Not authorized to view this order")
        return order.to_dict(include_books = True)

        
    @staticmethod
    def cancel_order(db: Session, order_id: str, current_user: User) -> bool:
        """
        Cancel an order if it's in a cancellable state
        
        Args:
            db: Database session
            order_id: Order ID to cancel
            current_user: User
            
        Returns:
            bool: True if cancellation was successful
            
        Raises:
            HTTPException: If order not found, unauthorized, or not cancellable
        """
        order = db.query(Order).filter(Order.id == order_id).first()
        
        if not order:
            raise HTTPException(
                status_code=404,
                detail="Order not found"
            )
        
        # Check authorization - only borrower can cancel their order
        if order.borrower_id != current_user.user_id and not current_user.is_admin:
            raise HTTPException(
                status_code=403,
                detail="Not authorized to cancel this order"
            )
        
        # Check if order can be cancelled
        cancellable_statuses = ["PENDING_PAYMENT", "PENDING_SHIPMENT"]
        if order.status not in cancellable_statuses:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot cancel order with status '{order.status}'. Only orders with status {cancellable_statuses} can be cancelled."
            )
        
        # Update order status to CANCELED
        order.status = "CANCELED"
        order.canceled_at = datetime.now(timezone.utc)
        
        # Restore book availability - set books back to 'listed' status
        for order_book in order.books:
            if order_book.book:
                book = db.query(Book).filter(Book.id == order_book.book_id).first()
                if book.status == "unlisted":
                    book.status = "listed"
        
        db.commit()
        return True

    @staticmethod
    def get_user_tracking_numbers(
        db: Session,
        current_user: User,
        target_user_id: Optional[str] = None
    ) -> List[Dict[str, Optional[str]]]:
        """
        Return AUPOST shipping out and return tracking numbers per order for a user.
        Each item includes order_id and tracking numbers (or None if not AUPOST).

        Example:
        [
            {
                "order_id": "ORD123",
                "shipping_out_tracking_number": "OUT123",
                "shipping_return_tracking_number": "RET123"
            },
            ...
        ]
        """
        user_id = target_user_id or current_user.user_id

        # authorization check: allow if admin or user querying themselves
        if not current_user.is_admin and current_user.user_id != user_id:
            raise HTTPException(status_code=403, detail="Not authorized")

        orders = db.query(Order).filter(
            (Order.borrower_id == user_id) | (Order.owner_id == user_id)
        ).all()

        result = []
        for order in orders:
            out_num = order.shipping_out_tracking_number if order.shipping_out_carrier == "AUSPOST" else None
            return_num = order.shipping_return_tracking_number if order.shipping_return_carrier == "AUSPOST" else None

            # Only include if at least one AUPOST tracking number exists
            if out_num or return_num:
                result.append({
                    "order_id": order.id,
                    "shipping_out_tracking_number": out_num,
                    "shipping_return_tracking_number": return_num,
                })

        return result
    





    # order status service
    @staticmethod
    def confirm_payment(db: Session, order_id: str) -> bool:
        """
        Confirm payment received, transition PENDING_PAYMENT → PENDING_SHIPMENT
        """
        order = db.query(Order).filter(Order.id == order_id).first()
        
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")

        if order.status != "PENDING_PAYMENT":
            raise HTTPException(
                status_code=400,
                detail=f"Cannot confirm payment for order with status '{order.status}'"
            )
        
        order.status = "PENDING_SHIPMENT"
        db.commit()
        db.refresh(order)
        return True
    

    @staticmethod
    def confirm_shipment(
        db: Session, 
        order_id: str, 
        current_user: User,
        tracking_number: str,
        carrier: str
    ) -> bool:
        """
        Confirm shipment with tracking number and carrier
        
        Logic:
            - If status is PENDING_SHIPMENT -> update shipping_out_* (outbound, owner confirms)
            - If status is BORROWING or OVERDUE -> update shipping_return_* (return, borrower confirms)
        """
        order = db.query(Order).filter(Order.id == order_id).first()
        
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        # Validate carrier
        carrier_upper = carrier.upper()
        if carrier_upper not in ["AUSPOST", "OTHER"]:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid carrier '{carrier}'. Must be 'AUSPOST' or 'OTHER'"
            )
        
        # Check status and permissions
        if order.status == "PENDING_SHIPMENT":
            # Outbound: only owner can confirm
            if order.owner_id != current_user.user_id and not current_user.is_admin:
                raise HTTPException(status_code=403, detail="Only owner can confirm outbound shipment")
            
            # Update outbound tracking
            order.shipping_out_carrier = carrier_upper
            order.shipping_out_tracking_number = tracking_number
            
            # Calculate start_at and due_at
            from datetime import timedelta
            now = datetime.now(timezone.utc)
            
            order.start_at = now + timedelta(days=order.estimated_delivery_time or 3)
            
            max_lending_days = max(
                (ob.book.max_lending_days for ob in order.books if ob.book and ob.book.max_lending_days),
                default=20
            )
            order.due_at = order.start_at + timedelta(days=max_lending_days)
            
        elif order.status in ["BORROWING", "OVERDUE"]:
            # Return: only borrower can confirm
            if order.borrower_id != current_user.user_id and not current_user.is_admin:
                raise HTTPException(status_code=403, detail="Only borrower can confirm return shipment")
            
            # Update return tracking
            order.shipping_return_carrier = carrier_upper
            order.shipping_return_tracking_number = tracking_number

            # Update status to RETURNED
            order.status = "RETURNED"
            order.returned_at = datetime.now(timezone.utc)
                
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot confirm shipment for status '{order.status}'. Valid: PENDING_SHIPMENT, BORROWING, OVERDUE"
            )

        db.commit()
        db.refresh(order)
        return True


    @staticmethod
    def update_borrowing_status(db: Session) -> int:
        """
        Background task: Update orders to BORROWING when start_at is reached
        Should be run periodically (e.g., every hour)
        
        Returns: number of orders updated
        """
        now = datetime.now(timezone.utc)
        
        orders = db.query(Order).filter(
            Order.status == "PENDING_SHIPMENT",
            Order.start_at <= now,
            Order.start_at.isnot(None)
        ).all()
        
        count = 0
        for order in orders:
            order.status = "BORROWING"
            count += 1
        
        db.commit()
        return count



    @staticmethod
    def update_overdue_status(db: Session) -> int:
        """
        Background task: Update orders to OVERDUE when due_at is passed
        Should be run periodically (e.g., every hour)
        
        Returns: number of orders updated
        """

        now = datetime.now(timezone.utc)
        
        orders = db.query(Order).filter(
            Order.status == "BORROWING",
            Order.due_at.isnot(None),
            Order.due_at <= now
        ).all()

        if not orders:
            return 0
        

        order_ids = [o.id for o in orders]

        # Find existing overdue orders, avoiding repeated creating complaints
        existing = (
            db.query(Complaint.order_id)
              .filter(
                  Complaint.order_id.in_(order_ids),
                  Complaint.status.in_(("pending", "investigating")),
              )
              .all()
        )
        existed_ids: Set[str] = {row[0] for row in existing}
        
        count = 0
        try:
            for order in orders:
                if order.id not in existed_ids:
                # create new complaint
                    ComplaintService.create(
                        db=db,
                        complainant_id=order.owner_id, 
                        respondent_id=order.borrower_id,  
                        order_id=order.id,
                        type="other",  
                        subject=f"Order {order.id} is overdue",
                        description=f"This order was due on {order.due_at} but has not been returned.",
                        commit=False
                    )
                    
                order.status = "OVERDUE"
                count += 1
                
            db.commit()
            return count
        except Exception:
            db.rollback()
            raise

    @staticmethod
    def update_completed_status(db: Session) -> int:
        """
        Background task: Update orders to COMPLETED when returned package is delivered
        Transition: RETURNED -> COMPLETED after estimated_delivery_time
        
        Returns: number of orders updated
        """
        from datetime import timedelta
        now = datetime.now(timezone.utc)
        
        orders = db.query(Order).filter(
            Order.status == "RETURNED",
            Order.returned_at.isnot(None)
        ).all()
        
        count = 0
        for order in orders:
            # Calculate expected delivery date: returned_at + estimated_delivery_time
            delivery_time = order.estimated_delivery_time or 3
            expected_delivery = order.returned_at + timedelta(days=delivery_time)
            
            if now >= expected_delivery:
                order.status = "COMPLETED"
                order.completed_at = now
                count += 1
        
        db.commit()
        return count
    