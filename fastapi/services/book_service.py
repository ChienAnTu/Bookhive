# fastapi/services/book_service.py
from __future__ import annotations
from typing import Optional, Tuple, List, Dict, Any
from uuid import uuid4
from datetime import datetime

from sqlalchemy.orm import Session
from sqlalchemy import select, func

from models.book import Book

class BookService:
    # ---------- Create ----------
    @staticmethod
    def create(db: Session, owner_id: str, payload: Dict[str, Any]) -> Book:
        """payload 期望鍵名與 Book model 欄位一致（snake_case）。
           若你的 route 收到的是前端的 camelCase/特殊命名，可以在 route 先轉鍵名。"""
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
            # date_added 使用 server_default=NOW()，故不必手動塞；update_date 同理
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

        # 先算 total，再分頁取 items（MySQL 上效能較穩定）
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

        # 允許部分更新（僅覆蓋有傳入的欄位）
        updatable = {
            "title_or", "title_en", "original_language", "author", "category", "description",
            "cover_img_url", "condition_img_urls", "status", "condition",
            "can_rent", "can_sell", "isbn", "tags", "publish_year",
            "max_lending_days", "delivery_method", "sale_price", "deposit"
        }
        for k, v in payload.items():
            if k in updatable:
                setattr(book, k, v)

        # 讓 update_date 反映更新
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
