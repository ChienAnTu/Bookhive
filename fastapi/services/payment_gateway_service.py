import stripe
import uuid
import os
from datetime import datetime
from sqlalchemy.orm import Session
from models.service_fee import ServiceFee, ServiceFeeUpdate
from models.payment_gateway import Payment, Refund, Dispute, AuditLog, Donation
from functools import wraps
from typing import Callable
from fastapi import Request, HTTPException


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
@audit("payment_initiated")
def initiate_payment(data: dict, db: Session):
    """
    1. Create PaymentIntent with Stripe
    2. Extract client_secret
    3. Save payment record into DB
    4. Return client_secret to frontend
    """

    user_id = data.get("user_id")
    amount = data.get("amount")
    currency = data.get("currency", "usd")
    deposit = data.get("deposit", 0)
    shipping_fee = data.get("shipping_fee", 0)
    service_fee = data.get("service_fee", 0)
    lender_account_id = data.get("lender_account_id")

    total_amount = amount + deposit + shipping_fee + service_fee

    try:
        # 1. Create Stripe PaymentIntent
        intent = stripe.PaymentIntent.create(
            amount=total_amount,
            currency=currency,
            capture_method="manual",
            automatic_payment_methods={"enabled": True},
            transfer_data={"destination": lender_account_id},
            metadata={
                "user_id": user_id,
                "deposit": deposit,
                "shipping_fee": shipping_fee,
                "service_fee": service_fee,
            },
        )

        # 2. Extract client_secret
        client_secret = intent.client_secret

        # 3. Save payment record in DB
        payment = Payment(
            payment_id=intent.id,
            user_id=user_id,
            amount=total_amount,
            currency=currency,
            status=intent.status,
            deposit=deposit,
            shipping_fee=shipping_fee,
            service_fee=service_fee,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )

        db.add(payment)
        db.commit()
        db.refresh(payment)

        # 4. Return client_secret to frontend
        return {
            "message": "Payment initiated",
            "payment_id": intent.id,
            "client_secret": client_secret,
            "status": intent.status,
            "amount": total_amount,
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
        raise HTTPException(status_code=400, detail=str(e))


@audit("capture_initiated")
def capture_payment(payment_id: str, db: Session):
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
            "amount_captured": intent.amount_captured,
        }
    except stripe.error.StripeError as e:
        db.rollback()
        return {"error": str(e)}, 400


@audit("refund_initiated")
def refund_payment(payment_id: str, data: dict, db: Session):
    """
    1. Initiate a refund using Stripe API
    2. Save refund record into refunds table
    3. Update payment status if necessary
    4. Return refund details
    """
    try:
        # 1. Create refund in Stripe
        refund = stripe.Refund.create(
            payment_intent=payment_id,
            amount=data.get("amount"),   # None → full refund
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
        return {"error": str(e)}, 400


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
        payment.amount -= deduction

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
def initiate_donation(data: dict, db: Session):
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
        return {"error": str(e)}, 400


def donation_history(user_id: str, db: Session):
    """
    Retrieve the donation history of a specific user.
    """
    donations = (
        db.query(Donation)
        .filter_by(user_id=user_id)
        .order_by(Donation.created_at.desc())
        .all()
    )

    return {
        "donations": [
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
    }


async def stripe_webhook(request: Request, db: Session):
    """
    Handle Stripe webhook events:
    - Verify signature
    - Process event types (payments + donations)
    - Update DB accordingly
    """
    payload = await request.body()
    sig_header = request.headers.get("Stripe-Signature")
    endpoint_secret = os.getenv("STRIPE_WEBHOOK_SECRET")

    try:
        # 1. Verify signature
        event = stripe.Webhook.construct_event(
            payload=payload,
            sig_header=sig_header,
            secret=endpoint_secret
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")

    event_type = event["type"]
    obj = event["data"]["object"]

    # -------------------------
    # PaymentIntent succeeded
    # -------------------------
    if event_type == "payment_intent.succeeded":
        payment_id = obj["id"]
        metadata = obj.get("metadata", {})
        intent_type = metadata.get("type", "payment")

        if intent_type == "donation":
            donation = db.query(Donation).filter_by(donation_id=payment_id).first()
            if donation:
                donation.status = "succeeded"
                db.commit()
            log_event(db, "donation_succeeded", reference_id=payment_id, actor="system")
        else:
            payment = db.query(Payment).filter_by(payment_id=payment_id).first()
            if payment:
                payment.status = "succeeded"
                db.commit()
            log_event(db, "payment_succeeded", reference_id=payment_id, actor="system")

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