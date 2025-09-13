"""
Order API routes - FastAPI implementation
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from datetime import datetime, timezone

from models.order import Order
from services.order_service import OrderService
from models.user import User
from models.book import Book
from core.dependencies import get_db
from core.dependencies import get_current_user

router = APIRouter(prefix="/orders", tags=["orders"])

# Pydantic model

class CreateOrderRequest(BaseModel):
    owner_id: str
    borrower_id: str
    book_ids: List[str] = Field(..., min_items=1, description="at least 1 book is needed")
    delivery_method: str = Field(..., pattern="^(post|pickup)$")
    deposit_amount: Optional[int] = 0
    service_fee_amount: Optional[int] = 200  
    shipping_out_fee_amount: Optional[int] = None
    sale_price_amount: Optional[int] = None
    notes: Optional[str] = None

class UpdateOrderStatusRequest(BaseModel):
    status: str = Field(..., pattern="^(PENDING_PAYMENT|PENDING_SHIPMENT|BORROWING|OVERDUE|RETURNED|COMPLETED|CANCELED)$")
    notes: Optional[str] = None

class UpdateShippingRequest(BaseModel):
    # carrier: Optional[str] = Field(None, regex="^(AUSPOST|OTHER)$")
    # tracking_number: Optional[str] = None
    tracking_url: str = Field(..., description="Third-party tracking URL")
    direction: str = Field(..., pattern="^(out|return)$")  

class OrderListFilters(BaseModel):
    owner_id: Optional[str] = None
    borrower_id: Optional[str] = None
    status: Optional[str] = None
    limit: int = Field(20, ge=1, le=100)
    offset: int = Field(0, ge=0)

# API 

@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_order(
    order_data: CreateOrderRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create Order
    """
    try:
        # validate user
        owner = db.query(User).filter(User.user_id == order_data.owner_id).first()
        borrower = db.query(User).filter(User.user_id == order_data.borrower_id).first()
        # check if borrower is current user
        if current_user.user_id != order_data.borrower_id:
            raise HTTPException(
                status_code=403, 
                detail="You are not allowed to create an order for another user"
            )
        
        if not owner:
            raise HTTPException(status_code=404, detail="The owner doesn't exist")
        if not borrower:
            raise HTTPException(status_code=404, detail="The borrower doesn't exist")
        
        # validate book
        books = db.query(Book).filter(Book.id.in_(order_data.book_ids)).all()
        if len(books) != len(order_data.book_ids):
            raise HTTPException(status_code=404, detail="Part of books doesn't exist")
        
        # check books belong to one owner
        book_owners = set(book.owner_id for book in books)
        if len(book_owners) > 1:
            raise HTTPException(status_code=400, detail="cannot borrow books from different owners in the same order")
        
        if order_data.owner_id not in book_owners:
            raise HTTPException(status_code=400, detail="The owner of the book does not match the owner of the order")
        
        # Check the status of the books
        unavailable_books = [book.title_en for book in books if book.status != 'listed']
        if unavailable_books:
            raise HTTPException(
                status_code=400, 
                detail=f"The following books are not available for borrowing: {', '.join(unavailable_books)}"
            )
        
        # create order
        order = OrderService.create_order(
            owner_id=order_data.owner_id,
            borrower_id=order_data.borrower_id,
            book_ids=order_data.book_ids,
            delivery_method=order_data.delivery_method,
            deposit_amount=order_data.deposit_amount,
            service_fee_amount=order_data.service_fee_amount,
            shipping_out_fee_amount=order_data.shipping_out_fee_amount,
            sale_price_amount=order_data.sale_price_amount,
            notes=order_data.notes
        )
        
        # save to the database
        db.add(order)
        db.commit()
        db.refresh(order)
        
        # return to the front-end format
        return OrderService.to_frontend_dict(order)
        
    except Exception as e:
        db.rollback()
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Failed to create the order: {str(e)}")


@router.get("/{order_id}", response_model=dict)
async def get_order(
    order_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get order details
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Permission check: only order related users can view
    if current_user.user_id not in [order.owner_id, order.borrower_id]:
        raise HTTPException(status_code=403, detail="Access denied for this order")
    
    return OrderService.to_frontend_dict(order)


@router.get("/", response_model=dict)
async def list_orders(
    owner_id: Optional[str] = Query(None),
    borrower_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get order list with filters
    """
    query = db.query(Order)
    
    # Permission control: users can only see their related orders
    query = query.filter(
        (Order.owner_id == current_user.user_id) | 
        (Order.borrower_id == current_user.user_id)
    )
    
    # Apply further filters
    if owner_id:
        query = query.filter(Order.owner_id == owner_id)
    if borrower_id:
        query = query.filter(Order.borrower_id == borrower_id)
    if status:
        query = query.filter(Order.status == status)
    
    # Pagination
    total = query.count()
    orders = query.offset(offset).limit(limit).all()
    
    return {
        "orders": [OrderService.to_frontend_dict(order) for order in orders],
        "total": total,
        "limit": limit,
        "offset": offset
    }


@router.put("/{order_id}/status", response_model=dict)
async def update_order_status(
    order_id: str,
    status_data: UpdateOrderStatusRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update order status 
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order doesn't exist")
    
    # authority check
    if current_user.user_id not in [order.owner_id, order.borrower_id]:
        raise HTTPException(status_code=403, detail="you have no right to modify this order")
    
    try:
        # update status
        old_status = order.status
        order.status = status_data.status
        order.updated_at = datetime.now(timezone.utc)
        
        if status_data.notes:
            order.notes = status_data.notes
        
        # Update the time field based on the status
        if status_data.status == "BORROWING" and not order.start_at:
            order.start_at = datetime.now(timezone.utc)
        elif status_data.status == "RETURNED" and not order.returned_at:
            order.returned_at = datetime.now(timezone.utc)
        elif status_data.status == "COMPLETED" and not order.completed_at:
            order.completed_at = datetime.now(timezone.utc)
        elif status_data.status == "CANCELED" and not order.canceled_at:
            order.canceled_at = datetime.now(timezone.utc)
        
        db.commit()
        db.refresh(order)
        
        return {
            "message": f"Order status {old_status} has been changed to {status_data.status}",
            "order": OrderService.to_frontend_dict(order)
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update the order status: {str(e)}")


@router.put("/{order_id}/shipping", response_model=dict)
async def update_shipping_info(
    order_id: str,
    shipping_data: UpdateShippingRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update shipping tracking URL
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Permission check: only book owner can update shipping info
    if current_user.user_id != order.owner_id:
        raise HTTPException(status_code=403, detail="Only book owner can update shipping information")
    
    try:
        # Update tracking URL based on direction
        if shipping_data.direction == "out":
            order.shipping_out_tracking_url = shipping_data.tracking_url
        else:  # return
            order.shipping_return_tracking_url = shipping_data.tracking_url
        
        order.updated_at = datetime.now(timezone.utc)
        
        db.commit()
        db.refresh(order)
        
        return {
            "message": f"Shipping tracking URL updated ({shipping_data.direction})",
            "order": OrderService.to_frontend_dict(order)
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update shipping info: {str(e)}")


@router.delete("/{order_id}", response_model=dict)
async def cancel_order(
    order_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    cancel order
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="The order doesn't exist")
    
    # check authority
    if current_user.user_id not in [order.owner_id, order.borrower_id]:
        raise HTTPException(status_code=403, detail="no right to cancel this order")
    
    # Only orders of specific status can be cancelled
    if order.status not in ["PENDING_PAYMENT", "PENDING_SHIPMENT"]:
        raise HTTPException(
            status_code=400, 
            detail=f"Order status is: {order.status}, cannot cancel at this stage"
        )
    
    try:
        order.status = "CANCELED"
        order.canceled_at = datetime.now(timezone.utc)
        order.updated_at = datetime.now(timezone.utc)
        
        db.commit()
        db.refresh(order)
        
        return {
            "message": "The order has been cancelled",
            "order": OrderService.to_frontend_dict(order)
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Fail to cancel the order: {str(e)}")