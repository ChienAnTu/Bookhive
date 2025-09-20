from fastapi import APIRouter, Depends, HTTPException, status, Request, Header
from core.config import settings
from services import payment_gateway_service
from sqlalchemy.orm import Session
from database import get_db
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

# -------- Helper --------



# -------- Routes --------
# ---------------------------
# Payment API
# ---------------------------

@router.post("/payment/initiate", status_code=status.HTTP_201_CREATED)
def initiate_payment(body: PaymentInitiateRequest, db: Session = Depends(get_db)):
    """
    Initiate a payment:
    - Calls Stripe API to create PaymentIntent with lender destination
    - Saves payment record into DB
    - Returns client_secret for frontend
    """
    try:
        result = payment_gateway_service.initiate_payment(body.dict(), db)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/payment/status/{payment_id}", response_model=PaymentStatusResponse, status_code=status.HTTP_200_OK)
def get_payment_status(payment_id: str, db: Session = Depends(get_db)):
    """
    Retrieve the status of a payment:
    - Fetch status from Stripe
    - Update local DB record if found
    - Return current status
    """
    try:
        result = payment_gateway_service.get_payment_status(payment_id, db)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/payment/capture/{payment_id}", status_code=status.HTTP_200_OK)
def capture_payment(payment_id: str, db: Session = Depends(get_db)):
    """
    Capture a held payment:
    - Retrieve PaymentIntent from Stripe
    - Capture the held deposit/funds
    - Update local DB record
    - Return confirmation details
    """
    try:
        result = payment_gateway_service.capture_payment(payment_id, db)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/payment/refund/{payment_id}", status_code=status.HTTP_200_OK)
def refund_payment(payment_id: str, body: PaymentRefundRequest, db: Session = Depends(get_db)):
    """
    Refund a payment:
    - Call Stripe Refund API
    - Insert refund record into DB
    - Update payment status accordingly
    - Return refund details
    """
    try:
        result = payment_gateway_service.refund_payment(payment_id, body.dict(), db)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/payment/dispute/create/{payment_id}", status_code=status.HTTP_201_CREATED)
def create_dispute(payment_id: str, body: DisputeCreateRequest, db: Session = Depends(get_db)):
    """
    Create a dispute:
    - User submits a dispute request
    - Insert dispute record into DB with status='open'
    - Return dispute confirmation
    """
    try:
        result = payment_gateway_service.create_dispute(payment_id, body.dict(), db)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/payment/dispute/handle/{payment_id}", status_code=status.HTTP_200_OK)
def handle_dispute(payment_id: str, body: PaymentDisputeRequest, db: Session = Depends(get_db)):
    """
    Handle an existing dispute:
    - Admin reviews the open dispute
    - Update dispute status (adjust / overrule)
    - Optionally update related payment record
    - Save admin note in DB
    """
    try:
        result = payment_gateway_service.handle_dispute(payment_id, body.dict(), db)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ---------------------------
# Log / History
# ---------------------------

@router.get("/payment/logs/{limit}", status_code=200)
def get_audit_logs(limit: int, db: Session = Depends(get_db)):
    """Admin-only: View audit logs of all payment actions"""
    try:
        result = payment_gateway_service.view_logs(db, limit)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ---------------------------
# Donation Support
# ---------------------------

@router.post("/payment/donation/initiate", status_code=status.HTTP_201_CREATED)
def initiate_donation(body: DonationInitiateRequest, db: Session = Depends(get_db)):
    """
    Initiate a donation:
    - Call Stripe API to create PaymentIntent for donation
    - Save donation record into DB
    - Return client_secret for frontend
    """
    try:
        result = payment_gateway_service.initiate_donation(body.dict(), db)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/payment/donation/history", response_model=list[DonationResponse], status_code=status.HTTP_200_OK)
def donation_history(db: Session = Depends(get_db)):
    """
    Retrieve donation history:
    - Query donation records for the current user
    - Return list of donation transactions
    """
    try:
        result = payment_gateway_service.donation_history(db)
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
        event_type = payment_gateway_service.stripe_webhook(payload, sig_header, db)
        return {"message": "Webhook received", "event": event_type}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


