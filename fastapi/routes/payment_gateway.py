# fastapi/routes/payment_gateway.py
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel

from core.dependencies import get_db
from services import payment_gateway_service
from models.payment_gateway import (
    PaymentInitiateRequest,
    PaymentStatusResponse,
    PaymentRefundRequest,
    DisputeCreateRequest,
    PaymentDisputeRequest,
    DonationInitiateRequest,
    DonationResponse,
    StripeWebhookEvent
)

router = APIRouter(prefix="/payment_gateway", tags=["Payment_gateway"])

# -------- DTO for new endpoints --------
class PaymentConfirmRequest(BaseModel):
    payment_id: str
    checkout_id: str | None = None  # Allow empty string, service will use PI.metadata to fill in
    user_id: str

class OrderActionRequest(BaseModel):
    note: str | None = None
    refund_cents: int | None = None

class OrderShipRequest(BaseModel):
    carrier: str | None = None
    tracking_number: str | None = None
    tracking_url: str | None = None


# ---------------------------
# Payment API
# ---------------------------

@router.post("/payment/initiate", status_code=status.HTTP_201_CREATED)
def initiate_payment(body: PaymentInitiateRequest, db: Session = Depends(get_db)):
    """
    Initiate a payment:
    - Stripe PaymentIntent (platform charge)
    - Save payment record
    - Return client_secret
    """
    try:
        result = payment_gateway_service.initiate_payment(body.dict(), db)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/payment/status/{payment_id}", response_model=PaymentStatusResponse, status_code=status.HTTP_200_OK)
def get_payment_status(payment_id: str, db: Session = Depends(get_db)):
    """
    Retrieve payment status from Stripe (minimal fields to match response_model)
    """
    try:
        result = payment_gateway_service.get_payment_status(payment_id, db)
        if isinstance(result, tuple) and len(result) == 2:  # error case
            raise HTTPException(status_code=400, detail=result[0].get("error"))
        return {"payment_id": result["payment_id"], "status": result["status"]}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/payment/status/sync/{payment_id}", status_code=status.HTTP_200_OK)
def sync_payment_status(payment_id: str, db: Session = Depends(get_db)):
    """
    Pull latest status from Stripe and write back to DB payments.status.
    Useful when webhook is not configured in local dev.
    """
    try:
        return payment_gateway_service.sync_payment_status(payment_id, db)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/payment/cancel/{payment_id}", status_code=status.HTTP_200_OK)
def cancel_payment(payment_id: str, db: Session = Depends(get_db)):
    """
    Cancel a Stripe PaymentIntent (only if it hasn't succeeded).
    Also updates payments.status to 'canceled'.
    """
    try:
        result = payment_gateway_service.cancel_payment(payment_id, db)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/payment/refund/{payment_id}", status_code=status.HTTP_200_OK)
def refund_payment(payment_id: str, body: PaymentRefundRequest, db: Session = Depends(get_db)):
    try:
        result = payment_gateway_service.refund_payment(payment_id, body.dict(), db)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/payment/dispute/create/{payment_id}", status_code=status.HTTP_201_CREATED)
def create_dispute(payment_id: str, body: DisputeCreateRequest, db: Session = Depends(get_db)):
    try:
        result = payment_gateway_service.create_dispute(payment_id, body.dict(), db)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/payment/dispute/handle/{payment_id}", status_code=status.HTTP_200_OK)
def handle_dispute(payment_id: str, body: PaymentDisputeRequest, db: Session = Depends(get_db)):
    try:
        result = payment_gateway_service.handle_dispute(payment_id, body.dict(), db)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ---------------------------
# Logs
# ---------------------------

@router.get("/payment/logs/{limit}", status_code=200)
def get_audit_logs(limit: int, db: Session = Depends(get_db)):
    try:
        result = payment_gateway_service.view_logs(db, limit)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ---------------------------
# Donation
# ---------------------------

@router.post("/payment/donation/initiate", status_code=status.HTTP_201_CREATED)
def initiate_donation(body: DonationInitiateRequest, db: Session = Depends(get_db)):
    try:
        result = payment_gateway_service.initiate_donation(body.dict(), db)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/payment/donation/history", response_model=list[DonationResponse], status_code=status.HTTP_200_OK)
def donation_history(user_id: str, db: Session = Depends(get_db)):
    try:
        result = payment_gateway_service.donation_history(user_id, db)
        return result["donations"]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ---------------------------
# New: Payment confirm & order flows
# ---------------------------

@router.post("/payment/confirm", status_code=status.HTTP_200_OK)
def confirm_payment(body: PaymentConfirmRequest, db: Session = Depends(get_db)):
    """
    Payment succeeded → create orders and payment_splits
    """
    from fastapi import HTTPException as FastAPIHTTPException  # local alias
    try:
        result = payment_gateway_service.confirm_payment_and_create_orders(
            db,
            payment_id=body.payment_id,
            checkout_id=(body.checkout_id or ""),  # Allow empty string, service will use PI.metadata to fill in
            user_id=body.user_id
        )
        return result
    except FastAPIHTTPException as he:
        raise he
    except Exception as e:
        raise FastAPIHTTPException(status_code=400, detail=str(e) or "Unknown error in payment/confirm")


@router.post("/order/{order_id}/complete", status_code=status.HTTP_200_OK)
def complete_purchase_order(order_id: str, db: Session = Depends(get_db)):
    """
    Purchase complete:
      1) transfer (sale + shipping) to seller (connected account)
      2) mark order COMPLETED (and set book to 'sold')
    """
    try:
        # 1) Transfer funds
        transfer_result = payment_gateway_service.transfer_for_order(db, order_id=order_id)
        # 2) Mark as completed + book marked as sold
        from services.order_service import OrderService
        OrderService.complete_purchase(db, order_id)
        return transfer_result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/order/{order_id}/return-complete", status_code=status.HTTP_200_OK)
def complete_borrow_order(order_id: str, body: OrderActionRequest, db: Session = Depends(get_db)):
    """
    Borrow return complete → refund deposit (full or partial).
    On success, mark order COMPLETED and set books back to 'listed'.
    """
    try:
        result = payment_gateway_service.refund_deposit_for_order(
            db, order_id=order_id, amount_cents=body.refund_cents
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/order/{order_id}/mark-shipped", status_code=status.HTTP_200_OK)
def mark_borrow_order_shipped(order_id: str, body: OrderShipRequest | None = None, db: Session = Depends(get_db)):
    """
    Borrow/Purchase shipped (optional) → record shipping info; transfer shipping (and sale for purchase) to lender.
    """
    try:
        result = payment_gateway_service.transfer_for_order(
            db,
            order_id=order_id,
            carrier=(body.carrier if body else None),
            tracking_number=(body.tracking_number if body else None),
            tracking_url=(body.tracking_url if body else None),
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ---------------------------
# Webhooks
# ---------------------------

@router.post("/payment/webhook", status_code=status.HTTP_200_OK)
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.body()
    sig_header = request.headers.get("Stripe-Signature")

    try:
        result = payment_gateway_service.stripe_webhook(payload, sig_header, db)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
