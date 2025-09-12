from sqlalchemy.orm import Session
from models.service_fee import ServiceFee, ServiceFeeUpdate

def get_all_fees(db: Session):
    return db.query(ServiceFee).all()

def get_fee(db: Session, fee_id: str):
    return db.query(ServiceFee).filter(ServiceFee.fee_id == fee_id).first()

def create_fee(db: Session, fee_in_data: dict):
    fee = ServiceFee(**fee_in_data)
    db.add(fee)
    db.commit()
    db.refresh(fee)
    return fee

def update_fee(db: Session, fee_id: str, fee_in: ServiceFeeUpdate):
    fee = get_fee(db, fee_id)
    if not fee:
        return None
    for field, value in fee_in.dict(exclude_unset=True).items():
        setattr(fee, field, value)
    db.commit()
    db.refresh(fee)
    return fee

def delete_fee(db: Session, fee_id: str):
    fee = get_fee(db, fee_id)
    if not fee:
        return False
    db.delete(fee)
    db.commit()
    return True