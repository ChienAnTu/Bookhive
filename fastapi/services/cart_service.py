import uuid
from sqlalchemy.orm import Session
from fastapi import HTTPException
from models.cart import Cart, CartItem

def get_cart_with_items(db: Session, user_id: str) -> Cart:
    cart = db.query(Cart).filter(Cart.user_id == user_id).first()
    if not cart:
        cart = Cart(cart_id=str(uuid.uuid4()), user_id=user_id)
        db.add(cart)
        db.commit()
        db.refresh(cart)
    return cart

def add_cart_item(
    db: Session,
    user_id: str,
    book_id: str,
    owner_id: str,
    action_type: str,
    price: float = None,
    deposit: float = None,
) -> CartItem:
    cart = get_cart_with_items(db, user_id)
    existing = (
        db.query(CartItem)
        .filter(
            CartItem.cart_id == cart.cart_id,
            CartItem.book_id == book_id,
            CartItem.action_type == action_type,
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Item already in cart")

    new_item = CartItem(
        cart_item_id=str(uuid.uuid4()),
        cart_id=cart.cart_id,
        book_id=book_id,
        owner_id=owner_id,
        action_type=action_type,
        price=price,
        deposit=deposit,
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item

def remove_cart_items(db: Session, user_id: str, cart_item_ids: list[str]) -> int:
    cart = get_cart_with_items(db, user_id)
    items = (
        db.query(CartItem)
        .filter(
            CartItem.cart_id == cart.cart_id,
            CartItem.cart_item_id.in_(cart_item_ids)
        )
        .all()
    )
    if not items:
        raise HTTPException(status_code=404, detail="No matching items found in cart")

    for item in items:
        db.delete(item)
    db.commit()
    return len(items)

def update_cart_item(
    db: Session,
    user_id: str,
    cart_item_id: str,
    action_type: str = None,
    price: float = None,
    deposit: float = None,
):
    cart = get_cart_with_items(db, user_id)

    item = (
        db.query(CartItem)
        .filter(
            CartItem.cart_id == cart.cart_id,
            CartItem.cart_item_id == cart_item_id,
        )
        .first()
    )
    if not item:
        return None

    if action_type is not None:
        item.action_type = action_type
    if price is not None:
        item.price = price
    if deposit is not None:
        item.deposit = deposit

    db.commit()
    db.refresh(item)
    return item

def remove_cart_items_by_book_ids(
    db: Session,
    book_ids: List[str],
    current_user=None,
) -> int:
    """
    Remove all cart items that match the given book IDs
    for the currently authenticated user.

    This function is typically called after an order is successfully created,
    to clear purchased or borrowed books from the user's cart.

    Args:
        db (Session): SQLAlchemy database session.
        book_ids (List[str]): A list of book IDs to remove from the cart.
        current_user: The currently authenticated user (automatically resolved).

    Returns:
        int: The number of deleted cart items.
    Raises:
        HTTPException: If the user's cart is not found.
    """
    # Validate user context
    if current_user is None:
        raise HTTPException(status_code=401, detail="User context missing")

    # 1. Retrieve the user's cart
    cart = db.query(Cart).filter(Cart.user_id == current_user.user_id).first()
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")

    # 2. Find matching cart items
    items_to_delete = (
        db.query(CartItem)
        .filter(
            CartItem.cart_id == cart.cart_id,
            CartItem.book_id.in_(book_ids)
        )
        .all()
    )

    if not items_to_delete:
        return 0  # No matching items found — nothing to delete

    # 3. Delete matching items and commit transaction
    for item in items_to_delete:
        db.delete(item)

    db.commit()
    return len(items_to_delete)