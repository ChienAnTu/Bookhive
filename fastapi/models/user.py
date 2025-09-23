"""
User model for the API
"""

from sqlalchemy import Column, String, DateTime, Enum, Date
from sqlalchemy.sql import func
from models.base import Base

class User(Base):
    __tablename__ = "users"
    
    user_id = Column(String(25), primary_key=True, index=True)
    email = Column(String(50), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    password_algo = Column(Enum('argon2id', 'bcrypt', 'scrypt'), default='bcrypt', nullable=False)
    password_set_at = Column(DateTime, server_default=func.now(), nullable=False)
    
    # Additional fields matching frontend
    name = Column(String(100), nullable=False)
    location = Column(String(100))
    avatar = Column(String(255))
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    # update user information
    first_name     = Column(String(100), nullable=True)
    last_name      = Column(String(100), nullable=True)
    phone_number   = Column(String(20), nullable=True)
    date_of_birth  = Column(Date, nullable=True)
    country        = Column(String(100), nullable=True)
    street_address = Column(String(255), nullable=True)
    city           = Column(String(100), nullable=True)
    state          = Column(String(100), nullable=True)
    zip_code       = Column(String(20), nullable=True)
    profile_picture = Column(String(255), nullable=True)

    # Stripe Connect (lender payouts)
    stripe_account_id       = Column(String(64), nullable=True, index=True)  # e.g. "acct_1Pqxyz..."
    stripe_onboarding_status = Column(String(32), nullable=True, default="not_started")
    stripe_details_submitted = Column(String(5), nullable=True)   # "true"/"false" for portability
    stripe_payouts_enabled   = Column(String(5), nullable=True)   # "true"/"false"
    stripe_requirements_due  = Column(String(1000), nullable=True)  # JSON summary text from Stripe
    bank_last4               = Column(String(10), nullable=True)
