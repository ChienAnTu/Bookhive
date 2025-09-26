from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.dependencies import get_db, get_current_user
from models.user import User as UserModel
from services.blacklist_service import BlacklistService
from pydantic import BaseModel

class BlacklistCreate(BaseModel):
    blocked_user_id: str

router = APIRouter(prefix="/blacklists", tags=["blacklists"])

@router.post("")
def add_to_blacklist(
    body: BlacklistCreate,
    db: Session = Depends(get_db),
    user: UserModel = Depends(get_current_user)
):
    try:
        BlacklistService.add(db, user.user_id, body.blocked_user_id)
        return {"message": "User added to blacklist"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{blocked_user_id}")
def remove_from_blacklist(
    blocked_user_id: str,
    db: Session = Depends(get_db),
    user: UserModel = Depends(get_current_user)
):
    removed = BlacklistService.remove(db, user.user_id, blocked_user_id)
    if not removed:
        raise HTTPException(status_code=404, detail="User not found in blacklist")
    return {"message": "User removed from blacklist"}

@router.get("")
def list_blacklist(
    db: Session = Depends(get_db),
    user: UserModel = Depends(get_current_user)
) -> list[str]:
    return BlacklistService.list_blocked(db, user.user_id)
