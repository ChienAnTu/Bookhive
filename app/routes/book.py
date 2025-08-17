from fastapi import APIRouter
from app.models.book import Book
from app.services import book

router = APIRouter()

@router.get("/books", response_model=list[Book])
def list_books():
    return book.get_books()

@router.post("/books", response_model=Book)
def add_book(b: Book):
    return book.create_book(b)