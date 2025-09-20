from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig

from core.dependencies import get_db, get_current_user
from services.notification_service import NotificationService
from models.notification import Notification
from models.user import User
from routes.message_routes import manager  # Import manager for real-time notifications

import os
from dotenv import load_dotenv

# Load the root .env file (adjust path if your structure differs)
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), '.env'))

router = APIRouter(prefix="/notifications", tags=["Notifications"])

# Email configuration (update with your Gmail credentials; use app password for security)
conf = ConnectionConfig(
    MAIL_USERNAME=os.getenv("MAIL_USERNAME"),
    MAIL_PASSWORD=os.getenv("MAIL_PASSWORD"),
    MAIL_FROM="do-not-reply@bookhive.com",  # Required: sender email
    MAIL_PORT=587,
    MAIL_SERVER="smtp.gmail.com",
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True
)
class NotificationCreate(BaseModel):
    user_email: str
    title: str
    message: str
    notification_type: str

class NotificationResponse(BaseModel):
    notification_id: str
    title: str
    message: str
    notification_type: str
    is_read: bool
    timestamp: str

@router.post("/create", response_model=NotificationResponse)
async def create_notification(
    notif_data: NotificationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    target_user = db.query(User).filter(User.email == notif_data.user_email).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    # Check permissions if needed, e.g., if current_user is admin
    service = NotificationService(db)
    notification = service.create_notification(target_user.user_id, notif_data.title, notif_data.message, notif_data.notification_type)
    
    # Send real-time update via WebSocket
    ws_message = {
        "type": "notification",
        "data": {
            "title": notification.title,
            "message": notification.message,
            "timestamp": notification.timestamp.isoformat()
        }
    }
    await manager.send_personal_message(ws_message, target_user.user_id)
    
    # Send email notification
    email_template = f"""
    <html>
    <body>
        <h1>{notification.title}</h1>
        <p>{notification.message}</p>
        <p>Type: {notification.notification_type}</p>
        <p>Sent at: {notification.timestamp.isoformat()}</p>
    </body>
    </html>
    """
    
    email_message = MessageSchema(
        subject=notification.title,
        recipients=[""],
        body=email_template,
        subtype="html"
    )
    
    fm = FastMail(conf)
    await fm.send_message(email_message)
    
    return NotificationResponse(
        notification_id=notification.notification_id,
        title=notification.title,
        message=notification.message,
        notification_type=notification.notification_type,
        is_read=notification.is_read,
        timestamp=notification.timestamp.isoformat()
    )

@router.get("/", response_model=List[NotificationResponse])
def get_notifications(
    unread_only: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = NotificationService(db)
    notifications = service.get_user_notifications(current_user.user_id, unread_only)
    return [
        NotificationResponse(
            notification_id=n.notification_id,
            title=n.title,
            message=n.message,
            notification_type=n.notification_type,
            is_read=n.is_read,
            timestamp=n.timestamp.isoformat()
        ) for n in notifications
    ]

@router.post("/{notification_id}/read")
def mark_as_read(
    notification_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = NotificationService(db)
    notification = service.mark_as_read(notification_id)
    if not notification or notification.user_id != current_user.user_id:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"message": "Marked as read"}
