"""
Order API routes - FastAPI implementation
Clean routes with business logic delegated to service layer
"""

from typing import Optional, Dict
from fastapi import APIRouter, Depends, status, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from schemas.order import OrderSummary, OrderDetail
from typing import List
from services.order_service import OrderService
from models.user import User
# from models.order import Order
from models.checkout import Checkout
from core.dependencies import get_db, get_current_user


router = APIRouter(tags=["orders"])


# API Models
class CreateOrderRequest(BaseModel):
    checkout_id: str

class TrackingNumbersResponse(BaseModel):
    shipping_out_tracking_number: List[str]
    shipping_return_tracking_number: List[str]

@router.post("/", status_code=status.HTTP_201_CREATED)
def create_order(
    request: CreateOrderRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    checkout = db.query(Checkout).filter(Checkout.checkout_id == request.checkout_id).first()
    if not checkout:
        raise HTTPException(status_code=404, detail=f"Checkout {request.checkout_id} not found")
    
    if checkout.user_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    created_orders = OrderService.create_orders_data_with_validation(db, checkout, user_id=current_user.user_id)
    return {
        "message": "Orders created successfully",
        "orders": [
            {
                "id": order.id,
            }
            for order in created_orders
        ],
    }

@router.get("/", response_model=List[OrderSummary], status_code=status.HTTP_200_OK)
def list_my_orders(
    status: Optional[str] = Query(None, description="Filter by order status"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Orders per page"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    List current user's orders (summary + basic book info), optionally filtered by status, with pagination.
    """
    skip = (page - 1) * page_size
    orders = OrderService.get_orders_by_user(
        db=db,
        user_id=current_user.user_id,
        status=status,
        skip=skip,
        limit=page_size
    )
    return orders

@router.get("/tracking", response_model=Dict[str, List[str]])
def get_user_tracking_numbers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    user_id: Optional[str] = None
):
    """
    Get AUPOST tracking numbers for a user's orders.
    
    Args:
        user_id: Optional user ID (admin only, defaults to current user)
    
    Returns:
        Dictionary with shipping_out and shipping_return tracking numbers
    """
    return OrderService.get_user_tracking_numbers(db, current_user, user_id)

@router.get("/{order_id}", response_model=OrderDetail)
async def get_order_detail(
    order_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """get order details"""
    return OrderService.get_order_detail(db, order_id, current_user)

@router.put("/{order_id}/cancel")
def cancel_order(
    order_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    success = OrderService.cancel_order(db, order_id, current_user)
    if success:
        return {"message": "Order cancelled successfully"}
    

