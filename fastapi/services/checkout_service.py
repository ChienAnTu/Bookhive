from sqlalchemy.orm import Session
from models.checkout import Checkout, CheckoutItem, CheckoutCreate, CheckoutItemCreate, CheckoutBase
import uuid

# -------- Create Checkout --------
def create_checkout(db: Session, checkout_in: CheckoutCreate):
    # Create checkout record
    checkout = Checkout(
        checkout_id=str(uuid.uuid4()),
        user_id=checkout_in.user_id,
        contact_name=checkout_in.contact_name,
        phone=checkout_in.phone,
        street=checkout_in.street,
        city=checkout_in.city,
        postcode=checkout_in.postcode,
        country=checkout_in.country,
        deposit=checkout_in.deposit,
        service_fee=checkout_in.service_fee,
        shipping_fee=checkout_in.shipping_fee,
        total_due=checkout_in.total_due,
        status=checkout_in.status,
    )

    # Add items
    for item_in in checkout_in.items:
        item = CheckoutItem(
            item_id=str(uuid.uuid4()),
            checkout_id=checkout.checkout_id,
            book_id=item_in.book_id,
            owner_id=item_in.owner_id,
            action_type=item_in.action_type,
            price=item_in.price,
            deposit=item_in.deposit,
            shipping_method=item_in.shipping_method,
            shipping_quote=item_in.shipping_quote,
        )
        checkout.items.append(item)

    db.add(checkout)
    db.commit()
    db.refresh(checkout)
    return checkout


# -------- Get Checkout --------
def get_checkout(db: Session, checkout_id: str):
    return db.query(Checkout).filter(Checkout.checkout_id == checkout_id).first()


# -------- List Checkouts --------
def get_all_checkouts(db: Session, user_id: str = None):
    query = db.query(Checkout)
    if user_id:
        query = query.filter(Checkout.user_id == user_id)
    return query.all()


# -------- Update Checkout --------
def update_checkout(db: Session, checkout_id: str, checkout_in: CheckoutBase):
    checkout = get_checkout(db, checkout_id)
    if not checkout:
        return None

    for field, value in checkout_in.dict(exclude_unset=True).items():
        setattr(checkout, field, value)

    db.commit()
    db.refresh(checkout)
    return checkout


# -------- Delete Checkout --------
def delete_checkout(db: Session, checkout_id: str):
    checkout = get_checkout(db, checkout_id)
    if not checkout:
        return False

    db.delete(checkout)
    db.commit()
    return True