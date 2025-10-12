import stripe
import uuid
import os
import logging
import traceback
from datetime import datetime
from sqlalchemy.orm import Session
from models.service_fee import ServiceFee, ServiceFeeUpdate
from models.payment_gateway import Payment, Refund, Dispute, AuditLog, Donation
from functools import wraps
from typing import Callable, List, Dict, Optional 
from fastapi import Request, HTTPException

from models.user import User
from models.checkout import Checkout
from models.order import Order
from models.payment_split import PaymentSplit
from models.checkout import CheckoutItem
from services.order_service import OrderService

logger = logging.getLogger(__name__)

# -------- Helpers --------
def log_event(db: Session, event_type: str, reference_id: str = None, actor: str = None, message: str = None):
    """
    Save an audit log entry to DB.
    """
    log = AuditLog(
        event_type=event_type,
        reference_id=reference_id,
        actor=actor,
        message=message,
        created_at=datetime.utcnow() 
    )
    db.add(log)
    db.commit()
    return log.id


def audit(event_type: str):
    """
    Decorator to automatically log API actions into audit_logs table.
    """
    def decorator(func: Callable):
        @wraps(func)
        def wrapper(*args, **kwargs):
            db: Session = kwargs.get("db")
            actor = kwargs.get("user_id") or (
                kwargs.get("data", {}).get("user_id") if "data" in kwargs else None
            ) or "system"

            try:
                result = func(*args, **kwargs)

                # reference_id extract (Payment, Dispute ...)
                reference_id = None
                if isinstance(result, dict):
                    reference_id = result.get("payment_id") or result.get("dispute_id")

                log_event(
                    db,
                    event_type=event_type,
                    reference_id=reference_id,
                    actor=actor,
                    message=f"{event_type} executed successfully"
                )

                return result
            except Exception as e:
                if db:
                    log_event(
                        db,
                        event_type=f"{event_type}_failed",
                        reference_id=None,
                        actor=actor,
                        message=str(e)
                    )
                raise
        return wrapper
    return decorator


# -------- Services --------
@audit("/create_express_account")
def create_express_account(email: str, *, db: Session):
    try:
        account = stripe.Account.create(
            type="express",
            country="AU",
            email=email,
            capabilities={
                "card_payments": {"requested": True},
                "transfers": {"requested": True},
            }
        )

        stripe.Account.modify(
            account.id,
            settings={
                "payouts": {
                    "schedule": {
                        "interval": "manual"
                    }
                }
            },
        )
        
        link = stripe.AccountLink.create(
            account=account.id,
            refresh_url="https://www.bookborrow.org/reauth",
            return_url="https://www.bookborrow.org/",
            type="account_onboarding",
        )

        user = db.query(User).filter_by(email=email).first()
        if not user:
            raise ValueError("User not found")
        user.stripe_account_id = account.id
        db.commit()
        db.refresh(user)

        return {
            "account_id": account.id,
            "onboarding_url": link.url
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=str(e))


@audit("payment_initiated")
def initiate_payment(data: dict, db: Session):
    """
    1. Create PaymentIntent with Stripe
    2. Extract client_secret
    3. Save payment record into DB
    4. Return client_secret to frontend
    """
    print("[initiate_payment] raw data:", data)

    user_id = data.get("user_id")
    amount = data.get("amount")
    currency = data.get("currency", "usd")
    purchase = data.get("purchase", 0)
    deposit = data.get("deposit", 0)
    shipping_fee = data.get("shipping_fee", 0)
    service_fee = data.get("service_fee", 0)
    lender_account_id = data.get("lender_account_id")

    checkout_id = data.get("checkout_id")


    try:
        # 1. Create Stripe PaymentIntent
        intent = stripe.PaymentIntent.create(
            amount=amount,
            currency=currency,
            capture_method="automatic",
            automatic_payment_methods={"enabled": True},
            transfer_data={"destination": lender_account_id},
            metadata={
                "user_id": user_id,
                "purchase": purchase,
                "deposit": deposit,
                "shipping_fee": shipping_fee,
                "service_fee": service_fee,
            },
        )

        # 2. Extract client_secret
        client_secret = intent.client_secret

        checkoutItem = db.query(CheckoutItem).filter_by(checkout_id=checkout_id).all()

        payment = None

        for owner in checkoutItem:
            
            if owner.action_type == "BORROW":
                deposit = owner.deposit*100
                purchase = 0
            elif owner.action_type == "PURCHASE":
                purchase = owner.price*100
                deposit = 0

            # 3. Save payment record in DB
            payment = Payment(
                payment_id=intent.id,
                checkout_id=owner.checkout_id,
                user_id=user_id,
                amount=amount,
                currency=currency,
                status=intent.status,
                purchase=purchase,
                deposit=deposit,
                shipping_fee=shipping_fee,
                service_fee=service_fee,

                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),

                destination= owner.destination,
                action_type = owner.action_type
            )

            db.add(payment)
        
        # Only refresh if we actually created one
        if payment is None:
            db.rollback()
            raise HTTPException(status_code=400, detail=f"No checkout items to create a payment {payment}")

        db.commit()
        db.refresh(payment)

        # 4. Return client_secret to frontend
        return {
            "message": "Payment initiated",
            "payment_id": intent.id,
            "client_secret": client_secret,
            "status": intent.status,
            "amount": amount,
            "currency": currency,
        }

    except stripe.error.StripeError as e:
        db.rollback()
        return {"error": str(e)}, 400


def get_payment_status_service(payment_id: str):
    """
    1. Retrieve PaymentIntent from Stripe using payment_id
    2. Extract relevant fields such as status, amount, currency
    3. Return current status and details to frontend
    (No DB operations are performed here)
    """
    try:
        intent = stripe.PaymentIntent.retrieve(payment_id)
        return {
            "payment_id": intent.id,
            "status": intent.status,
            "amount": intent.amount,
            "currency": intent.currency,
        }
    except stripe.error.StripeError as e:
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=str(e))


@audit("capture_initiated")
def capture_payment(payment_id: str, *, db: Session):
    """
    1. Retrieve the PaymentIntent from Stripe
    2. Capture the held amount (manual capture)
    3. Return confirmation details
    """
    try:
        intent = stripe.PaymentIntent.capture(payment_id)

        payment = db.query(Payment).filter_by(payment_id=payment_id).first()
        if payment:
            payment.status = intent.status
            payment.amount = intent.amount  # or intent.amount_captured
            db.commit()
            db.refresh(payment)
        
        return {
            "payment_id": intent.id,
            "status": intent.status,   # should now be 'succeeded'
            "amount_captured": getattr(intent, "amount_captured", None),  
            "amount": getattr(intent, "amount", None), 
        }
    except stripe.error.StripeError as e:
        db.rollback()
        traceback.print_exc()
        return {"error": str(e)}, 400


@audit("distribution_initiated")
def distribute_shipping_fee(payment_id: str, data: dict, *, db: Session):
    """
    1. Initiate a refund using Stripe API
    2. Save refund record into refunds table
    3. Update payment status if necessary
    4. Return refund details
    """
    try:
        payment = db.query(Payment).filter_by(payment_id=payment_id).first()

        lender_account_id = data.get("lender_account_id")

        transfer = stripe.Transfer.create(
            amount=payment.shipping_fee,
            currency=payment.currency,
            destination=lender_account_id,  # receiver of shipping fee
            transfer_group=payment_id     # tracking
        )

        payment.status = "succeeded/shipping_fee_paid"
        db.commit()

        return {
            "message": "Shipping fee transferred successfully.",
            "transfer_id": transfer.id,
            "amount": payment.shipping_fee,
            "currency": payment.currency,
            "destination": lender_account_id,
        }
    
    except stripe.error.StripeError as e:
        db.rollback()
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=f"Stripe error: {str(e)}")
    except Exception as e:
        db.rollback()
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")


@audit("refund_initiated")
def refund_payment(payment_id: str, data: dict, *, db: Session):
    """
    1. Initiate a refund using Stripe API
    2. Save refund record into refunds table
    3. Update payment status if necessary
    4. Return refund details
    """
    try:

        payment = db.query(Payment).filter_by(payment_id=payment_id).first()
        amountDeposit = payment.deposit

        # 1. Create refund in Stripe
        refund = stripe.Refund.create(
            payment_intent=payment_id,
            amount=amountDeposit,   # None → full refund
            reason=data.get("reason")    # optional
        )

        # 2. Save refund record in DB
        refund_record = Refund(
            refund_id=refund.id,
            payment_id=payment_id,
            amount=refund.amount,
            currency=refund.currency,
            status=refund.status,
            reason=refund.reason
        )
        db.add(refund_record)

        # 3. Update payment status
        payment = db.query(Payment).filter_by(payment_id=payment_id).first()
        if payment:
            # Being able to know wether it be partial refund or entire refund
            if refund.amount == payment.amount:
                payment.status = "refunded"
            else:
                payment.status = "partially_refunded"

        db.commit()

        # 4. Return refund details
        return {
            "payment_id": payment_id,
            "refund_id": refund.id,
            "status": refund.status,
            "amount_refunded": refund.amount,
            "currency": refund.currency,
            "reason": refund.reason,
        }

    except stripe.error.StripeError as e:
        db.rollback()
        traceback.print_exc()
        return {"error": str(e)}, 400


@audit("compensation_initiated")
def compensate_payment(payment_id: str, destination: str, *, db: Session):
    """
    Compensate payment after dispute resolution:
    - Transfer partial compensation to owner 
    - Record transaction in DB
    """
    try:
        payment = db.query(Payment).filter_by(payment_id=payment_id).first()
        compsensation_amount = payment.amount - (payment.deposit + payment.service_fee + payment.shipping_fee)

        transfer = stripe.Transfer.create(
            amount=compsensation_amount ,
            currency=payment.currency,
            destination= destination,  # receiver of shipping fee
            transfer_group=payment_id     # tracking
        )

        payment.status = "compensated"
        db.commit()

        return {
            "message": "Compensation has been processed successfully.",
            "transfer_id": transfer.id,
            "amount": compsensation_amount,
            "currency": payment.currency,
            "destination": destination,
        }
    
    except stripe.error.StripeError as e:
        db.rollback()
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=f"Stripe error: {str(e)}")
    except Exception as e:
        db.rollback()
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")




@audit("dispute_created")
def create_dispute(payment_id: str, data: dict, db: Session):
    """
    1. Create a new dispute record linked to a payment
    2. Save to DB
    3. Return dispute details
    """
    dispute = Dispute(
        dispute_id=str(uuid.uuid4()),
        payment_id=payment_id,
        user_id=data["user_id"],
        reason=data["reason"],
        note=data.get("note"),
        status="open"
    )
    db.add(dispute)
    db.commit()
    db.refresh(dispute)

    return {
        "dispute_id": dispute.dispute_id,
        "payment_id": dispute.payment_id,
        "user_id": dispute.user_id,
        "reason": dispute.reason,
        "status": dispute.status,
        "created_at": dispute.created_at,
    }


@audit("dispute_resolved")
def handle_dispute(payment_id: str, data: dict, *, db: Session):
    """
    Admin resolves a dispute by recording the decision in DB.
    Actions:
      - adjust   → partial deposit will be kept (capture later)
      - overrule → dispute rejected, full deposit will be kept (capture later)
    Stripe is NOT called here. Only DB is updated.
    """
    action = data.get("action")
    note = data.get("note", "")
    deduction = data.get("deduction")

    # 1. Find payment
    payment = db.query(Payment).filter_by(payment_id=payment_id).first()
    if not payment:
        return {"error": "Payment not found"}, 404

    # 2. Find dispute
    dispute = db.query(Dispute).filter_by(payment_id=payment_id, status="open").first()
    if not dispute:
        return {"error": "No open dispute found"}, 404

    # 3. Update based on action
    if action == "adjust":
        if not deduction or deduction < 0:
            return {"error": "deduction amount must be provided and > 0"}, 400
        if payment.amount - deduction < 0:
            return {"error": "deduction exceeds deposit amount"}, 400
        
        dispute.status = "adjusted"
        payment.deposit -= deduction

        compensate_payment(payment_id, payment.destination, db=db)


    elif action == "overrule":
        dispute.status = "overruled"

    else:
        return {"error": "Invalid action"}, 400

    # 4. Save admin note
    dispute.note = (dispute.note or "") + f"\n[Admin Note]: {note}"

    db.commit()

    return {
        "payment_id": payment.payment_id,
        "dispute_id": dispute.dispute_id,
        "action": action,
        "status": "resolved",
        "note": note
    }



def list_transactions():
    # TODO: Query DB and return list of user transactions
    return {"transactions": []}


def get_transaction_detail(txn_id: str):
    # TODO: Fetch details of a specific transaction from DB
    return {"transaction_id": txn_id, "detail": {}}


def view_logs(db: Session, limit: int):
    """
    Return latest admin audit logs.
    """
    logs = (
        db.query(AuditLog)
        .order_by(AuditLog.created_at.desc())
        .limit(limit)
        .all()
    )

    return {
        "logs": [
            {
                "id": log.id,
                "event_type": log.event_type,
                "reference_id": log.reference_id,
                "actor": log.actor,
                "message": log.message,
                "created_at": log.created_at,
            }
            for log in logs
        ]
    }


@audit("donation_initiated")
def initiate_donation(data: dict, *, db: Session):
    """
    1. Create Stripe PaymentIntent for donation
    2. Extract client_secret
    3. Save donation record into DB
    4. Return client_secret to frontend
    """
    user_id = data.get("user_id")
    amount = data.get("amount")
    currency = data.get("currency", "usd")

    try:
        # 1. Create Stripe PaymentIntent
        intent = stripe.PaymentIntent.create(
            amount=amount,
            currency=currency,
            capture_method="automatic",  
            metadata={"user_id": user_id, "type": "donation"},
        )

        # 2. Extract client_secret
        client_secret = intent.client_secret

        # 3. Save donation record in DB
        donation = Donation(
            donation_id=intent.id,
            user_id=user_id,
            amount=amount,
            currency=currency,
            status=intent.status,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        db.add(donation)
        db.commit()
        db.refresh(donation)

        # 4. Return client_secret
        return {
            "message": "Donation initiated",
            "donation_id": intent.id,
            "client_secret": client_secret,
            "status": intent.status,
            "amount": amount,
            "currency": currency,
        }

    except stripe.error.StripeError as e:
        db.rollback()
        traceback.print_exc()
        return {"error": str(e)}, 400


def donation_history(user_id: str, *, db: Session):
    """
    Retrieve the donation history of a specific user.
    """
    donations = (
        db.query(Donation)
        .filter_by(user_id=user_id)
        .order_by(Donation.created_at.desc())
        .all()
    )

    return [
        {
            "donation_id": donation.donation_id,
            "amount": donation.amount,
            "currency": donation.currency,
            "status": donation.status,
            "created_at": donation.created_at,
            "updated_at": donation.updated_at,
        }
        for donation in donations
    ]



async def stripe_webhook(event: dict, db: Session):
    """
    Handle Stripe webhook events:
    - Process event types (payments + donations)
    - Update DB accordingly
    """

    event_type = event["type"]
    obj = event["data"]["object"]
    print("[webhook] service started:")
    print("[webhook] incoming event type:", event.get("type"))

    # -------------------------
    # PaymentIntent succeeded
    # -------------------------
    payment = None
    if event_type == "payment_intent.succeeded":
        print("[webhook] incoming event type:", event.get("type"))
        payment_id = obj["id"]
        metadata = obj.get("metadata", {})
        intent_type = metadata.get("type", "payment")
        # order = db.query(Order).filter_by(payment_id=payment_id).first()
        # checkout = db.query(Checkout).filter_by(checkout_id=checkout_id).first()
        checkout = None

        if intent_type == "donation":
            donation = db.query(Donation).filter_by(donation_id=payment_id).first()
            if donation:
                donation.status = "succeeded"
                db.commit()
            log_event(db, "donation_succeeded", reference_id=payment_id, actor="system")
        else:
            payment = db.query(Payment).filter_by(payment_id=payment_id).all()
            if not payment:
                print(f"No payments found for {payment_id}")
                return
            checkout = db.query(Checkout).filter_by(checkout_id=payment[0].checkout_id).first()

            print("payment : " + str(payment))
            if payment:
                for pay in payment:
                    pay.status = "succeeded"
                    print("status : " + pay.status)
                    db.commit()   

                orderID = OrderService.create_orders_data_with_validation(db, checkout.checkout_id, payment[0].user_id, payment_id)
                order = db.query(Order).filter_by(id=orderID[-1].id).first()
                OrderService.confirm_payment(db, order.id)

            
            db.commit()            
            log_event(db, "payment_succeeded", reference_id=payment_id, actor="system")
            

    # -------------------------
    # PaymentIntent amount capturable updated
    # -------------------------
    elif event_type == "payment_intent.amount_capturable_updated":
        payment_id = obj["id"]
        metadata = obj.get("metadata", {})
        intent_type = metadata.get("type", "payment")

        if intent_type == "donation":
            donation = db.query(Donation).filter_by(donation_id=payment_id).first()
            if donation:
                donation.status = "requires_capture"
                db.commit()
            log_event(db, "donation_requires_capture", reference_id=payment_id, actor="system")
        else:
            payment = db.query(Payment).filter_by(payment_id=payment_id).first()
            if payment:
                payment.status = "requires_capture"
                db.commit()
            log_event(db, "payment_requires_capture", reference_id=payment_id, actor="system")

    # -------------------------
    # PaymentIntent failed
    # -------------------------
    elif event_type == "payment_intent.payment_failed":
        payment_id = obj["id"]
        metadata = obj.get("metadata", {})
        intent_type = metadata.get("type", "payment")

        if intent_type == "donation":
            donation = db.query(Donation).filter_by(donation_id=payment_id).first()
            if donation:
                donation.status = "failed"
                db.commit()
            log_event(db, "donation_failed", reference_id=payment_id, actor="system")
        else:
            payment = db.query(Payment).filter_by(payment_id=payment_id).first()
            if payment:
                payment.status = "failed"
                db.commit()
            log_event(db, "payment_failed", reference_id=payment_id, actor="system")

    # -------------------------
    # Charge refunded
    # -------------------------
    elif event_type == "charge.refunded":
        refund_id = obj["id"]

        db_refund = db.query(Refund).filter_by(refund_id=refund_id).first()
        if db_refund:
            db_refund.status = "refunded"
            db.commit()

        log_event(db, "refund_completed", reference_id=refund_id, actor="system")

    # -------------------------
    # Unhandled events
    # -------------------------
    else:
        log_event(
            db,
            "webhook_received",
            reference_id=None,
            actor="system",
            message=f"Unhandled event {event_type}"
        )

    return {"message": "Webhook received", "event": event_type}



# ---------- New: Payment confirmation & splits ----------
def build_payment_splits_for_orders(db: Session, payment_id: str, orders: List[Order], currency: str = "aud"):
    """
    Create a PaymentSplit for each order:
      - Purchase: transfer = sale price + shipping; service fee kept by platform
      - Borrow: transfer = shipping (deposit kept by platform, refunded after return)
    """
    for order in orders:
        owner_acct = (order.owner.stripe_account_id if order.owner else None)
        if not owner_acct:
            log_event(db, "owner_missing_connect", reference_id=order.id, actor="system",
                      message=f"owner {order.owner_id} has no stripe_account_id")
            continue

        deposit_or_sale_cents = to_cents(order.deposit_or_sale_amount or 0)
        shipping_cents = to_cents(order.shipping_out_fee_amount or 0)
        service_fee_cents = to_cents(order.service_fee_amount or 0)

        if order.action_type == "purchase":
            transfer_cents = deposit_or_sale_cents + shipping_cents
            deposit_cents = 0
        else:
            transfer_cents = shipping_cents
            deposit_cents = deposit_or_sale_cents

        sp = PaymentSplit(
            payment_id=payment_id,
            order_id=order.id,
            owner_id=order.owner_id,
            connected_account_id=owner_acct,
            currency=currency or "aud",
            deposit_cents=deposit_cents,
            shipping_cents=shipping_cents,
            service_fee_cents=service_fee_cents,
            transfer_amount_cents=transfer_cents,
        )
        db.add(sp)
    db.commit()

def confirm_payment_and_create_orders(db: Session, payment_id: str, checkout_id: str, user_id: str):
    """
    1) Check PaymentIntent = succeeded
    2) Generate orders from checkout (use OrderService)
    3) Create payment_splits
    """
    intent = stripe.PaymentIntent.retrieve(payment_id)
    status = intent.status
    if status != "succeeded":
        raise HTTPException(status_code=400, detail=f"Payment {payment_id} not succeeded (status={status})")

    # Allow empty or missing checkout_id → fallback from PI.metadata
    if not checkout_id:
        meta = getattr(intent, "metadata", None) or {}
        checkout_id = meta.get("checkout_id") or ""
    if not checkout_id:
        raise HTTPException(status_code=400, detail="Missing checkout_id (not provided and not found in PaymentIntent metadata)")

    checkout = db.query(Checkout).filter(Checkout.checkout_id == checkout_id).first()
    if not checkout:
        raise HTTPException(status_code=404, detail=f"Checkout not found: {checkout_id}")

    # (Optional) check if payer matches checkout owner
    if getattr(checkout, "user_id", None) and checkout.user_id != user_id:
        raise HTTPException(status_code=400, detail=f"User mismatch: checkout belongs to {checkout.user_id}, but confirm user is {user_id}")

    from services.order_service import OrderService
    try:
        orders = OrderService.create_orders_data_with_validation(db, checkout=checkout, user_id=user_id)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Create orders failed: {str(e)}")

    # Initial order status after payment: pending shipment
    OrderService.set_initial_status_after_payment(db, orders)

    currency = intent.currency or "aud"
    try:
        build_payment_splits_for_orders(db, intent.id, orders, currency=currency)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Build payment splits failed: {str(e)}")

    log_event(db, "payment_confirmed", reference_id=payment_id, actor=str(user_id), message=f"checkout_id={checkout_id}")

    # --- DB: Sync Payment status to avoid relying solely on webhook updates ---
    payment_row = db.query(Payment).filter_by(payment_id=intent.id).first()
    if payment_row:
        payment_row.status = intent.status or "succeeded"
        # Use Stripe as the source of truth; fill in amount/currency while keeping existing values as fallback
        try:
            if getattr(intent, "amount", None):
                payment_row.amount = int(intent.amount)
            if getattr(intent, "currency", None):
                payment_row.currency = str(intent.currency)
        except Exception:
            pass
        payment_row.updated_at = datetime.utcnow()
        db.add(payment_row)
        db.commit()


    return {
        "payment_id": intent.id,
        "orders_created": [o.id for o in orders]
    }

@audit("payment_status_synced")
def sync_payment_status(payment_id: str, db: Session):
    """
    Read latest PaymentIntent status from Stripe and write back to payments table.
    Useful in local testing when webhook is not available.
    """
    try:
        intent = stripe.PaymentIntent.retrieve(payment_id)
        payment_row = db.query(Payment).filter_by(payment_id=payment_id).first()
        result = {
            "payment_id": intent.id,
            "stripe_status": intent.status,
        }
        if payment_row:
            payment_row.status = intent.status
            # Sync amount/currency (only overwrite if values exist)
            if getattr(intent, "amount", None):
                payment_row.amount = int(intent.amount)
            if getattr(intent, "currency", None):
                payment_row.currency = str(intent.currency)
            payment_row.updated_at = datetime.utcnow()
            db.add(payment_row)
            db.commit()
            result["db_status"] = payment_row.status
        return result
    except stripe.error.StripeError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


def transfer_for_order(
    db: Session,
    order_id: str,
    carrier: Optional[str] = None,
    tracking_number: Optional[str] = None,
    tracking_url: Optional[str] = None,
):
    """
    Execute transfer for a single order (according to split.transfer_amount_cents).
    - First update shipping info (borrow → BORROWING; purchase: only record shipping info)
    - Purchase completion is decided by upper-level flow (this method is only responsible for transfer + shipping info)
    """
    order: Order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Update shipping information and status
    from services.order_service import OrderService
    order = OrderService.mark_order_shipped(
        db,
        order_id=order_id,
        carrier=carrier,
        tracking_number=tracking_number,
        tracking_url=tracking_url,
    )

    splits = db.query(PaymentSplit).filter(PaymentSplit.order_id == order_id).all()
    if not splits:
        raise HTTPException(status_code=400, detail="No payment splits for this order")

    performed: List[str] = []
    for sp in splits:
        if sp.transfer_amount_cents <= 0 or not sp.connected_account_id:
            continue
        tr = stripe.Transfer.create(
            amount=sp.transfer_amount_cents,
            currency=sp.currency or "aud",
            destination=sp.connected_account_id,
        )
        sp.transfer_id = tr.id
        sp.transfer_status = tr.status
        db.add(sp)
        performed.append(tr.id)

    db.commit()
    return {"order_id": order_id, "transfer_ids": performed}

def refund_deposit_for_order(db: Session, order_id: str, amount_cents: Optional[int] = None):
    """
    Borrowing: after return, refund deposit (full or partial).
    On successful refund, mark order as COMPLETED and set books back to 'listed'.
    """
    order: Order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    sp = db.query(PaymentSplit).filter(PaymentSplit.order_id == order_id).first()
    if not sp:
        raise HTTPException(status_code=404, detail="Payment split not found for order")

    refundable = int(sp.deposit_cents or 0)
    refund_amount = refundable if amount_cents is None else max(0, min(refundable, int(amount_cents)))

    if refund_amount <= 0:
        return {"order_id": order_id, "refunded": 0}

    r = stripe.Refund.create(payment_intent=sp.payment_id, amount=refund_amount)
    log_event(db, "refund_completed", reference_id=r.id, actor="system", message=f"{refund_amount} refunded")

    # Create Refund record
    db_refund = Refund(
        refund_id=r.id,
        payment_id=sp.payment_id,
        amount=refund_amount,
        currency=r.currency,
        status=r.status,
        reason=r.reason,
    )
    db.add(db_refund)
    db.commit()

    # Add back to orders.total_refunded_amount in dollars (your column is decimal(10,2))
    try:
        refunded_dollars = (refund_amount or 0) / 100.0
        order.total_refunded_amount = (order.total_refunded_amount or 0) + refunded_dollars
        db.add(order)
        db.commit()
    except Exception:
        db.rollback()

    # Borrow: refund deposit = completion (including restoring book status)
    from services.order_service import OrderService
    OrderService.complete_borrow(db, order_id)

    # Update Payment Status
    payment = db.query(Payment).filter_by(payment_id=sp.payment_id).first()
    if payment:
        sum_refunded = db.query(sa_func.coalesce(sa_func.sum(Refund.amount), 0)).filter(Refund.payment_id == sp.payment_id).scalar() or 0
        if int(sum_refunded) >= int(payment.deposit or 0):
            payment.status = "refunded"
        else:
            payment.status = "partially_refunded"
        db.add(payment)
        db.commit()

    return {"order_id": order_id, "refund_id": r.id, "amount": refund_amount}