from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from core.dependencies import get_db, get_current_user
from models.user import User as UserModel
from services.ban_service import BanService
from pydantic import BaseModel
from datetime import datetime

class BanCreate(BaseModel):
    user_id: str
    reason: str

class BanRead(BaseModel):
    ban_id: str
    user_id: str
    reason: str
    banned_at: datetime
    banned_by: str
    is_active: bool

router = APIRouter(prefix="/bans", tags=["bans"])

def is_admin(user: UserModel) -> bool:
    return user.is_admin

@router.post("", status_code=status.HTTP_201_CREATED)
def create_ban(
    body: BanCreate,
    db: Session = Depends(get_db),
    user: UserModel = Depends(get_current_user)
) -> BanRead:
    if not is_admin(user):
        raise HTTPException(status_code=403, detail="Admin access required")
    ban = BanService.create(db, body.user_id, body.reason, user.user_id)
    return BanRead(**ban.__dict__)

@router.get("")
def list_bans(
    db: Session = Depends(get_db),
    user: UserModel = Depends(get_current_user)
) -> list[BanRead]:
    if not is_admin(user):
        raise HTTPException(status_code=403, detail="Admin access required")
    bans = BanService.list_all(db)
    return [BanRead(**b.__dict__) for b in bans]

@router.delete("/{ban_id}", status_code=status.HTTP_200_OK)
def unban(
    ban_id: str,
    db: Session = Depends(get_db),
    user: UserModel = Depends(get_current_user)
) -> BanRead:
    if not is_admin(user):
        raise HTTPException(status_code=403, detail="Admin access required")
    ban = BanService.unban(db, ban_id)
    if not ban:
        raise HTTPException(status_code=404, detail="Ban not found")
    return BanRead(**ban.__dict__)
