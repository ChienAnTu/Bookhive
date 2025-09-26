from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from pydantic import BaseModel, EmailStr, field_validator  # Updated: Use field_validator for v2
from typing import Optional

from core.config import settings
from core.security import create_access_token, verify_password, get_password_hash
from core.dependencies import get_db, get_current_user
from services.auth_service import AuthService
from models.user import User
from models.ban import Ban

router = APIRouter(prefix="/auth", tags=["Authentication"])

# Pydantic models
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    confirm_password: str
    agree_terms: bool

    @field_validator("confirm_password")
    @classmethod
    def passwords_match(cls, v: str, info) -> str:
        password = info.data.get("password")
        if password and v != password:
            raise ValueError("Passwords do not match")
        return v

    @field_validator("agree_terms")
    @classmethod
    def terms_agreed(cls, v: bool, info) -> bool:
        if not v:
            raise ValueError("Must agree to terms")
        return v

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    location: Optional[str] = None
    avatar: Optional[str] = None
    createdAt: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

@router.post("/register", response_model=UserResponse)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    auth_service = AuthService(db)
    
    # Check if user exists
    if auth_service.get_user_by_email(user_data.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password
    hashed_password = get_password_hash(user_data.password)
    
    # Create user (location/avatar optional, can be updated later)
    user = User(
        user_id=auth_service.generate_user_id(),  # Assuming UUID in service
        name=user_data.name,
        email=user_data.email,
        password_hash=hashed_password,
        password_algo="bcrypt"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return UserResponse(
        id=user.user_id,
        name=user.name,
        email=user.email,
        location=user.location,
        avatar=user.avatar,
        createdAt=user.created_at.isoformat()
    )

@router.post("/login", response_model=Token)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    auth_service = AuthService(db)
    user = auth_service.authenticate_user(login_data.email, login_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Check if user is banned
    active_ban = db.query(Ban).filter(Ban.user_id == user.user_id, Ban.is_active == True).first()
    if active_ban:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Account is banned: {active_ban.reason}"
        )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token}

@router.post("/logout")
def logout(current_user: User = Depends(get_current_user)):
    # Client-side: clear token from storage
    # Optional: Implement token blacklist here if needed
    return {"message": "Logged out successfully"}

@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=current_user.user_id,
        name=current_user.name,
        email=current_user.email,
        location=current_user.location,
        avatar=current_user.avatar,
        createdAt=current_user.created_at.isoformat()
    )