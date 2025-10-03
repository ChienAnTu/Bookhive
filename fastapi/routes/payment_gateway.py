import os
import stripe
import traceback
from fastapi import APIRouter, Depends, HTTPException, status, Request, Header, Body
from core.config import settings
from services import payment_gateway_service
from sqlalchemy.orm import Session
from core.dependencies import get_db
from models.payment_gateway import (
    PaymentInitiateRequest,
    PaymentStatusResponse,
    DistributeShippingFeeRequest,
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

@router.post("/accounts/express", status_code=status.HTTP_201_CREATED)
def create_express_account_route(email: str = Body(..., embed=True), db: Session = Depends(get_db)):
    """
    Create a Stripe Express Connected Account with manual payout schedule.
    - Calls Stripe API to create account
    - Sets payout to manual
    - Returns onboarding link
    """
    try:
        result = payment_gateway_service.create_express_account(email=email, db=db)
        return result
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/payment/initiate", status_code=status.HTTP_201_CREATED)
def initiate_payment(body: PaymentInitiateRequest, db: Session = Depends(get_db)):
    """
    Initiate a payment:
    - Calls Stripe API to create PaymentIntent with lender destination
    - Saves payment record into DB
    - Returns client_secret for frontend
    """
    try:
        result = payment_gateway_service.initiate_payment(body.dict(), db=db)
        return result
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/payment/status/{payment_id}", response_model=PaymentStatusResponse, status_code=status.HTTP_200_OK)
def get_payment_status(payment_id: str):
    """
    Retrieve the status of a payment:
    - Fetch status from Stripe
    - Update local DB record if found
    - Return current status
    """
    try:
        result = payment_gateway_service.get_payment_status_service(payment_id)
        return result
    except Exception as e:
        traceback.print_exc()
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
        result = payment_gateway_service.capture_payment(payment_id, db=db)
        return result
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=str(e))
    

@router.post("/payment/distribute_shipping_fee/{payment_id}", status_code=status.HTTP_200_OK)
def distribute_shipping_fee(payment_id: str, body: DistributeShippingFeeRequest, db: Session = Depends(get_db)):
    """
    Distribute the shipping fee to the lender:
    - Retrieve the corresponding PaymentIntent ID
    - Create a Stripe Transfer for the shipping fee amount
    - Optionally record the transfer in the local database
    - Return the transfer confirmation details
    """
    try:
        result = payment_gateway_service.distribute_shipping_fee(payment_id, body.dict(), db=db)
        return result
    except Exception as e:
        traceback.print_exc()
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
        result = payment_gateway_service.refund_payment(payment_id, body.dict(), db=db)
        return result
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/payment/compensate/{payment_id}", status_code=status.HTTP_200_OK)
def compensate_payment(payment_id: str, destination: str, db: Session = Depends(get_db)):
    """
    Compensate payment after dispute resolution:
    - Transfer partial compensation to owner 
    - Record transaction in DB
    """
    try:
        result = payment_gateway_service.compensate_payment(payment_id, destination, db=db)
        return result
    except Exception as e:
        traceback.print_exc()
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
        traceback.print_exc()
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
        result = payment_gateway_service.handle_dispute(payment_id, body.dict(), db=db)
        return result
    except Exception as e:
        traceback.print_exc()
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
        traceback.print_exc()
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
        result = payment_gateway_service.initiate_donation(body.dict(), db=db)
        return result
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/payment/donation/history", response_model=list[DonationResponse], status_code=status.HTTP_200_OK)
def donation_history(user_id: str, db: Session = Depends(get_db)):
    """
    Retrieve donation history:
    - Query donation records for the current user
    - Return list of donation transactions
    """
    try:
        result = payment_gateway_service.donation_history(user_id, db=db)
        return result
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=str(e))


# ---------------------------
# Webhooks
# ---------------------------

@router.post("/payment/webhook", status_code=status.HTTP_200_OK)
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.body()
    sig_header = request.headers.get("Stripe-Signature")

    endpoint_secret = os.getenv("STRIPE_WEBHOOK_SECRET")
    print(">>> ENV SECRET:", endpoint_secret)
    print(">>> HEADER SIG:", sig_header)
    print(">>> RAW PAYLOAD:", payload[:200])
    
    try:
        # 1. Verify signature
        event = stripe.Webhook.construct_event(
            payload=payload,
            sig_header=sig_header,
            secret=endpoint_secret
        )
    except Exception as e:
        print("=== Webhook Error ===")
        print(f"Payload: {payload}")
        print(f"Sig header: {sig_header}")
        print(f"Error: {repr(e)}") 
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=f"Webhook error: {str(e)}")

    event_type = await payment_gateway_service.stripe_webhook(event, db=db)
    return {"message": "Webhook received", "event": event_type}
