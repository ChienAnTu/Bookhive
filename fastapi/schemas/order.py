# app/schemas/order.py

from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class BookSummary(BaseModel):
    title: str
    cover: Optional[str]  

class UserSummary(BaseModel):
    id: str
    name: str   

class OrderSummary(BaseModel):
    order_id: str
    status: str
    total_paid_amount: float
    books: List[BookSummary]
    create_at: datetime = None
    due_at: Optional[datetime] = None

class BookDetail(BaseModel):
    bookId: str
    titleEn: Optional[str]
    titleOr: str
    author: Optional[str]
    coverImgUrl: Optional[str]

class OrderDetail(BaseModel):
    # basic info
    id: str
    owner: UserSummary
    borrower: UserSummary
    status: str
    actionType: str
    shippingMethod: str
    
    # price
    depositOrSaleAmount: float
    serviceFeeAmount: float
    shippingOutFeeAmount: float
    totalPaidAmount: float
    
    # address
    contactName: str
    phone: Optional[str]
    street: str
    city: str
    postcode: str
    country: str
    
    # time
    createdAt: Optional[datetime]
    updatedAt: Optional[datetime]
    dueAt: Optional[datetime]
    startAt: Optional[datetime]
    returnedAt: Optional[datetime]
    completedAt: Optional[datetime]
    canceledAt: Optional[datetime]
    
    # shipping
    shippingOutTrackingNumber: Optional[str]
    shippingOutTrackingUrl: Optional[str]
    shippingReturnTrackingNumber: Optional[str]
    shippingReturnTrackingUrl: Optional[str]
    
    # fee
    paymentId: Optional[str] = None
    lateFeeAmount: float
    damageFeeAmount: float
    totalRefundedAmount: float
    
    # books info
    books: List[BookDetail]


class CreateOrderRequest(BaseModel):
    checkout_id: str
    payment_id: str

class TrackingNumberItem(BaseModel):
    order_id: str
    shipping_out_tracking_number: Optional[str]
    shipping_return_tracking_number: Optional[str]

class ConfirmShipmentRequest(BaseModel):
    tracking_number: str
    carrier: str = "AUSPOST" # "AUSPOST" or "OTHER"
