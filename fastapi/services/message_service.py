import uuid
from sqlalchemy.orm import Session
from sqlalchemy import or_
from models.message import Message
from models.user import User

class MessageService:
    def __init__(self, db: Session):
        self.db = db

    def generate_message_id(self) -> str:
        """Generate unique message ID"""
        return str(uuid.uuid4())[:25]

    def send_message(self, sender_id: str, receiver_id: str, content: str) -> Message:
        """Create and save a new message to database"""
        message = Message(
            message_id=self.generate_message_id(),
            sender_id=sender_id,
            receiver_id=receiver_id,
            content=content
        )
        self.db.add(message)
        self.db.commit()
        self.db.refresh(message)
        return message

    def get_conversation(self, user_id: str, other_user_id: str):
        """Get all messages between two users, ordered by timestamp"""
        return self.db.query(Message).filter(
            or_(
                (Message.sender_id == user_id) & (Message.receiver_id == other_user_id),
                (Message.sender_id == other_user_id) & (Message.receiver_id == user_id)
            )
        ).order_by(Message.timestamp.asc()).all()

    def get_user_conversations(self, user_id: str):
        """Get list of all users that the given user has exchanged messages with"""
        # Get unique conversation partners
        sent = self.db.query(Message.receiver_id).filter(Message.sender_id == user_id).distinct()
        received = self.db.query(Message.sender_id).filter(Message.receiver_id == user_id).distinct()
        partners = set([r[0] for r in sent] + [r[0] for r in received])
        return [self.db.query(User).filter(User.user_id == p).first() for p in partners]

    def mark_message_as_read(self, message_id: str, user_id: str) -> bool:
        """Mark a specific message as read by the receiver"""
        message = self.db.query(Message).filter(
            Message.message_id == message_id,
            Message.receiver_id == user_id
        ).first()
        
        if message and not message.is_read:
            message.is_read = True
            self.db.commit()
            return True
        return False

    def mark_conversation_as_read(self, user_id: str, other_user_id: str) -> int:
        """Mark all unread messages from a specific user as read"""
        messages = self.db.query(Message).filter(
            Message.receiver_id == user_id,
            Message.sender_id == other_user_id,
            Message.is_read == False
        ).all()
        
        for message in messages:
            message.is_read = True
        
        self.db.commit()
        return len(messages)

    def get_unread_count(self, user_id: str) -> int:
        """Get total count of unread messages for a user"""
        return self.db.query(Message).filter(
            Message.receiver_id == user_id,
            Message.is_read == False
        ).count()

    def get_unread_count_by_sender(self, user_id: str, sender_id: str) -> int:
        """Get count of unread messages from a specific sender"""
        return self.db.query(Message).filter(
            Message.receiver_id == user_id,
            Message.sender_id == sender_id,
            Message.is_read == False
        ).count()
