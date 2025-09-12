import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from core.dependencies import get_db
from models.checkout import Checkout, CheckoutCreate, CheckoutItem
from services import checkout_service

router = APIRouter(prefix="/checkouts", tags=["Checkouts"])

# -------- Helper: manual response builders --------
def _checkout_item_to_dict(item: CheckoutItem) -> dict:
    return {
        "itemId": item.item_id,
        "bookId": item.book_id,
        "ownerId": item.owner_id,
        "actionType": item.action_type,
        "price": float(item.price) if item.price is not None else None,
        "deposit": float(item.deposit) if item.deposit is not None else None,
        "shippingMethod": item.shipping_method,
        "shippingQuote": float(item.shipping_quote) if item.shipping_quote is not None else None,
    }

def _checkout_to_dict(checkout: Checkout) -> dict:
    return {
        "checkoutId": checkout.checkout_id,
        "userId": checkout.user_id,
        "contactName": checkout.contact_name,
        "phone": checkout.phone,
        "street": checkout.street,
        "city": checkout.city,
        "postcode": checkout.postcode,
        "country": checkout.country,
        "deposit": float(checkout.deposit),
        "serviceFee": float(checkout.service_fee),
        "shippingFee": float(checkout.shipping_fee),
        "totalDue": float(checkout.total_due),
        "status": checkout.status,
        "createdAt": checkout.created_at.isoformat(),
        "updatedAt": checkout.updated_at.isoformat(),
        "items": [_checkout_item_to_dict(item) for item in checkout.items],
    }

# -------- Routes --------

@router.get("/", status_code=status.HTTP_200_OK)
def list_checkouts(db: Session = Depends(get_db)):
    """List all checkouts"""
    checkouts = checkout_service.get_all_checkouts(db)
    return [_checkout_to_dict(c) for c in checkouts]


@router.get("/{checkout_id}", status_code=status.HTTP_200_OK)
def get_checkout(checkout_id: str, db: Session = Depends(get_db)):
    """Get a checkout by ID"""
    checkout = checkout_service.get_checkout(db, checkout_id)
    if not checkout:
        raise HTTPException(status_code=404, detail="Checkout not found")
    return _checkout_to_dict(checkout)


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_checkout(checkout_in: CheckoutCreate, db: Session = Depends(get_db)):
    """Create a new checkout with items"""
    checkout = checkout_service.create_checkout(db, checkout_in)
    return _checkout_to_dict(checkout)


@router.put("/{checkout_id}", status_code=status.HTTP_200_OK)
def update_checkout(checkout_id: str, checkout_in: CheckoutCreate, db: Session = Depends(get_db)):
    """Update an existing checkout (not items)"""
    updated = checkout_service.update_checkout(db, checkout_id, checkout_in)
    if not updated:
        raise HTTPException(status_code=404, detail="Checkout not found")
    return _checkout_to_dict(updated)


@router.delete("/{checkout_id}", status_code=status.HTTP_200_OK)
def delete_checkout(checkout_id: str, db: Session = Depends(get_db)):
    """Delete a checkout"""
    deleted = checkout_service.delete_checkout(db, checkout_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Checkout not found")
    return {"deletedId": checkout_id}