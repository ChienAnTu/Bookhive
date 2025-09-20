import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from core.dependencies import get_db
from models.checkout import Checkout, CheckoutCreate, CheckoutItem
from services import checkout_service
from core.dependencies import get_current_user
from models.user import User as UserModel

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
        "state": checkout.state,
        "country": checkout.country,
        "deposit": float(checkout.deposit),
        "serviceFee": float(checkout.service_fee),
        "bookFee": float(checkout.book_fee),
        "shippingFee": float(checkout.shipping_fee),
        "totalDue": float(checkout.total_due),
        "status": checkout.status,
        "createdAt": checkout.created_at.isoformat(),
        "updatedAt": checkout.updated_at.isoformat(),
        "items": [_checkout_item_to_dict(item) for item in checkout.items],
    }


@router.get("/list", status_code=status.HTTP_200_OK)
def list_my_checkouts(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    """List all checkouts for the current logged-in user"""
    checkouts = checkout_service.get_pending_checkouts_by_user_id(
        db, current_user.user_id)
    if not checkouts:
        raise HTTPException(
            status_code=404, detail="No checkouts found for this user")
    return [_checkout_to_dict(c) for c in checkouts]


@router.post("/create", status_code=status.HTTP_201_CREATED)
async def create_checkout(
    checkout_in: CheckoutCreate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    """Create a new checkout with items"""
    checkout_in.userId = current_user.user_id
    checkout = await checkout_service.create_checkout(db, checkout_in)
    return _checkout_to_dict(checkout)


@router.delete("/{checkout_id}", status_code=status.HTTP_200_OK)
def delete_checkout(checkout_id: str, db: Session = Depends(get_db)):
    """Delete a checkout"""
    deleted = checkout_service.delete_checkout(db, checkout_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Checkout not found")
    return {"deletedId": checkout_id}
