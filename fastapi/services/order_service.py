from sqlalchemy.orm import Session
from fastapi import HTTPException
from models.order import Order, OrderBook
from models.user import User
from models.book import Book
from models.cart import CartItem, Cart
from models.checkout import Checkout, CheckoutItem
from cart_service import get_cart_with_items
from typing import List, Dict, Tuple, Optional, Literal, Any
from pydantic import BaseModel
from datetime import datetime, timezone
from collections import defaultdict


class OrderService:
    """
    Order business logic service - handles validation, business rules, and complex operations
    """
    def __init__(self, db: Session):
        self.db = db

    def validate_owner(self, owner_id: int, borrower_id: int) -> None:
        if owner_id == borrower_id:
            raise HTTPException(status_code=400, detail="Owner and borrower cannot be the same")

    
    @staticmethod
    def validate_checkout_item(checkout_item: CheckoutItem, db: Session) -> None:
   
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

    def split_checkout_to_orders(checkout: Checkout, db: Session):
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
            OrderService.validate_checkout_item(item, db)  
            
            # Group by owner_id and action_type
            key = (item.owner_id, item.action_type.lower())
            groups[key].append(item)

        # transfer to list
        orders_data = list(groups.values())
        return orders_data

    
    @staticmethod
    def add_calculate_order_amounts(orders_data: List[List[CheckoutItem]], checkout: Checkout) -> List[Dict]:
        """
        For each group of CheckoutItems (owner + action_type), calculate amounts
        and return a dict that contains:
            - items: List[CheckoutItem]
            - deposit_or_sale_amount
            - service_fee_amount
            - shipping_out_fee_amount
            - order_total
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
            post_items = [item for item in order_items if item.shipping_method.lower() == "post"]
            if post_items:
                # Multiple items only post once
                # if pickup, shipping_out_fee_amount = 0
                shipping_out_fee_amount = float(post_items[0].shipping_quote or 0)

            service_fee_amount = float(checkout.service_fee or 0)

            # keep original item
            results.append({
                "items": order_items,  # 保留 CheckoutItem 对象
                "deposit_or_sale_amount": deposit_or_sale_amount,
                "service_fee_amount": service_fee_amount,
                "shipping_out_fee_amount": shipping_out_fee_amount,
                "order_total": deposit_or_sale_amount + service_fee_amount + shipping_out_fee_amount
            })
        """
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

        return results
    
    def create_oreders_data_with_validation(db: Session, checkout: Checkout):
        orders_data_without_price = OrderService.split_checkout_to_orders(checkout)
        orders_data = OrderService.add_calculate_order_amounts(orders_data=orders_data_without_price, checkout=checkout)
        created_orders = []

        for order_info in orders_data:
            items = order_info["items"]
            first_item = items[0]

            # Create order obj
            order = Order(
                owner_id = first_item.owner_id,
                borrower_id = checkout.user_id,
                action_type = first_item.action_type.lower(),
                shipping_method = first_item.shipping_method.lower(),
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
            db.commit()
            db.refresh(order)

            # Create OrderBook entries
            for item in items:
                order_book = OrderBook(
                    order_id=order.id,
                    book_id=item.book_id
                )
                db.add(order_book)
            db.commit()
            created_orders.append(order)

        return created_orders











    def cancel_order(self, order_id: str, current_user: User) -> Order:
        order: Optional[Order] = self.db.query(Order).filter(Order.id == order_id).first()

        if order.borrower_id != current_user.user_id:
            raise HTTPException(status_code=403, detail="You cannot cancel this order")
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        if order.status not in ["PENDING_PAYMENT", "PENDING_SHIPMENT"]:
            raise HTTPException(status_code=400, detail=f"Order cannot be canceled at {order.status}")
    
        order.status = "CANCELED"

        # release books
        for book in order.books:
            book.status = "listed"

        self.db.commit()
        self.db.refresh(order)

    
        return order

#     def get_user_orders_paginated(
#         self, 
#         current_user: User, 
#         page: int = 1, 
#         page_size: int = 20, 
#         status_filter: Optional[str] = None
#     ) -> Dict[str, Any]:
#         """
#         Get paginated orders for current user with business logic
#         """
#         # Build base query - users can only see orders they're involved in
#         query = self.db.query(Order).filter(
#             (Order.owner_id == current_user.user_id) | 
#             (Order.borrower_id == current_user.user_id)
#         )
        
#         # Apply filters
#         if status_filter:
#             query = query.filter(Order.status == status_filter)
        
#         # Get pagination data
#         total = query.count()
#         offset = (page - 1) * page_size
#         orders = query.offset(offset).limit(page_size).all()
        
#         # Convert to frontend format
#         order_dicts = [OrderService.to_frontend_dict(order) for order in orders]
        
#         return {
#             "orders": order_dicts,
#             "total": total,
#             "page": page,
#             "page_size": page_size,
#             "total_pages": (total + page_size - 1) // page_size
#         }

#     def get_order_by_id(self, order_id: str, current_user: User) -> Order:
#         """
#         Get order by ID with permission check
#         """
#         order = self.db.query(Order).filter(Order.id == order_id).first()
        
#         if not order:
#             raise HTTPException(status_code=404, detail="Order not found")
        
#         # Check permission - user must be owner or borrower
#         if order.owner_id != current_user.user_id and order.borrower_id != current_user.user_id:
#             raise HTTPException(status_code=403, detail="Access denied")
        
#         return order

#     def set_order_status(self, order: Order, new_status: str) -> Order:
#         """
#         Common method: Update status and timestamps
#         """
#         order.status = new_status
#         now = datetime.now(timezone.utc)
        
#         if new_status == "BORROWING":
#             order.start_at = now
#             # TODO: Calculate due_at based on book lending periods
#         elif new_status == "RETURNED":
#             order.returned_at = now
#         elif new_status == "COMPLETED":
#             order.completed_at = now
#         elif new_status == "CANCELED":
#             order.canceled_at = now
        
#         self.db.commit()
#         self.db.refresh(order)
#         return order

#     def update_order_status(self, order_id: str, new_status: str, current_user: User) -> Order:
#         """
#         Update order status with business logic validation
#         """
#         order = self.get_order_by_id(order_id, current_user)
#         # TODO: Add status transition validation logic here
#         return self.set_order_status(order, new_status)

#     def cancel_order(self, order_id: str, current_user: User) -> Order:
#         """
#         Cancel order with business validation
#         """
#         order = self.get_order_by_id(order_id, current_user)
        
#         # Only borrower can cancel
#         if order.borrower_id != current_user.user_id:
#             raise HTTPException(status_code=403, detail="Only borrower can cancel order")
        
#         # Check if order can be canceled
#         if order.status not in ["PENDING_PAYMENT", "PENDING_SHIPMENT"]:
#             raise HTTPException(
#                 status_code=400, 
#                 detail=f"Cannot cancel order with status {order.status}"
#             )
        
#         return self.set_order_status(order, "CANCELED")

#     def get_user_borrowing_orders(self, current_user: User) -> List[Dict[str, Any]]:
#         """
#         Get user's borrowing orders (where user is borrower)
#         """
#         orders = self.db.query(Order).filter(
#             Order.borrower_id == current_user.user_id
#         ).order_by(Order.created_at.desc()).all()
        
#         return [OrderService.to_frontend_dict(order) for order in orders]

#     def get_user_lending_orders(self, current_user: User) -> List[Dict[str, Any]]:
#         """
#         Get user's lending orders (where user is owner)
#         """
#         orders = self.db.query(Order).filter(
#             Order.owner_id == current_user.user_id
#         ).order_by(Order.created_at.desc()).all()
        
#         return [OrderService.to_frontend_dict(order) for order in orders]
    
#     def get_orders_by_book_id(self, book_id: str, current_user: User) -> List[Dict[str, Any]]:
#         """
#         Get all historical and current orders for a certain book
#         """
#         # Query all orders including this book
#         orders = self.db.query(Order).join(OrderBook).filter(
#             OrderBook.book_id == book_id
#         ).order_by(Order.created_at.desc()).all()
        
#         # Users can only view orders related to themselves
#         user_orders = [
#             order for order in orders 
#             if order.owner_id == current_user.user_id or order.borrower_id == current_user.user_id
#         ]
        
#         return [OrderService.to_frontend_dict(order) for order in user_orders]

#     def get_active_orders_by_book_id(self, book_id: str, current_user: User) -> List[Dict[str, Any]]:
#         """
#         Get the ongoing order for a certain book
#         """
#         active_statuses = ["PENDING_PAYMENT", "PENDING_SHIPMENT", "BORROWING", "OVERDUE"]
        
#         orders = self.db.query(Order).join(OrderBook).filter(
#             OrderBook.book_id == book_id,
#             Order.status.in_(active_statuses)
#         ).order_by(Order.created_at.desc()).all()
        
#         user_orders = [
#             order for order in orders 
#             if order.owner_id == current_user.user_id or order.borrower_id == current_user.user_id
#         ]
        
#         return [OrderService.to_frontend_dict(order) for order in user_orders]


# class OrderService:
#     """
#     Order service for data conversion and order creation
#     """
    
#     @staticmethod
#     def to_frontend_dict(order: Order) -> dict:
#         """
#         Convert Order to frontend format matching Order interface exactly
#         """
#         # Build ShippingRef objects
#         shipping_out = None
#         if order.shipping_out_tracking_number:
#             shipping_out = {
#                 "carrier": order.shipping_out_carrier,
#                 "trackingNumber": order.shipping_out_tracking_number,
#                 "trackingUrl": order.shipping_out_tracking_url,
#             }
            
#         shipping_return = None
#         if order.shipping_return_tracking_number:
#             shipping_return = {
#                 "carrier": order.shipping_return_carrier,
#                 "trackingNumber": order.shipping_return_tracking_number,
#                 "trackingUrl": order.shipping_return_tracking_url,
#             }
        
#         # Convert datetime to ISO string
#         def to_iso_string(dt):
#             return dt.isoformat() + 'Z' if dt else None
        
#         # Build result matching frontend Order interface exactly
#         result = {
#             "id": str(order.id),
#             "ownerId": str(order.owner_id),
#             "borrowerId": str(order.borrower_id),
#             "bookIds": [str(book.book_id) for book in order.books],
#             "status": order.status,
#             "createdAt": to_iso_string(order.created_at),
#             "updatedAt": to_iso_string(order.updated_at),
#             "deliveryMethod": order.delivery_method,
            
#             # Required Money fields - handle None values appropriately
#             "deposit": {"amount": order.deposit_amount or 0},  # Handle None case for purchase-only orders
#             "serviceFee": {"amount": order.service_fee_amount},
#             "totalPaid": {"amount": order.total_paid_amount},
#         }
        
#         # Add optional time fields
#         if order.start_at:
#             result["startAt"] = to_iso_string(order.start_at)
#         if order.due_at:
#             result["dueAt"] = to_iso_string(order.due_at)
#         if order.returned_at:
#             result["returnedAt"] = to_iso_string(order.returned_at)
#         if order.completed_at:
#             result["completedAt"] = to_iso_string(order.completed_at)
#         if order.canceled_at:
#             result["canceledAt"] = to_iso_string(order.canceled_at)
            
#         # Add optional shipping fields
#         if shipping_out:
#             result["shippingOut"] = shipping_out
#         if shipping_return:
#             result["shippingReturn"] = shipping_return
            
#         # Add optional Money fields
#         if order.shipping_out_fee_amount:
#             result["shippingOutFee"] = {"amount": order.shipping_out_fee_amount}
#         if order.sale_price_amount:
#             result["salePrice"] = {"amount": order.sale_price_amount}
#         if order.late_fee_amount:
#             result["lateFee"] = {"amount": order.late_fee_amount}
#         if order.damage_fee_amount:
#             result["damageFee"] = {"amount": order.damage_fee_amount}
#         if order.total_refunded_amount:
#             result["totalRefunded"] = {"amount": order.total_refunded_amount}
            
#         # Add optional notes
#         if order.notes:
#             result["notes"] = order.notes
            
#         return result
    
#     @staticmethod
#     def create_order(order_data: CreateOrderRequestData) -> Order:
#         """
#         Create new order from validated CreateOrderRequestData
        
#         Args:
#             order_data: CreateOrderRequestData object containing all order information
            
#         Returns:
#             Order: Created order instance
            
#         Raises:
#             ValueError: If validation fails
#         """
#         if not order_data.book_ids:
#             raise ValueError("At least one book_id must be provided")
        
#         # Create order matching your model structure exactly
#         order = Order(
#             owner_id=order_data.owner_id,
#             borrower_id=order_data.borrower_id,
#             delivery_method=order_data.delivery_method,
            
#             # Required pricing fields
#             service_fee_amount=order_data.service_fee_amount,
#             total_paid_amount=order_data.total_paid_amount,
            
#             # Optional pricing fields (can be None)
#             deposit_amount=order_data.deposit_amount,  # Can be None for purchase-only
#             shipping_out_fee_amount=order_data.shipping_out_fee_amount,
#             sale_price_amount=order_data.sale_price_amount,
#             notes=order_data.notes,

#             # Address fields (borrower's delivery address)
#             contact_name=order_data.contact_name,
#             phone=order_data.phone,
#             street=order_data.street,
#             city=order_data.city,
#             postcode=order_data.postcode,
#             country=order_data.country,
#         )

#         # Add books to the order
#         for book_id in order_data.book_ids:
#             order.books.append(OrderBook(order_id=order.id, book_id=book_id))
        
#         return order