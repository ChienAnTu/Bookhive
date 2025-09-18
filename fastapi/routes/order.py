"""
Order API routes - FastAPI implementation
Clean routes with business logic delegated to service layer
"""

from typing import Optional
from fastapi import APIRouter, Depends, status, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel

from services.order_service import OrderService
from models.user import User
from models.checkout import Checkout
from core.dependencies import get_db, get_current_user

router = APIRouter(prefix="/orders", tags=["orders"])


# API Models
class CreateOrderRequest(BaseModel):
    checkout_id: str

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

@router.get("/", status_code=200)
def list_my_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    status: str | None = Query("all", description="Filter by order status"),
    search: str | None = Query(None, description="Search by order ID or book title/author")
):
    orders = OrderService(db).get_orders_by_user(
        user_id=current_user.user_id,
        status=status,
        search=search
    )
    return [o.to_dict() for o in orders]