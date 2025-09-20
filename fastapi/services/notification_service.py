import uuid
from sqlalchemy.orm import Session
from models.notification import Notification

class NotificationService:
    def __init__(self, db: Session):
        self.db = db

    def generate_notification_id(self) -> str:
        return str(uuid.uuid4())[:25]

    def create_notification(self, user_id: str, title: str, message: str, notification_type: str) -> Notification:
        notification = Notification(
            notification_id=self.generate_notification_id(),
            user_id=user_id,
            title=title,
            message=message,
            notification_type=notification_type
        )
        self.db.add(notification)
        self.db.commit()
        self.db.refresh(notification)
        return notification

    def get_user_notifications(self, user_id: str, unread_only: bool = False):
        query = self.db.query(Notification).filter(Notification.user_id == user_id)
        if unread_only:
            query = query.filter(Notification.is_read == False)
        return query.order_by(Notification.timestamp.desc()).all()

    def mark_as_read(self, notification_id: str):
        notification = self.db.query(Notification).filter(Notification.notification_id == notification_id).first()
        if notification:
            notification.is_read = True
            self.db.commit()
            self.db.refresh(notification)
        return notification
