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
from sqlalchemy import or_

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
    def create_orders_data_with_validation(db: Session, checkout: Checkout, user_id: str):
        # Idempotency: only PENDING checkout can create orders
        if getattr(checkout, "status", "").upper() != "PENDING":
            raise HTTPException(
                status_code=400,
                detail=f"Checkout {getattr(checkout, 'checkout_id', '')} status is {checkout.status}, cannot create orders again."
            )

        orders_data_without_price = OrderService.split_checkout_to_orders(checkout, db, user_id=user_id)
        orders_data = OrderService.add_calculate_order_amounts(db, orders_data=orders_data_without_price)
        created_orders = []

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
                country = checkout.country
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
                # TODO: book status need to be 'lent' or 'unlisted'?
                book = db.query(Book).filter(Book.id == item.book_id).first()
                if book:
                    book.status = "unlisted"
            created_orders.append(order)
        # checkout.status
        checkout.status = "COMPLETED"
        db.commit()
        return created_orders
    

    @staticmethod
    def get_orders_by_user(
        db: Session, 
        user_id: str, 
        status: Optional[str] = None, 
        skip: int = 0, 
        limit: int = 20
    ) -> List[dict]:
        query = db.query(Order).filter(Order.borrower_id == user_id)

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
                        "cover": ob.book.cover_img_url
                    })

            result.append({
                "order_id": order.id,
                "status": order.status,
                "total_paid_amount": float(order.total_paid_amount),
                "books": books_info    
            })
        return result
    
# ---------------- Added: state machine helper methods ----------------

    @staticmethod
    def set_initial_status_after_payment(db: Session, orders: List[Order]) -> None:
        """
        After successful payment and orders created, set all order statuses to PENDING_SHIPMENT.
        """
        for o in orders:
            o.status = "PENDING_SHIPMENT"
            db.add(o)
        db.commit()

    @staticmethod
    def mark_order_shipped(
        db: Session,
        order_id: str,
        carrier: str | None = None,
        tracking_number: str | None = None,
        tracking_url: str | None = None,
    ) -> Order:
        """
        Shipping: update shipping/tracking fields.
        - Borrow: status -> BORROWING, books -> lent, start_at = now
        - Purchase: keep PENDING_SHIPMENT (set to COMPLETED only after transfer), only record shipping info
        """
        order: Order | None = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")

        # Precondition: only allow transition from PENDING_SHIPMENT to shipping states
        if (order.action_type == "borrow" and order.status not in ("PENDING_SHIPMENT", "BORROWING")) \
           or (order.action_type == "purchase" and order.status != "PENDING_SHIPMENT"):
            raise HTTPException(status_code=409, detail=f"Invalid state transition for mark_shipped: {order.status}")

        # Write logistics info (idempotent safe)
        if carrier:
            order.shipping_out_carrier = carrier
        if tracking_number:
            order.shipping_out_tracking_number = tracking_number
        if tracking_url:
            order.shipping_out_tracking_url = tracking_url

        # Borrow: first time marking shipped → BORROWING + books set to lent + start_at
        if order.action_type == "borrow" and order.status == "PENDING_SHIPMENT":
            order.status = "BORROWING"
            order.start_at = datetime.now(timezone.utc)
            for ob in order.books:
                if ob.book:
                    ob.book.status = "lent"
                    db.add(ob.book)

        db.add(order)
        db.commit()
        db.refresh(order)
        return order

    @staticmethod
    def complete_purchase(db: Session, order_id: str) -> Order:
        """
        Purchase completed (after successful transfer): status -> COMPLETED, books -> sold, completed_at = now
        """
        order: Order | None = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        if order.action_type != "purchase":
            raise HTTPException(status_code=409, detail="Only purchase orders can be completed via this endpoint")
        if order.status != "PENDING_SHIPMENT":
            raise HTTPException(status_code=409, detail=f"Invalid state for purchase completion: {order.status}")

        order.status = "COMPLETED"
        order.completed_at = datetime.now(timezone.utc)
        for ob in order.books:
            if ob.book:
                ob.book.status = "sold"
                db.add(ob.book)
        db.add(order)
        db.commit()
        db.refresh(order)
        return order

    @staticmethod
    def complete_borrow(db: Session, order_id: str) -> Order:
        """
        Borrow return completed (after deposit refunded): status -> COMPLETED, books -> listed, completed_at = now
        """
        order: Order | None = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        if order.action_type != "borrow":
            raise HTTPException(status_code=409, detail="Only borrow orders can be returned via this endpoint")
        if order.status != "BORROWING":
            raise HTTPException(status_code=409, detail=f"Invalid state for borrow completion: {order.status}")

        order.status = "COMPLETED"
        order.completed_at = datetime.now(timezone.utc)
        for ob in order.books:
            if ob.book:
                ob.book.status = "listed"
                db.add(ob.book)
        db.add(order)
        db.commit()
        db.refresh(order)
        return order

