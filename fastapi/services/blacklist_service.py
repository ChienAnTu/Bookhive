from sqlalchemy.orm import Session
from models.blacklist import Blacklist
import uuid

class BlacklistService:
    @staticmethod
    def add(db: Session, user_id: str, blocked_user_id: str) -> Blacklist:
        if user_id == blocked_user_id:
            raise ValueError("Cannot block yourself")
        existing = db.query(Blacklist).filter(
            Blacklist.user_id == user_id,
            Blacklist.blocked_user_id == blocked_user_id
        ).first()
        if existing:
            return existing
        blacklist = Blacklist(
            id=str(uuid.uuid4()),
            user_id=user_id,
            blocked_user_id=blocked_user_id
        )
        db.add(blacklist)
        db.commit()
        db.refresh(blacklist)
        return blacklist

    @staticmethod
    def remove(db: Session, user_id: str, blocked_user_id: str) -> bool:
        entry = db.query(Blacklist).filter(
            Blacklist.user_id == user_id,
            Blacklist.blocked_user_id == blocked_user_id
        ).first()
        if entry:
            db.delete(entry)
            db.commit()
            return True
        return False

    @staticmethod
    def list_blocked(db: Session, user_id: str) -> list[str]:
        blocked = db.query(Blacklist.blocked_user_id).filter(
            Blacklist.user_id == user_id
        ).all()
        return [b[0] for b in blocked]

    @staticmethod
    def is_blocked(db: Session, user_id: str, target_user_id: str) -> bool:
        return db.query(Blacklist).filter(
            Blacklist.user_id == user_id,
            Blacklist.blocked_user_id == target_user_id
        ).first() is not None
