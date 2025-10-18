from pydantic import BaseModel, EmailStr, validator
from datetime import date, datetime

class VerificationEmailRequest(BaseModel):
    emailAddress: EmailStr
    otp: str = ""


class ReceiptEmailRequest(BaseModel):
    email: EmailStr
    username: str
    total_amount: float
    order_id: str


class ShipmentConfirmationRequest(BaseModel):
    email: EmailStr
    username: str
    order_id: str
    tracking_number: str
    courier_name: str
    estimated_delivery_date: date  

    @validator("estimated_delivery_date", pre=True)
    def parse_estimated_delivery(cls, value):
        if isinstance(value, str):
            try:
                return datetime.strptime(value, "%d-%m-%Y").date()
            except ValueError:
                raise ValueError("estimated_delivery must be in DD-MM-YYYY format (e.g. 14-09-2025)")
        return value
