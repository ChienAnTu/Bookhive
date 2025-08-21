"""
Handles user creation and authentication logic.
"""
import uuid
from sqlalchemy.orm import Session
from models.user import User
from core.security import verify_password

class AuthService:
    def __init__(self, db: Session):
        self.db = db
    
    def get_user_by_email(self, email: str) -> User | None:
        return self.db.query(User).filter(User.email == email).first()
    
    def authenticate_user(self, email: str, password: str) -> User | None:
        user = self.get_user_by_email(email)
        if not user:
            return None
        if not verify_password(password, user.password_hash):
            return None
        return user
    
    def generate_user_id(self) -> str:
        return str(uuid.uuid4())[:25]  # Truncate to match DB schema
    
    # No other methods; keeping focused on auth