"""
Order API routes - FastAPI implementation
Clean routes with business logic delegated to service layer
"""

from typing import Optional
from fastapi import APIRouter, Depends, Query, status, HTTPException
from sqlalchemy.orm import Session

from services.order_service import OrderService
from models.user import User
from models.checkout import Checkout
from core.dependencies import get_db, get_current_user

router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_order(
    checkout_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    checkout = db.query(Checkout).filter(Checkout.checkout_id == checkout_id).first()
    if not checkout:
        raise HTTPException(status_code=404, detail=f"Checkout {checkout_id} not found")
    
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
