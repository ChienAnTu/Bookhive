import uuid
import httpx
import os
from fastapi import HTTPException
from sqlalchemy.orm import Session
from models.checkout import Checkout, CheckoutItem, CheckoutCreate
from models.service_fee import ServiceFee
from models.user import User 

BASE_URL = "https://digitalapi.auspost.com.au/postage/parcel/domestic/calculate.json"
AUSPOST_API_KEY = os.getenv("AUSPOST_CALCULATE_API_KEY")


# -------- Shipping fee calculator --------
async def calculate_shipping_fee(items, toPostcode: str, ownerData: dict):
    """
    Calculate shipping fee by grouping items by owner.
    Return dict {ownerId: {"totalFee": float}}
    """
    results = {}

    # Group items by owner
    grouped = {}
    for item in items:
        if item.shippingMethod and item.shippingMethod.lower() == "delivery":
            grouped.setdefault(item.ownerId, []).append(item)

    async with httpx.AsyncClient(timeout=10.0) as client:
        for ownerId, ownerItems in grouped.items():
            fromPostcode = ownerData[ownerId]["zipcode"]
            serviceCode = ownerData[ownerId]["serviceCode"]

            # Default parcel dimensions per book
            baseLength, baseWidth, baseHeight, baseWeight = 30, 30, 5, 0.5  # cm, cm, cm, kg
            numBooks = len(ownerItems)

            # Calculate total parcel size & weight
            totalLength = baseLength
            totalWidth = baseWidth
            totalHeight = baseHeight * numBooks
            totalWeight = baseWeight * numBooks

            params = {
                "from_postcode": fromPostcode,
                "to_postcode": toPostcode,
                "length": totalLength,
                "width": totalWidth,
                "height": totalHeight,
                "weight": totalWeight,
                "service_code": serviceCode,
            }

            headers = {"AUTH-KEY": AUSPOST_API_KEY}
            response = await client.get(BASE_URL, headers=headers, params=params)

            if response.status_code == 200:
                data = response.json()
                postage_result = data.get("postage_result", {})
                totalFee = float(postage_result.get("total_cost", 0.0))

                results[ownerId] = {
                    "totalFee": totalFee
                }
            else:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"AusPost API error for owner {ownerId}: {response.text}"
                )

    return results

# -------- Create Checkout --------
async def create_checkout(db: Session, checkoutIn: CheckoutCreate):
    # Step 1: Initialize checkout record
    checkout = Checkout(
        checkout_id=str(uuid.uuid4()),
        user_id=checkoutIn.userId,
        contact_name=checkoutIn.contactName,
        phone=checkoutIn.phone,
        street=checkoutIn.street,
        city=checkoutIn.city,
        postcode=checkoutIn.postcode,
        state=checkoutIn.state,
        country=checkoutIn.country,
        status="PENDING",
    )

    # Step 2: Initialize accumulators
    depositTotal = 0.0
    priceTotal = 0.0

    # Step 3: Build ownerData dict (zipcode + serviceCode)
    ownerData = {}
    for itemIn in checkoutIn.items:
        user = db.query(User).filter(User.user_id == itemIn.ownerId).first()
        if not user or not user.zip_code:
            raise HTTPException(
                status_code=400, detail=f"Zipcode not found for owner {itemIn.ownerId}"
            )

        ownerData[itemIn.ownerId] = {
            "zipcode": user.zip_code,
            "serviceCode": getattr(itemIn, "serviceCode", "AUS_PARCEL_REGULAR"),
        }

        # Add to totals
        if itemIn.actionType.upper() == "PURCHASE" and itemIn.price:
            priceTotal += float(itemIn.price)
        elif itemIn.actionType.upper() == "BORROW" and itemIn.deposit:
            depositTotal += float(itemIn.deposit)

        # Create checkout item)
        item = CheckoutItem(
            item_id=str(uuid.uuid4()),
            checkout_id=checkout.checkout_id,
            book_id=itemIn.bookId,
            owner_id=itemIn.ownerId,
            action_type=itemIn.actionType,
            price=itemIn.price,
            deposit=itemIn.deposit,
            shipping_method=itemIn.shippingMethod,
            shipping_quote=0.0, 
            service_code=getattr(itemIn, "serviceCode", "AUS_PARCEL_REGULAR"),
        )
        checkout.items.append(item)

    # Step 4: Call shipping calculator
    shippingFees = await calculate_shipping_fee(checkoutIn.items, checkoutIn.postcode, ownerData)

    
    # Step 5: update item 的 shipping_quote
    shippingFeeTotal = 0.0
    processedOwners = set()
    for item in checkout.items:
        if item.owner_id in shippingFees:
            item.shipping_quote = shippingFees[item.owner_id]["totalFee"]
            if item.owner_id not in processedOwners:
                shippingFeeTotal += float(item.shipping_quote)
                processedOwners.add(item.owner_id)

    # Step 6: Get service fee percentage from service_fee table
    serviceFeeRate = (
        db.query(ServiceFee)
        .filter(ServiceFee.status == True, ServiceFee.fee_type == "PERCENT")
        .order_by(ServiceFee.created_at.desc())
        .first()
    )

    serviceFeeAmount = 0.0
    if serviceFeeRate:
        serviceFeeAmount = (priceTotal + depositTotal) * float(serviceFeeRate.value) / 100.0

    # Step 7: Save totals into checkout record
    checkout.deposit = depositTotal
    checkout.service_fee = serviceFeeAmount
    checkout.book_fee = priceTotal 
    checkout.shipping_fee = shippingFeeTotal
    checkout.total_due = depositTotal + priceTotal + serviceFeeAmount + shippingFeeTotal

    # Step 8: Commit to database
    db.add(checkout)
    db.commit()
    db.refresh(checkout)
    return checkout

# -------- Retrieve Pending Checkouts for a User --------


def get_pending_checkouts_by_user_id(db: Session, user_id: str):
    """
    Get all PENDING checkouts created by a specific user.
    """
    return (
        db.query(Checkout)
        .filter(Checkout.user_id == user_id, Checkout.status == "PENDING")
        .all()
    )

# -------- Delete Checkout --------


def delete_checkout(db: Session, checkout_id: str) -> bool:
    """
    Delete a checkout (and its items) by ID.
    Returns True if deleted, False if not found.
    """
    checkout = db.query(Checkout).filter(
        Checkout.checkout_id == checkout_id).first()
    if not checkout:
        return False

    # Because relationship(cascade="all, delete-orphan"), items will be deleted too
    db.delete(checkout)
    db.commit()
    return True
