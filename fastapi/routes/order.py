"""
Order API routes - FastAPI implementation
Clean routes with business logic delegated to service layer
"""

from typing import Optional
from fastapi import APIRouter, Depends, status, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from schemas.order import OrderSummary
from typing import List
from services.order_service import OrderService
from models.user import User
from models.checkout import Checkout
from core.dependencies import get_db, get_current_user


router = APIRouter(tags=["orders"])


# API Models
# class CreateOrderRequest(BaseModel):
#     checkout_id: str

# @router.post("/", status_code=status.HTTP_201_CREATED)
# def create_order(
#     request: CreateOrderRequest,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_user)
# ):

#     checkout = db.query(Checkout).filter(Checkout.checkout_id == request.checkout_id).first()
#     if not checkout:
#         raise HTTPException(status_code=404, detail=f"Checkout {request.checkout_id} not found")
    
#     if checkout.user_id != current_user.user_id:
#         raise HTTPException(status_code=403, detail="Access denied")
    
#     created_orders = OrderService.create_orders_data_with_validation(db, checkout, user_id=current_user.user_id)
#     return {
#         "message": "Orders created successfully",
#         "orders": [
#             {
#                 "id": order.id,
#             }
#             for order in created_orders
#         ],
#     }

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