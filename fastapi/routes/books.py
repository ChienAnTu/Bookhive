from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session

from pydantic import BaseModel, Field, conlist
from typing import Optional, List, Literal, Dict, Any

from services.book_service import BookService
from core.dependencies import get_db, get_current_user
from models.book import Book

router = APIRouter(prefix="/api/v1/books", tags=["books"])

# -------- Helper: Convert to frontend format --------
def _to_read(b: Book) -> dict:
    return {
        "id": b.id,
        "ownerId": b.owner_id,
        "titleOr": b.title_or,
        "titleEn": b.title_en,
        "originalLanguage": b.original_language,
        "author": b.author,
        "category": b.category,
        "description": b.description,
        "coverImgUrl": b.cover_img_url,
        "conditionImgURLs": b.condition_img_urls or [],
        "status": b.status,
        "condition": b.condition,
        "canRent": b.can_rent,
        "canSell": b.can_sell,
        "dateAdded": b.date_added,
        "updateDate": b.update_date,
        "isbn": b.isbn,
        "tags": b.tags or [],
        "publishYear": b.publish_year,
        "maxLendingDays": b.max_lending_days,
        "deliveryMethod": b.delivery_method,
        "salePrice": b.sale_price,
        "deposit": b.deposit,
    }


class BookCreate(BaseModel):
    titleOr: str
    titleEn: Optional[str] = None
    originalLanguage: Optional[str] = None
    author: str
    category: Optional[str] = None
    description: Optional[str] = ""
    coverImgUrl: Optional[str] = None
    conditionImgURLs: Optional[List[str]] = None
    status: Literal["listed","unlisted","lent","sold"] = "listed"
    condition: Literal["new","like-new","good","fair"] = "good"
    canRent: bool = True
    canSell: bool = False
    isbn: Optional[str] = None
    tags: Optional[List[str]] = None
    publishYear: Optional[int] = None
    maxLendingDays: int = 14
    deliveryMethod: Literal["post","pickup","both"] = "both"
    salePrice: Optional[float] = None
    deposit: Optional[float] = None

class BookUpdate(BaseModel):
    titleOr: Optional[str] = None
    titleEn: Optional[str] = None
    originalLanguage: Optional[str] = None
    author: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    coverImgUrl: Optional[str] = None
    conditionImgURLs: Optional[List[str]] = None
    status: Optional[Literal["listed","unlisted","lent","sold"]] = None
    condition: Optional[Literal["new","like-new","good","fair"]] = None
    canRent: Optional[bool] = None
    canSell: Optional[bool] = None
    isbn: Optional[str] = None
    tags: Optional[List[str]] = None
    publishYear: Optional[int] = None
    maxLendingDays: Optional[int] = None
    deliveryMethod: Optional[Literal["post","pickup","both"]] = None
    salePrice: Optional[float] = None
    deposit: Optional[float] = None


# -------- Create --------
@router.post("", response_model=dict)
def create_book(
    payload: BookCreate,
    db: Session = Depends(get_db),
    user = Depends(get_current_user),
):
    p = {
        "title_or": payload.titleOr,
        "title_en": payload.titleEn,
        "original_language": payload.originalLanguage,
        "author": payload.author,
        "category": payload.category,
        "description": payload.description or "",
        "cover_img_url": payload.coverImgUrl,
        "condition_img_urls": payload.conditionImgURLs,
        "status": payload.status,
        "condition": payload.condition,
        "can_rent": payload.canRent,
        "can_sell": payload.canSell,
        "isbn": payload.isbn,
        "tags": payload.tags,
        "publish_year": payload.publishYear,
        "max_lending_days": payload.maxLendingDays,
        "delivery_method": payload.deliveryMethod,
        "sale_price": payload.salePrice,
        "deposit": payload.deposit,
    }
    book = BookService.create(db, owner_id=user.user_id, payload=p)
    return _to_read(book)


# -------- List --------
@router.get("", response_model=dict)
def list_books(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    q: Optional[str] = None,
    author: Optional[str] = None,
    category: Optional[str] = None,
    owner_id: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
):
    items, total = BookService.list(db, page, page_size, q, author, category, owner_id, status)
    return {"items": [_to_read(b) for b in items], "total": total, "page": page, "page_size": page_size}


# -------- Search --------
@router.get("/search")
def search_books(
    q: Optional[str] = Query(None, description="keyword in title/author/description/ISBN"),
    lang: Optional[str] = Query(None),
    status: Literal["listed","unlisted","all"] = "listed",
    canRent: Optional[bool] = None,
    canSell: Optional[bool] = None,
    delivery: Literal["any","post","pickup","both"] = "any",
    minPrice: Optional[float] = None,
    maxPrice: Optional[float] = None,
    sort: Literal["relevance","newest","price_asc","price_desc"] = "relevance",
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
):
    items, total = BookService.search_books(
        db=db, q=q, lang=lang, status=status, can_rent=canRent, can_sell=canSell,
        delivery=delivery, min_price=minPrice, max_price=maxPrice,
        sort=sort, page=page, page_size=page_size
    )
    return {"items": items, "total": total, "page": page, "page_size": page_size}


# -------- Get by ID --------
@router.get("/{book_id}", response_model=dict)
def get_book(book_id: str, db: Session = Depends(get_db)):
    return _to_read(BookService.get(db, book_id))

# -------- Update --------
@router.put("/{book_id}", response_model=dict)
def update_book(
    book_id: str,
    payload: BookUpdate,
    db: Session = Depends(get_db),
    user = Depends(get_current_user),
):
    mapping = {
        "titleOr":"title_or","titleEn":"title_en","originalLanguage":"original_language",
        "coverImgUrl":"cover_img_url","conditionImgURLs":"condition_img_urls",
        "canRent":"can_rent","canSell":"can_sell",
        "publishYear":"publish_year","maxLendingDays":"max_lending_days",
        "deliveryMethod":"delivery_method","salePrice":"sale_price"
    }
    data = {mapping.get(k, k): v for k, v in payload.dict(exclude_unset=True).items()}
    book = BookService.update(db, book_id, user.user_id, data)
    return _to_read(book)


# -------- Delete --------
@router.delete("/{book_id}", status_code=204)
def delete_book(
    book_id: str,
    db: Session = Depends(get_db),
    user = Depends(get_current_user),
):
    BookService.delete(db, book_id, user.user_id)
    return None


