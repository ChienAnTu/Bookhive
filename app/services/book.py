from sqlmodel import select
from app.db import get_session
from app.models.book import Book

def get_books():
    with get_session() as session:
        return session.exec(select(Book)).all()

def create_book(book: Book):
    with get_session() as session:
        session.add(book)
        session.commit()
        session.refresh(book)
        return book