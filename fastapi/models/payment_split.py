# models/payment_split.py
from sqlalchemy import Column, String, Integer, DateTime
from sqlalchemy.sql import func
from models.base import Base

class PaymentSplit(Base):
    __tablename__ = "payment_splits"

    id = Column(Integer, primary_key=True, autoincrement=True)
    payment_id = Column(String(255), nullable=False)             # Stripe PaymentIntent ID
    order_id = Column(String(36), nullable=False)
    owner_id = Column(String(25), nullable=False)
    connected_account_id = Column(String(64), nullable=False)
    currency = Column(String(10), nullable=False, default="aud")

    # Amount stored in cents
    deposit_cents = Column(Integer, nullable=False, default=0)
    shipping_cents = Column(Integer, nullable=False, default=0)
    service_fee_cents = Column(Integer, nullable=False, default=0)
    transfer_amount_cents = Column(Integer, nullable=False, default=0)

    # Transfer result
    transfer_id = Column(String(255), nullable=True)
    transfer_status = Column(String(50), nullable=True)

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

