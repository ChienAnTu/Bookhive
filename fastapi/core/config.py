"""
Configuration for the API
"""

import os
from dotenv import load_dotenv
from typing import List
import brevo_python
from brevo_python.rest import ApiException
import stripe 

# Load the root .env file (adjust path if your structure differs)
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), '.env'))

class Settings:
    def __init__(self):
        # App (non-sensitive defaults)
        self.APP_NAME = "BookHive API"
        self.VERSION = "1.0.0"
        
        # Database components (required; construct URL)
        db_user = os.getenv('DB_USER')
        db_password = os.getenv('DB_PASSWORD')
        db_host = os.getenv('DB_HOST')
        db_port = os.getenv('DB_PORT', '3306')  # Default port
        db_name = os.getenv('DB_NAME')
        
        if not all([db_user, db_password, db_host, db_name]):
            raise ValueError("Missing required database environment variables: DB_USER, DB_PASSWORD, DB_HOST, DB_NAME")
        
        self.DATABASE_URL = f"mysql+pymysql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"
        
        # Print for debugging (remove in production)
        print(f"Database Host: {db_host}")
        print(f"Constructed DATABASE_URL: {self.DATABASE_URL}")  # Warning: This prints sensitive info—remove after testing!
        
        # JWT (required)
        self.SECRET_KEY = os.getenv('SECRET_KEY')
        self.ALGORITHM = os.getenv('ALGORITHM')
        self.ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv('ACCESS_TOKEN_EXPIRE_MINUTES', 30))  # Default if missing, but we'll check
        
        if not self.SECRET_KEY:
            raise ValueError("Missing required SECRET_KEY in .env")
        if not self.ALGORITHM:
            raise ValueError("Missing required ALGORITHM in .env")
        if not os.getenv('ACCESS_TOKEN_EXPIRE_MINUTES'):  # Enforce presence, even with default
            print("Warning: ACCESS_TOKEN_EXPIRE_MINUTES not set in .env—using default (30)")
        
        # Brevo (required)
        brevo_api_key = os.getenv("BREVO_API_KEY")  # e.g. xkeysib-xxxxxxxxxxxxxxxxxxxxxxx
        brevo_key_type = os.getenv("BREVO_KEY_TYPE", "api-key")  # Default to 'api-key', or use 'partner-key'

        if not brevo_api_key:
            raise ValueError("Missing BREVO_API_KEY in .env")
        
        self.brevo_config = brevo_python.Configuration()
        self.brevo_config.api_key[brevo_key_type] = brevo_api_key

        # Stripe (required)
        stripe_api_key = os.getenv("STRIPE_SECRET_KEY")
        if not stripe_api_key:
            raise ValueError("Missing STRIPE_SECRET_KEY in .env")

        stripe.api_key = stripe_api_key

        # CORS (optional, with default)
        allowed_origins_str = os.getenv('ALLOWED_ORIGINS', '*')
        self.ALLOWED_ORIGINS = [origin.strip() for origin in allowed_origins_str.split(',')]

# Instantiate settings (will raise errors if required vars are missing)
settings = Settings()