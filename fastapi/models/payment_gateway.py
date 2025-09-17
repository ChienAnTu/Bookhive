from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func
from pydantic import BaseModel, Field
from typing import Optional, List
from sqlalchemy.orm import declarative_base, relationship
from models.base import Base
import uuid


# --- ORM Models ---

# ---------------------------
# Payments Table
# ---------------------------
class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    payment_id = Column(String(255), unique=True, nullable=False)  # Stripe PaymentIntent ID
    user_id = Column(String(255), nullable=False)
    amount = Column(Integer, nullable=False)                       # total in cents
    currency = Column(String(10), default="usd")
    status = Column(String(50), default="pending")

    deposit = Column(Integer, default=0)
    shipping_fee = Column(Integer, default=0)
    service_fee = Column(Integer, default=0)

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
 
    destination = Column(String(100), default="destination")
    action_type = Column(String(20), nullable=False)  # BORROW / PURCHASE

    # Relationship to refunds
    refunds = relationship("Refund", back_populates="payment")
    # Relationship to disputes
    disputes = relationship("Dispute", back_populates="payment")
    orders = relationship("Order", back_populates="payment")

# ---------------------------
# Refunds Table
# ---------------------------
class Refund(Base):
    __tablename__ = "refunds"

    id = Column(Integer, primary_key=True, autoincrement=True)
    refund_id = Column(String(255), unique=True, nullable=False)   # Stripe Refund ID
    payment_id = Column(String(255), ForeignKey("payments.payment_id"), nullable=False)
    amount = Column(Integer, nullable=False)
    currency = Column(String(10), default="usd")
    status = Column(String(50), default="succeeded")
    reason = Column(String(255), nullable=True)

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationship back to Payment
    payment = relationship("Payment", back_populates="refunds")

# ---------------------------
# Dispute Table
# ---------------------------
class Dispute(Base):
    __tablename__ = "disputes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    dispute_id = Column(String(255), unique=True, nullable=False, default=lambda: str(uuid.uuid4()))
    payment_id = Column(String(255), ForeignKey("payments.payment_id"), nullable=False)
    user_id = Column(String(255), nullable=False)

    reason = Column(String(255), nullable=False)   # e.g., "damaged book", "late return"
    note = Column(String(255), nullable=True)      # additional details from user
    status = Column(String(50), default="open")    # open / resolved
    deduction = Column(Integer, default=0)         # amount in cents deducted from deposit
    created_at = Column(DateTime, server_default=func.now())

    # Relationship back to Payment
    payment = relationship("Payment", back_populates="disputes")

# ---------------------------
# AuditLog Table
# ---------------------------
class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    event_type = Column(String(100), nullable=False)
    reference_id = Column(String(255), nullable=True)
    actor = Column(String(255), nullable=True)   # user_id or "system"
    message = Column(String(500), nullable=True)
    created_at = Column(DateTime, server_default=func.now())

# ---------------------------
# Donation Table
# ---------------------------
class Donation(Base):
    __tablename__ = "donations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    donation_id = Column(String(255), unique=True, nullable=False)
    user_id = Column(String(255), nullable=False)
    amount = Column(Integer, nullable=False)
    currency = Column(String(10), default="usd")
    status = Column(String(50), default="pending")
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


# --- Payment Pydantic Schemas ---

class PaymentInitiateRequest(BaseModel):
    user_id: str = Field(..., description="ID of the user making the payment")
    amount: int = Field(..., description="Total amount in cents")
    currency: str = Field(..., example="usd", description="Currency code (e.g., usd, aud)")
    deposit: Optional[int] = Field(0, description="Security deposit in cents")
    purchase: Optional[int] = Field(0, description="Purchase fee")
    shipping_fee: Optional[int] = Field(0, description="Shipping fee in cents")
    service_fee: Optional[int] = Field(0, description="Platform service fee in cents")
    lender_account_id: str = Field(..., description="Stripe connected account ID of the lender (e.g., acct_123...)")
    checkout_id: str = Field(..., description="Checkout id")


class PaymentStatusResponse(BaseModel):
    payment_id: str
    status: str
    amount: int
    currency: str


class DistributeShippingFeeRequest(BaseModel):
    lender_account_id: str = Field(..., description="Connected account ID to receive the transfer")


class PaymentRefundRequest(BaseModel):
    reason: Optional[str] = Field(None, description="Reason for the refund")


class DisputeCreateRequest(BaseModel):
    payment_id: str
    user_id: str
    reason: str
    note: Optional[str] = None


class PaymentDisputeRequest(BaseModel):
    action: str = Field(..., description="Action to take (adjust, refund, reject)")
    note: Optional[str] = Field(None, description="Admin note for dispute handling")
    deduction: Optional[int] = Field(
        None,
        description="Amount in cents to keep when action=adjust"
    )


class TransactionResponse(BaseModel):
    transaction_id: str
    type: str
    amount: int
    status: str


# ---------------------------
# Donation
# ---------------------------

class DonationInitiateRequest(BaseModel):
    user_id: str
    amount: int = Field(..., description="Donation amount in cents")
    currency: str = Field(..., example="usd")


class DonationResponse(BaseModel):
    donation_id: str
    amount: int
    status: str


# ---------------------------
# Webhook
# ---------------------------

class StripeWebhookEvent(BaseModel):
    raw_payload: str
    sig_header: str
