"""
Order API routes - FastAPI implementation
Clean routes with business logic delegated to service layer
"""

from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from services.order_service import OrderBusinessService, CreateOrderRequestData, OrderService
from models.user import User
from core.dependencies import get_db, get_current_user

router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_order(
    order_data: CreateOrderRequestData,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new order with full business validation
    
    - Validates users exist and borrower is current user
    - Validates books exist, belong to same owner, and are available
    - Creates order with books and saves to database
    """
    business_service = OrderBusinessService(db)
    order = business_service.create_order_with_validation(order_data, current_user)
    return OrderService.to_frontend_dict(order)


@router.get("/")
def get_orders(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    status_filter: Optional[str] = Query(None, description="Filter by order status"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get paginated list of orders for current user
    
    - Users can only see orders where they are owner or borrower
    - Support filtering by status
    - Returns paginated results with metadata
    """
    business_service = OrderBusinessService(db)
    return business_service.get_user_orders_paginated(
        current_user, page, page_size, status_filter
    )


@router.get("/{order_id}")
def get_order(
    order_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get a specific order by ID
    
    - Users can only access orders where they are owner or borrower
    - Returns full order details in frontend format
    """
    business_service = OrderBusinessService(db)
    order = business_service.get_order_by_id(order_id, current_user)
    return OrderService.to_frontend_dict(order)


@router.patch("/{order_id}/status")
def update_order_status(
    order_id: str,
    status_update: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update order status
    
    - Validates user has permission to update order
    - Automatically updates relevant timestamps based on status
    - Returns updated order in frontend format
    """
    business_service = OrderBusinessService(db)
    order = business_service.update_order_status(order_id, status_update, current_user)
    return OrderService.to_frontend_dict(order)


@router.delete("/{order_id}")
def cancel_order(
    order_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Cancel an order (soft delete - sets status to CANCELED)
    
    - Only borrower can cancel their own orders
    - Only orders in PENDING_PAYMENT or PENDING_SHIPMENT can be canceled
    - Sets canceled_at timestamp
    """
    business_service = OrderBusinessService(db)
    order = business_service.cancel_order(order_id, current_user)
    return OrderService.to_frontend_dict(order)


@router.get("/me/borrowing")
def get_my_borrowing_orders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get current user's borrowing orders (where user is borrower)
    
    - Returns orders ordered by creation date (newest first)
    - Only includes orders where current user is the borrower
    """
    business_service = OrderBusinessService(db)
    return business_service.get_user_borrowing_orders(current_user)


@router.get("/me/lending")
def get_my_lending_orders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get current user's lending orders (where user is owner)
    
    - Returns orders ordered by creation date (newest first)
    - Only includes orders where current user is the owner/lender
    """
    business_service = OrderBusinessService(db)
    return business_service.get_user_lending_orders(current_user)