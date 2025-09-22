# app/schemas/order.py

from pydantic import BaseModel
from typing import List, Optional

class BookSummary(BaseModel):
    title: str
    cover: Optional[str]  

class OrderSummary(BaseModel):
    order_id: str
    status: str
    total_paid_amount: float
    books: List[BookSummary]