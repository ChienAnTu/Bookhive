from fastapi import APIRouter, Depends, HTTPException, status
from datetime import date, datetime
from pydantic import BaseModel, Field
from typing import Optional, Union

from core.dependencies import get_db,get_current_user
from models.user import User
from models.user import User as UserModel
from sqlalchemy.orm import Session
from services.blacklist_service import BlacklistService


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
    first_name: Optional[str] = Field(None, alias="firstName")
    last_name: Optional[str] = Field(None, alias="lastName")
    name: Optional[str] = Field(None, alias="name")
    email: Optional[str] = Field(None, alias="email")
    phone_number: Optional[str] = Field(None, alias="phoneNumber")
    date_of_birth: Optional[str] = Field(None, alias="dateOfBirth")  # "YYYY-MM-DD"

    country: Optional[str] = Field(None, alias="country")
    street_address: Optional[str] = Field(None, alias="streetAddress")
    city: Optional[str] = Field(None, alias="city")
    state: Optional[str] = Field(None, alias="state")
    zip_code: Optional[str] = Field(None, alias="zipCode")

    avatar: Optional[str] = Field(None, alias="avatar")
    profile_picture: Optional[str] = Field(None, alias="profilePicture")

    class Config:
        allow_population_by_field_name = True


# ------------Helper: Covert ORM to UserResponse--------------------
def _to_user_response(u: User) -> UserResponse:
    dob = getattr(u, "date_of_birth", None)
    if isinstance(dob, (date, datetime)):
        dob_out = dob.isoformat()
    elif isinstance(dob, str) and dob.strip():
        dob_out = dob
    else:
        dob_out = None

    created = getattr(u, "created_at", None)
    created_out = created.isoformat() if isinstance(created, (date, datetime)) else created

    return UserResponse(
        id=str(getattr(u, "user_id", "")),
        name=getattr(u, "name", ""),
        email=getattr(u, "email", ""),
        location=getattr(u, "location", None),
        avatar=getattr(u, "avatar", None),
        profilePicture=getattr(u, "profile_picture", None),

        firstName=getattr(u, "first_name", None),
        lastName=getattr(u, "last_name", None),
        phoneNumber=getattr(u, "phone_number", None),
        dateOfBirth=dob_out,

        country=getattr(u, "country", None),
        streetAddress=getattr(u, "street_address", None),
        city=getattr(u, "city", None),
        state=getattr(u, "state", None),
        zipCode=(str(getattr(u, "zip_code", None))
                 if getattr(u, "zip_code", None) is not None else None),

        createdAt=created_out,
    )


@router.get("/me", response_model=UserResponse, response_model_exclude_none=True)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    return _to_user_response(current_user)


# ===NEW: GET /user/{user_id} ===
@router.get("/{user_id}", response_model=UserResponse, response_model_exclude_none=True)
def get_user_by_id_login_only(
    user_id: str,
    db: Session = Depends(get_db),
    _: UserModel = Depends(get_current_user),  # Allow authenticated users only
):
    """
    Get a user's profile by ID (requires login).

    Raises:
    - 403: If actor is not authenticated.
    - 404: If the user does not exist. (Wrong ID)
    """
    u = db.query(UserModel).filter(UserModel.user_id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")

    # Check if target has blacklisted the current user
    if BlacklistService.is_blocked(db, user_id, _.user_id):
        raise HTTPException(status_code=403, detail="Access denied: You are blacklisted by this user")

    return _to_user_response(u)


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