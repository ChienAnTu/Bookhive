from fastapi import APIRouter, Depends, HTTPException, status
from datetime import date
from pydantic import BaseModel
from typing import Optional

from core.dependencies import get_db,get_current_user
from models.user import User
from models.user import User as UserModel
from sqlalchemy.orm import Session


router = APIRouter(prefix="/user", tags=["User"])


class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    location: Optional[str] = None
    avatar: Optional[str] = None
    profilePicture: Optional[str] = None

    firstName: Optional[str] = None
    lastName: Optional[str] = None
    phoneNumber: Optional[str] = None
    dateOfBirth: Optional[str] = None 

    country: Optional[str] = None
    streetAddress: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zipCode: Optional[str] = None

    createdAt: str


# DateOfBirth 
class DateOfBirth(BaseModel):
    month: str
    day: str
    year: str

# UserUpdate model
class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    name: Optional[str] = None
    email: Optional[str] = None
    phone_number: Optional[str] = None
    date_of_birth: Optional[str] = None   #"YYYY-MM-DD"

    country: Optional[str] = None
    street_address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None

    avatar: Optional[str] = None
    profile_picture: Optional[str] = None


@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    """
    Get current user profile (GET /user/me).

    - Returns the authenticated user's information.
    - Includes id, name, email, location, avatar, and createdAt timestamp.
    """
    return UserResponse(
        id=current_user.user_id,
        name=current_user.name,
        email=current_user.email,
        location=current_user.location,
        avatar=current_user.avatar,
        profilePicture=current_user.profile_picture,

        firstName=current_user.first_name,
        lastName=current_user.last_name,
        phoneNumber=current_user.phone_number,
        dateOfBirth=(current_user.date_of_birth.isoformat() if current_user.date_of_birth else None),

        country=current_user.country,
        streetAddress=current_user.street_address,
        city=current_user.city,
        state=current_user.state,
        zipCode=current_user.zip_code,

        createdAt=current_user.created_at.isoformat()
    )



@router.put("/{user_id}")
def update_user(
    user_id: str,
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Update user information (PUT /user/{user_id}).

    - Only the authenticated user can update their own profile.
    - Supports partial updates: only provided fields are changed.
    - Returns the updated user as JSON.

    Raises:
    - 403: If trying to update another user.
    - 404: If the user does not exist.
    """
    if user_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this user")

    db_user = db.query(UserModel).filter(UserModel.user_id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    update_data = user_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_user, field, value)

    db.commit()
    db.refresh(db_user)
    return db_user