from __future__ import annotations
from typing import Optional, Tuple, List, Dict, Any, Literal
from uuid import uuid4
from datetime import datetime
import shlex

from sqlalchemy.orm import Session
from sqlalchemy import select, func, or_, and_

from models.book import Book

class BookService:
    # ---------- Create ----------
    @staticmethod
    def create(db: Session, owner_id: str, payload: Dict[str, Any]) -> Book:
        """The payload is expected to have key names consistent with the Book model fields (snake_case).
            If your route receives camelCase or specially named keys from the frontend, 
            you can first convert the key names in the route."""
        book = Book(
            id=str(uuid4()),
            owner_id=owner_id,

            title_or=payload["title_or"],
            title_en=payload.get("title_en"),
            original_language=payload.get("original_language"),
            author=payload["author"],
            category=payload.get("category"),
            description=payload.get("description", ""),

            cover_img_url=payload.get("cover_img_url"),
            condition_img_urls=payload.get("condition_img_urls") or [],

            status=payload.get("status", "listed"),
            condition=payload.get("condition", "good"),

            can_rent=bool(payload.get("can_rent", True)),
            can_sell=bool(payload.get("can_sell", False)),

            # Time
            # date_added uses server_default=NOW(), so no need to insert manually; same for update_date
            isbn=payload.get("isbn"),
            tags=payload.get("tags") or [],
            publish_year=payload.get("publish_year"),
            max_lending_days=int(payload.get("max_lending_days", 14)),

            delivery_method=payload.get("delivery_method", "both"),
            sale_price=payload.get("sale_price"),
            deposit=payload.get("deposit"),
        )
        db.add(book)
        db.commit()
        db.refresh(book)
        return book

    # ---------- List / Search ----------
    @staticmethod
    def list(
        db: Session,
        page: int = 1,
        page_size: int = 20,
        q: Optional[str] = None,
        author: Optional[str] = None,
        category: Optional[str] = None,
        owner_id: Optional[str] = None,
        status: Optional[str] = None,
    ) -> Tuple[List[Book], int]:
        stmt = select(Book)

        if q:
            like = f"%{q}%"
            stmt = stmt.where((Book.title_or.ilike(like)) | (Book.title_en.ilike(like)))
        if author:
            stmt = stmt.where(Book.author.ilike(f"%{author}%"))
        if category:
            stmt = stmt.where(Book.category == category)
        if owner_id:
            stmt = stmt.where(Book.owner_id == owner_id)
        if status:
            stmt = stmt.where(Book.status == status)

        # Calculate total first, then fetch items with pagination
        total = db.execute(
            select(func.count()).select_from(stmt.subquery())
        ).scalar_one()
        items = db.execute(
            stmt.order_by(Book.date_added.desc())
                .offset((page - 1) * page_size)
                .limit(page_size)
        ).scalars().all()
        return items, total

    # ---------- Get ----------
    @staticmethod
    def get(db: Session, book_id: str) -> Book:
        book = db.get(Book, book_id)
        if not book:
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="Book not found")
        return book

    # ---------- Update ----------
    @staticmethod
    def update(db: Session, book_id: str, owner_id: str, payload: Dict[str, Any]) -> Book:
        book = BookService.get(db, book_id)
        if book.owner_id != owner_id:
            from fastapi import HTTPException
            raise HTTPException(status_code=403, detail="Not the owner")

        # Allow partial updates (only overwrite fields that are provided)
        updatable = {
            "title_or", "title_en", "original_language", "author", "category", "description",
            "cover_img_url", "condition_img_urls", "status", "condition",
            "can_rent", "can_sell", "isbn", "tags", "publish_year",
            "max_lending_days", "delivery_method", "sale_price", "deposit"
        }
        for k, v in payload.items():
            if k in updatable:
                setattr(book, k, v)

        # Make update_date reflect the update
        book.update_date = datetime.utcnow()
        db.add(book)
        db.commit()
        db.refresh(book)
        return book

    # ---------- Delete ----------
    @staticmethod
    def delete(db: Session, book_id: str, owner_id: str) -> None:
        book = BookService.get(db, book_id)
        if book.owner_id != owner_id:
            from fastapi import HTTPException
            raise HTTPException(status_code=403, detail="Not the owner")
        db.delete(book)
        db.commit()

    # ---------- Search ----------
    @staticmethod
    def search_books(
        db: Session, *, q: Optional[str], lang: Optional[str], status: str,
        can_rent: Optional[bool], can_sell: Optional[bool],
        delivery: Optional[str], min_price: Optional[float], max_price: Optional[float],
        sort: Literal["relevance","newest","price_asc","price_desc"],
        page: int, page_size: int
    ) -> Tuple[list[dict], int]:

        stmt = select(Book)

        # Status
        if status != "all":
            stmt = stmt.where(Book.status == status)

        # Keywords (title/author/description)
        # if q:
        #     kw = f"%{q.strip()}%"
        #     stmt = stmt.where(or_(
        #         Book.title_or.ilike(kw),
        #         Book.title_en.ilike(kw),
        #         Book.author.ilike(kw),
        #         Book.description.ilike(kw)
        #     ))
        # Keywords (title/author/description)
        if q:
            tokens = [t for t in shlex.split(q.strip()) if t]
            for tok in tokens:
                like = f"%{tok}%"
                stmt = stmt.where(or_(
                    Book.title_or.ilike(like),
                    Book.title_en.ilike(like),
                    Book.author.ilike(like),
                    Book.description.ilike(like),
                ))


        # Language
        if lang:
            stmt = stmt.where(Book.original_language == lang)

        # For lend / For sell
        if can_rent is not None:
            stmt = stmt.where(Book.can_rent == can_rent)
        if can_sell is not None:
            stmt = stmt.where(Book.can_sell == can_sell)

        # Delivery method (post/pickup/both)
        if delivery and delivery != "any":
            if delivery == "delivery":
                delivery = "post"
            if delivery == "self_pickup":
                delivery = "pickup"
            stmt = stmt.where(or_(
                Book.delivery_method == delivery,
                Book.delivery_method == "both"
            ))

        # Price range (sale_price OR rent deposit)
        if min_price is not None:
            stmt = stmt.where(or_(
                Book.sale_price >= min_price,
                Book.deposit    >= min_price
            ))
        if max_price is not None:
            stmt = stmt.where(or_(
                Book.sale_price <= max_price,
                Book.deposit    <= max_price
            ))

        # Ordering
        if sort == "newest":
            stmt = stmt.order_by(Book.date_added.desc())
        elif sort == "price_asc":
            stmt = stmt.order_by(func.coalesce(Book.sale_price, Book.deposit).asc())
        elif sort == "price_desc":
            stmt = stmt.order_by(func.coalesce(Book.sale_price, Book.deposit).desc())
        else:
            stmt = stmt.order_by(Book.date_added.desc())

        # Total
        total = db.execute(select(func.count()).select_from(stmt.subquery())).scalar() or 0

        # Pagination
        offset = (page - 1) * page_size
        rows = db.execute(stmt.offset(offset).limit(page_size)).scalars().all()

        # Transfer to frontend structure
        def to_read(b: Book):
            return {
                "id": b.id,
                "titleOr": b.title_or,
                "author": b.author,
                "status": b.status,
                "coverImgUrl": b.cover_img_url,
                "canRent": b.can_rent,
                "canSell": b.can_sell,
                "deposit": float(b.deposit) if b.deposit is not None else None,
                "salePrice": float(b.sale_price) if b.sale_price is not None else None,
                "deliveryMethod": b.delivery_method,
                "ownerId": b.owner_id,
                "createdAt": b.date_added,
            }
        return [to_read(b) for b in rows], total