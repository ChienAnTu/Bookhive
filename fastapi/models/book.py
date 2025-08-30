from sqlalchemy import (
    Column, String, Integer, DateTime, Enum, Boolean, ForeignKey, Text, DECIMAL
)
from sqlalchemy.sql import func
from sqlalchemy.dialects.mysql import JSON
from models.base import Base

# Follow frontend ENUM
BOOK_STATUS_ENUM = ("listed", "unlisted", "lent", "sold")
BOOK_CONDITION_ENUM = ("new", "like-new", "good", "fair")
DELIVERY_METHOD_ENUM = ("post", "pickup", "both")

class Book(Base):
    __tablename__ = "book"
    id = Column(String(36), primary_key=True, index=True)

    # owner_id -> refer to users.user_id
    owner_id = Column(String(25), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True)

    # TODO: Check Nullable settings
    title_or = Column(String(255), nullable=False, index=True)   # frontend: titleOr
    title_en = Column(String(255), nullable=False, index=True)    # frontend: titleEn
    original_language = Column(String(64), nullable=False)        # frontend: originalLanguage
    author = Column(String(255), nullable=False, index=True)
    category = Column(String(128), nullable=True, index=False)
    description = Column(Text, nullable=False, default="")

    # image
    cover_img_url = Column(String(255), nullable=True)           # coverImgUrl
    condition_img_urls = Column(JSON, nullable=True)             # conditionImgURLs: string[]

    # status/condition
    status = Column(Enum(*BOOK_STATUS_ENUM, name="book_status"), nullable=False, default="listed", index=True)
    condition = Column(Enum(*BOOK_CONDITION_ENUM, name="book_condition"), nullable=False, default="good")

    can_rent = Column(Boolean, nullable=False, default=True)
    can_sell = Column(Boolean, nullable=False, default=False)

    # time
    date_added = Column(DateTime, server_default=func.now(), nullable=False, index=True)
    update_date = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False, index=True)

    # other attributes
    isbn = Column(String(32), nullable=True)
    tags = Column(JSON, nullable=True)                           # tags: string[]（MySQL JSON）
    publish_year = Column(Integer, nullable=True)
    max_lending_days = Column(Integer, nullable=False, default=14)

    # delivery
    delivery_method = Column(Enum(*DELIVERY_METHOD_ENUM, name="delivery_method_enum"), nullable=False, default="both")
    sale_price = Column(DECIMAL(10, 2), nullable=True)
    deposit = Column(DECIMAL(10, 2), nullable=True)
