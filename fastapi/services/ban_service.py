from sqlalchemy.orm import Session
from models.ban import Ban
import uuid

class BanService:
    @staticmethod
    def create(db: Session, user_id: str, reason: str, banned_by: str) -> Ban:
        ban = Ban(
            ban_id=str(uuid.uuid4()),
            user_id=user_id,
            reason=reason,
            banned_by=banned_by
        )
        db.add(ban)
        db.commit()
        db.refresh(ban)
        return ban

    @staticmethod
    def list_all(db: Session) -> list[Ban]:
        return db.query(Ban).all()

    @staticmethod
    def get(db: Session, ban_id: str) -> Ban | None:
        return db.query(Ban).filter(Ban.ban_id == ban_id).first()

    @staticmethod
    def unban(db: Session, ban_id: str) -> Ban | None:
        ban = BanService.get(db, ban_id)
        if ban:
            ban.is_active = False
            db.commit()
            db.refresh(ban)
        return ban
