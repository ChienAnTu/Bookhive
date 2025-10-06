import re
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
        if item.shippingMethod and item.shippingMethod.lower() == "post":
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

                # Default delivery time
                estimatedDays = 0
                if serviceCode == "AUS_PARCEL_REGULAR":
                    delivery_str = postage_result.get("delivery_time", "")
                    if delivery_str:
                        match = re.findall(r"(\d+)", delivery_str)  
                        if match:
                            estimatedDays = int(match[-1])  #  "4-5 business days" → 5
                elif serviceCode == "AUS_PARCEL_EXPRESS":
                    estimatedDays = 2  # Express default 2 
                    
                results[ownerId] = {
                    "totalFee": totalFee,
                    "estimatedDeliveryTime": estimatedDays
                }
            else:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"AusPost API error for owner {ownerId}: {response.text}"
                )

    return results
async def create_checkout(db: Session, checkoutIn: CheckoutCreate):
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

    checkout = await _apply_checkout_data(db, checkout, checkoutIn)

    db.add(checkout)
    db.commit()
    db.refresh(checkout)
    return checkout

async def update_checkout(db: Session, checkout_id: str, checkoutIn: CheckoutCreate):
    checkout = db.query(Checkout).filter(
        Checkout.checkout_id == checkout_id,
        Checkout.status == "PENDING"
    ).first()

    if not checkout:
        raise HTTPException(status_code=404, detail="Checkout not found or not editable")

    # Update address fields
    checkout.contact_name = checkoutIn.contactName
    checkout.phone = checkoutIn.phone
    checkout.street = checkoutIn.street
    checkout.city = checkoutIn.city
    checkout.postcode = checkoutIn.postcode
    checkout.state = checkoutIn.state
    checkout.country = checkoutIn.country

    checkout = await _apply_checkout_data(db, checkout, checkoutIn)

    db.commit()
    db.refresh(checkout)
    return checkout


async def _apply_checkout_data(db: Session, checkout: Checkout, checkoutIn: CheckoutCreate):
    depositTotal = 0.0
    priceTotal = 0.0
    ownerData = {}

    # Step A: clear existing items
    checkout.items.clear()
    db.flush()

    # Step B: ownerData + items
    for itemIn in checkoutIn.items:
        user = db.query(User).filter(User.user_id == itemIn.ownerId).first()
        if not user or not user.zip_code:
            raise HTTPException(
                status_code=400,
                detail=f"Zipcode not found for owner {itemIn.ownerId}"
            )

        ownerData[itemIn.ownerId] = {
            "zipcode": user.zip_code,
            "serviceCode": getattr(itemIn, "serviceCode", "AUS_PARCEL_REGULAR"),
        }

        if itemIn.actionType.upper() == "PURCHASE" and itemIn.price:
            priceTotal += float(itemIn.price)
        elif itemIn.actionType.upper() == "BORROW" and itemIn.deposit:
            depositTotal += float(itemIn.deposit)

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
            estimated_delivery_time=getattr(itemIn, "estimatedDeliveryTime", 0),
        )
        checkout.items.append(item)

    # Step C: calculate shipping fee
    shippingFees = await calculate_shipping_fee(checkoutIn.items, checkoutIn.postcode, ownerData)
    shippingFeeTotal = 0.0
    processedOwners = set()
    for item in checkout.items:
        if item.owner_id in shippingFees:
            item.shipping_quote = shippingFees[item.owner_id]["totalFee"]
            item.estimated_delivery_time = shippingFees[item.owner_id]["estimatedDeliveryTime"]
            if item.owner_id not in processedOwners:
                shippingFeeTotal += float(item.shipping_quote)
                processedOwners.add(item.owner_id)


    # Step D: service fee
    serviceFeeRate = (
        db.query(ServiceFee)
        .filter(ServiceFee.status == True, ServiceFee.fee_type == "PERCENT")
        .order_by(ServiceFee.created_at.desc())
        .first()
    )
    serviceFeeAmount = 0.0
    if serviceFeeRate:
        serviceFeeAmount = (priceTotal + depositTotal) * float(serviceFeeRate.value) / 100.0

    # Step E: update checkout totals
    checkout.deposit = depositTotal
    checkout.book_fee = priceTotal
    checkout.service_fee = serviceFeeAmount
    checkout.shipping_fee = shippingFeeTotal
    checkout.total_due = depositTotal + priceTotal + serviceFeeAmount + shippingFeeTotal

    return checkout



def get_pending_checkouts_by_user_id(db: Session, user_id: str):
    """
    Get all PENDING checkouts created by a specific user.
    """
    return (
        db.query(Checkout)
        .filter(Checkout.user_id == user_id, Checkout.status == "PENDING")
        .all()
    )


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

