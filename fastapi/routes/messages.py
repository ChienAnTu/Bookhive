from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, status, Query, WebSocketException, UploadFile, File, Form
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List
import uuid
from pathlib import Path
from PIL import Image
import io
import json

from core.dependencies import get_db, get_current_user
from core.security import decode_access_token
from services.message_service import MessageService
from models.message import Message
from models.user import User
from pydantic import BaseModel
from typing import Optional
from database.connection import SessionLocal

router = APIRouter(prefix="/messages", tags=["Messages"])

class UserPublicProfile(BaseModel):
    email: str
    first_name: str | None = None
    last_name: str | None = None
    name: str | None = None
    bio: str | None = None
    avatar: str | None = None

class MessageCreate(BaseModel):
    receiver_email: str
    content: str | None = None

class MessageResponse(BaseModel):
    message_id: str
    sender_email: str
    receiver_email: str
    content: str | None
    image_url: str | None
    timestamp: str
    is_read: bool

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, WebSocket] = {}

    async def connect(self, user_id: str, websocket: WebSocket):
        """Accept WebSocket connection and store user's connection"""
        await websocket.accept()
        self.active_connections[user_id] = websocket

    def disconnect(self, user_id: str):
        """Remove user's WebSocket connection"""
        if user_id in self.active_connections:
            del self.active_connections[user_id]

    async def send_personal_message(self, message: dict, user_id: str):
        """Send real-time message to specific user via WebSocket"""
        if user_id in self.active_connections:
            await self.active_connections[user_id].send_json(message)

# This prevents accidentally leaking sensitive information like password hashes.
class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    avatar_url: Optional[str] = None
    # Add any other fields you need for the chat header, e.g., avatar_url
    # avatar_url: Optional[str] = None

    class Config:
        orm_mode = True

manager = ConnectionManager()

async def get_current_user_ws(
    websocket: WebSocket,
    token: str = Query(...)
):
    """Authenticate user for WebSocket connection"""
    credential_exception = WebSocketException(code=status.WS_1008_POLICY_VIOLATION)
    db = SessionLocal()
    try:
        payload = decode_access_token(token)
        email: str = payload.get("sub")
        if email is None:
            raise credential_exception
        user = db.query(User).filter(User.email == email).first()
        if user is None:
            raise credential_exception
        return user
    except Exception:
        # It's good practice to catch specific exceptions, but this will work for now
        raise credential_exception
    finally:
        db.close()
    
@router.get("/users/by-email/{email}", response_model=UserResponse)
def get_user_by_email(
    email: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user) # Keep this for security
):
    """
    Get public user profile information by email.
    Ensures that only logged-in users can fetch this data.
    """
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Manually construct the response to ensure you only send public data
    return UserResponse(
        id=user.user_id,
        name=user.name,
        email=user.email,
        avatar_url=user.avatar
    )

@router.post("/send", response_model=MessageResponse)
async def send_message(
    message_data: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Send a message to another user and notify them via WebSocket"""
    receiver = db.query(User).filter(User.email == message_data.receiver_email).first()
    if not receiver:
        raise HTTPException(status_code=404, detail="Receiver not found")
    service = MessageService(db)
    message = service.send_message(current_user.user_id, receiver.user_id, message_data.content)
    
    # Send real-time update via WebSocket
    ws_message = {
        "type": "message",
        "data": {
            "message_id": message.message_id,
            "sender_id": message.sender_id,
            "receiver_id": message.receiver_id,
            "sender_email": current_user.email,
            "receiver_email": receiver.email,
            "content": message.content,
            "image_url": message.image_path,
            "timestamp": message.timestamp.isoformat()
        }
    }
    await manager.send_personal_message(ws_message, receiver.user_id)
    
    return MessageResponse(
        message_id=message.message_id,
        sender_email=current_user.email,
        receiver_email=message_data.receiver_email,
        content=message.content,
        image_url=message.image_path,
        timestamp=message.timestamp.isoformat(),
        is_read=message.is_read
    )

@router.get("/conversation/{other_user_email}", response_model=List[MessageResponse])
def get_conversation(
    other_user_email: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all messages in a conversation between current user and another user"""
    other_user = db.query(User).filter(User.email == other_user_email).first()
    if not other_user:
        raise HTTPException(status_code=404, detail="User not found")
    service = MessageService(db)
    messages = service.get_conversation(current_user.user_id, other_user.user_id)
    return [
        MessageResponse(
            message_id=m.message_id,
            sender_email=db.query(User).filter(User.user_id == m.sender_id).first().email,
            receiver_email=db.query(User).filter(User.user_id == m.receiver_id).first().email,
            content=m.content,
            image_url=m.image_path,
            timestamp=m.timestamp.isoformat(),
            is_read=m.is_read
        ) for m in messages
    ]

@router.get("/conversations")
def get_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get list of all users that current user has had conversations with"""
    service = MessageService(db)
    partners = service.get_user_conversations(current_user.user_id)
    
    threads = []
    for partner in partners:
        if not partner:
            continue
        
        last_message = service.get_last_message(current_user.user_id, partner.user_id)
        unread_count = service.get_unread_count_by_sender(current_user.user_id, partner.user_id)
        
        if last_message:
            threads.append({
                "user": {
                    "id": partner.user_id,
                    "first_name": partner.first_name,
                    "last_name": partner.last_name,
                    "name": partner.name,
                    "email": partner.email,
                    "profile_image": partner.avatar  # Assuming you have this field
                },
                "lastMessage": {
                    "id": last_message.message_id,
                    "content": last_message.content,
                    "senderId": last_message.sender_id,
                    "receiverId": last_message.receiver_id,
                    "timestamp": last_message.timestamp.isoformat(),
                    "read": last_message.is_read,
                    "imageUrl": last_message.image_path
                },
                "unreadCount": unread_count
            })
            
    # Sort threads by the timestamp of the last message
    threads.sort(key=lambda t: t['lastMessage']['timestamp'], reverse=True)
    
    return threads

@router.put("/mark-read/{message_id}")
def mark_message_as_read(
    message_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark a specific message as read by the receiver"""
    service = MessageService(db)
    success = service.mark_message_as_read(message_id, current_user.user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Message not found or already read")
    return {"message": "Message marked as read", "message_id": message_id}

@router.put("/mark-conversation-read/{other_user_email}")
def mark_conversation_as_read(
    other_user_email: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark all unread messages from a specific user as read"""
    other_user = db.query(User).filter(User.email == other_user_email).first()
    if not other_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    service = MessageService(db)
    count = service.mark_conversation_as_read(current_user.user_id, other_user.user_id)
    return {"message": f"Marked {count} messages as read", "count": count}

@router.get("/unread-count")
def get_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get total count of unread messages for current user"""
    service = MessageService(db)
    count = service.get_unread_count(current_user.user_id)
    return {"unread_count": count}

@router.get("/unread-count/{other_user_email}")
def get_unread_count_by_sender(
    other_user_email: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get count of unread messages from a specific sender"""
    other_user = db.query(User).filter(User.email == other_user_email).first()
    if not other_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    service = MessageService(db)
    count = service.get_unread_count_by_sender(current_user.user_id, other_user.user_id)
    return {"unread_count": count, "sender_email": other_user_email}

@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    current_user: User = Depends(get_current_user_ws)
):
    """WebSocket endpoint for real-time message notifications"""
    await manager.connect(current_user.user_id, websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Handle incoming messages if needed, but for now, assuming sends are via HTTP
    except WebSocketDisconnect:
        manager.disconnect(current_user.user_id)

# ---- Image upload for messages ----

MESSAGE_ATTACHMENTS_ROOT = Path(__file__).resolve().parent.parent / "media" / "messageAttachments"
MESSAGE_ATTACHMENTS_ROOT.mkdir(parents=True, exist_ok=True)

MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5MB
ALLOWED_IMAGE_EXT = {"png", "jpg", "jpeg", "gif", "webp"}

def _detect_image_ext(data: bytes) -> str | None:
    try:
        img = Image.open(io.BytesIO(data))
        fmt = (img.format or "").lower()
        return "jpg" if fmt == "jpeg" else fmt
    except Exception:
        return None

def _safe_segment(s: str) -> str:
    return "".join(ch for ch in s if ch.isalnum() or ch in "-_") or "user"

@router.post("/send-with-image", response_model=MessageResponse)
async def send_message_with_image(
    receiver_email: str = Form(...),
    content: str | None = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Send a message with an image attachment. Content is optional."""
    receiver = db.query(User).filter(User.email == receiver_email).first()
    if not receiver:
        raise HTTPException(status_code=404, detail="Receiver not found")

    # Read and validate file
    data = await file.read()
    if len(data) == 0:
        raise HTTPException(status_code=400, detail="Empty file")
    if len(data) > MAX_IMAGE_SIZE:
        raise HTTPException(status_code=413, detail="File too large (>5MB)")
    ext = _detect_image_ext(data)
    if ext not in ALLOWED_IMAGE_EXT:
        raise HTTPException(status_code=400, detail="Unsupported or invalid image")

    # Save under sender-based directory
    sender_id = _safe_segment(current_user.user_id)
    user_dir = MESSAGE_ATTACHMENTS_ROOT / sender_id
    user_dir.mkdir(parents=True, exist_ok=True)
    filename = f"{uuid.uuid4().hex}.{ext}"
    save_path = user_dir / filename
    save_path.write_bytes(data)

    public_path = f"/media/messageAttachments/{sender_id}/{filename}"

    service = MessageService(db)
    message = service.send_message(current_user.user_id, receiver.user_id, content, image_path=public_path)

    ws_message = {
        "type": "message",
        "data": {
            "message_id": message.message_id,
            "sender_id": message.sender_id,
            "receiver_id": message.receiver_id,
            "sender_email": current_user.email,
            "receiver_email": receiver.email,
            "content": message.content,
            "image_url": message.image_path,
            "timestamp": message.timestamp.isoformat()
        }
    }
    await manager.send_personal_message(ws_message, receiver.user_id)

    return MessageResponse(
        message_id=message.message_id,
        sender_email=current_user.email,
        receiver_email=receiver_email,
        content=message.content,
        image_url=message.image_path,
        timestamp=message.timestamp.isoformat(),
        is_read=message.is_read
    )
