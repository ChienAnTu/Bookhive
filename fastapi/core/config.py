"""
Configuration for the API
"""

import os
from dotenv import load_dotenv
from typing import List

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
        
        # CORS (optional, with default)
        allowed_origins_str = os.getenv('ALLOWED_ORIGINS', '*')
        self.ALLOWED_ORIGINS = [origin.strip() for origin in allowed_origins_str.split(',')]

# Instantiate settings (will raise errors if required vars are missing)
settings = Settings()