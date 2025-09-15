from sqlalchemy import Column, String, Numeric, Boolean, Text, TIMESTAMP, func
from sqlalchemy.ext.declarative import declarative_base
from pydantic import BaseModel
from typing import Optional

Base = declarative_base()

class ServiceFee(Base):
    __tablename__ = "service_fee"

    fee_id = Column(String(36), primary_key=True, index=True)  
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    fee_type = Column(String(20), nullable=False)  # FIXED or PERCENT
    value = Column(Numeric(10, 2), nullable=False)
    status = Column(Boolean, nullable=False, default=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())


# -------- Pydantic Schemas --------
class ServiceFeeBase(BaseModel):
    name: str
    description: Optional[str] = None
    fee_type: str
    value: float
    status: bool = True


class ServiceFeeCreate(ServiceFeeBase):
    pass


class ServiceFeeUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    fee_type: Optional[str] = None
    value: Optional[float] = None
    status: Optional[bool] = None


class ServiceFeeResponse(ServiceFeeBase):
    fee_id: str
    created_at: str
    updated_at: str

    class Config:
        orm_mode = True