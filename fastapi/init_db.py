"""
Database initialization script
Creates all tables for local development
"""

from sqlalchemy import create_engine
from database.connection import engine
from models.base import Base

# Import all models to ensure they are registered
from models.user import User
from models.book import Book
from models.cart import Cart
from models.message import Message
from models.complaint import Complaint
from models.review import Review
from models.order import Order
from models.checkout import Checkout
from models.service_fee import ServiceFee
from models.ban import Ban, BanHistory
from models.blacklist import Blacklist

def init_database():
    """Create all database tables"""
    print("Creating database tables...")
    try:
        Base.metadata.create_all(bind=engine)
        print("✅ All tables created successfully!")
    except Exception as e:
        print(f"❌ Error creating tables: {e}")

if __name__ == "__main__":
    init_database()