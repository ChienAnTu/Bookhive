from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from core.dependencies import get_db, get_current_user
from models.user import User as UserModel
from services import cart_service
from models.cart import CartItemCreate, CartItem, Cart

router = APIRouter(prefix="/cart", tags=["Cart"])

# -------- Helper: manual response builders --------

def _cart_item_to_dict(item: CartItem) -> dict:
    return {
        "cartItemId": item.cart_item_id,
        "cartId": item.cart_id,
        "bookId": item.book_id,
        "ownerId": item.owner_id,
        "actionType": item.action_type,
        "price": float(item.price) if item.price is not None else None,
        "deposit": float(item.deposit) if item.deposit is not None else None,
        "createdAt": item.created_at.isoformat(),
    }

def _cart_to_dict(cart: Cart) -> dict:
    return {
        "cartId": cart.cart_id,
        "userId": cart.user_id,
        "items": [_cart_item_to_dict(item) for item in cart.items],
    }

# -------- Routes --------

@router.get("/", status_code=status.HTTP_200_OK)
def get_my_cart(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    cart = cart_service.get_cart_with_items(db, current_user.user_id)
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")
    return _cart_to_dict(cart)


@router.post("/items", status_code=status.HTTP_201_CREATED)
def add_item_to_cart(
    item: CartItemCreate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    new_item = cart_service.add_cart_item(
        db=db,
        user_id=current_user.user_id,
        book_id=item.bookId,
        owner_id=item.ownerId,
        action_type=item.actionType,
        price=item.price,
        deposit=item.deposit,
    )
    return _cart_item_to_dict(new_item)

@router.delete("/items", status_code=status.HTTP_200_OK)
def remove_items_from_cart(
    cart_item_ids: List[str],
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    deleted_count = cart_service.remove_cart_items(db, current_user.user_id, cart_item_ids)
    return {"deletedCount": deleted_count}