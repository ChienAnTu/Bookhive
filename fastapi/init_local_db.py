"""
Database initialization script for local development
Creates all tables and adds initial test data
"""

from sqlalchemy import create_engine
from database.connection import engine
from models.base import Base
from models.user import User
from models.book import Book
from models.cart import Cart
from models.message import Message
from models.complaint import Complaint
from models.review import Review
from models.order import Order
from models.checkout import Checkout
from models.service_fee import ServiceFee
from models.ban import Ban
from models.blacklist import Blacklist
from database.connection import SessionLocal
from utils.password import hash_password
import uuid

def init_database():
    """Create all database tables"""
    print("Creating database tables...")
    try:
        Base.metadata.create_all(bind=engine)
        print("✅ All tables created successfully!")
        
        # Add test users
        add_test_data()
        
    except Exception as e:
        print(f"❌ Error creating tables: {e}")
        raise e

def add_test_data():
    """Add initial test data"""
    print("Adding test data...")
    db = SessionLocal()
    
    try:
        # Check if users already exist
        existing_user = db.query(User).filter(User.email == "test@example.com").first()
        if existing_user:
            print("Test data already exists, skipping...")
            return
        
        # Create test users
        test_user = User(
            user_id=str(uuid.uuid4()),
            name="Test User",
            email="test@example.com",
            password_hash=hash_password("password123"),
            phone_number="1234567890",
            street_address="123 Test Street",
            city="Test City"
        )
        
        admin_user = User(
            user_id="admin",
            name="Admin User",
            email="admin@bookhive.com",
            password_hash=hash_password("admin123"),
            phone_number="0987654321",
            street_address="456 Admin Street",
            city="Admin City"
        )
        
        db.add(test_user)
        db.add(admin_user)
        db.commit()
        
        print("✅ Test data added successfully!")
        print("Test User - Email: test@example.com, Password: password123")
        print("Admin User - Email: admin@bookhive.com, Password: admin123")
        
    except Exception as e:
        print(f"❌ Error adding test data: {e}")
        db.rollback()
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    init_database()