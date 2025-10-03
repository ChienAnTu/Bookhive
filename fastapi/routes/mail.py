from fastapi import APIRouter, Depends, HTTPException, status
from core.config import settings

import brevo_python
import random
import time

from typing import Dict
from brevo_python import SendSmtpEmail, TransactionalEmailsApi, ApiClient
from brevo_python.rest import ApiException
from sqlalchemy.orm import Session

from models.mail import VerificationEmailRequest, ReceiptEmailRequest, ShipmentConfirmationRequest

OTP_TTL_SECONDS = 600
otp_store: Dict[str, Dict[str, float]] = {}
router = APIRouter(prefix="/email", tags=["Email"])

# -------- Helper --------
def get_brevo_config():
    return settings.brevo_config

def set_otp(email: str, ttl_seconds: int = OTP_TTL_SECONDS) -> str:
    otp = str(random.randint(100000, 999999))
    otp_store[email] = {
        "otp": otp,
        "expires": time.time() + ttl_seconds
    }
    return otp

def get_otp(email: str) -> str:
    record = otp_store.get(email)
    if not record:
        return None
    if time.time() > record["expires"]:
        del otp_store[email]
        return None
    return record["otp"]

def delete_otp(email: str):
    if email in otp_store:
        del otp_store[email]


# -------- Routes --------
@router.post("/send_verification", status_code=status.HTTP_200_OK)
def send_verification_email(verificationEmailRequest: VerificationEmailRequest):
    
    configuration = get_brevo_config()
    api_instance = TransactionalEmailsApi(ApiClient(configuration))
    otp = set_otp(verificationEmailRequest.emailAddress)
    print("otp : " + otp)
    
    send_smtp_email = SendSmtpEmail(
        to=[{"email": verificationEmailRequest.emailAddress}],
        template_id=3,  
        params={
            "OTP": otp
        },
    )

    try:
        api_instance.send_transac_email(send_smtp_email)
    except ApiException as e:
        raise HTTPException(status_code=500, detail=f"Failed to send email: {e}")

    return {"message": "Verification email sent successfully."}

@router.post("/verify_otp", status_code=status.HTTP_200_OK)
def verify_otp(verificationEmailRequest: VerificationEmailRequest):
    email = verificationEmailRequest.emailAddress
    user_input_otp = verificationEmailRequest.otp

    stored_otp = get_otp(email)
    print(stored_otp)
    if stored_otp is None:
        raise HTTPException(status_code=404, detail="OTP not found or expired")
    
    if stored_otp != user_input_otp:
        raise HTTPException(status_code=400, detail="Incorrect OTP")
    
    delete_otp(email)
    return {"message": "OTP verified successfully"}



@router.post("/send_receipt", status_code=status.HTTP_200_OK)
def send_receipt_email(receipt_request: ReceiptEmailRequest):

    configuration = get_brevo_config()
    api_instance = TransactionalEmailsApi(ApiClient(configuration))

    send_smtp_email = SendSmtpEmail(
        to=[{"email": receipt_request.email}],
        template_id=4, 
        params={
            "username": receipt_request.username,
            "total_amount": f"${receipt_request.total_amount:.2f}",
            "order_id": receipt_request.order_id
        },
    )

    try:
        api_instance.send_transac_email(send_smtp_email)
    except ApiException as e:
        raise HTTPException(status_code=500, detail=f"Failed to send receipt email: {e}")

    return {"message": "Receipt email sent successfully."}


@router.post("/send_shipment_confirmation", status_code=status.HTTP_200_OK)
def send_shipment_confirmation_email(shipment_request: ShipmentConfirmationRequest):
    configuration = get_brevo_config()
    api_instance = TransactionalEmailsApi(ApiClient(configuration))

    send_smtp_email = SendSmtpEmail(
        to=[{"email": shipment_request.email}],
        template_id=5,  
        params={
            "order_id" : shipment_request.order_id,
            "username": shipment_request.username,
            "tracking_number": shipment_request.tracking_number,
            "carrier": shipment_request.courier_name,
            "estimated_delivery_date": shipment_request.estimated_delivery_date.strftime("%d/%m/%Y")
        },
    )

    try:
        api_instance.send_transac_email(send_smtp_email)
    except ApiException as e:
        raise HTTPException(status_code=500, detail=f"Failed to send shipment confirmation email: {e}")

    return {"message": "Shipment confirmation email sent successfully."}


