from sqlmodel import select
from app.db import get_session
from app.models.user import User

def get_users():
    with get_session() as session:
        return session.exec(select(User)).all()

def create_user(user: User):
    with get_session() as session:
        session.add(user)
        session.commit()
        session.refresh(user)
        return user