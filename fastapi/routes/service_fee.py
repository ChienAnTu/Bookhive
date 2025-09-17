import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from core.dependencies import get_db
from models.service_fee import ServiceFee, ServiceFeeCreate, ServiceFeeUpdate
from services import service_fee_service

router = APIRouter(prefix="/service-fees", tags=["Service Fees"])

def _fee_to_dict(fee: ServiceFee) -> dict:
    return {
        "feeId": fee.fee_id,
        "name": fee.name,
        "description": fee.description,
        "feeType": fee.fee_type,
        "value": float(fee.value),
        "status": fee.status,
        "createdAt": fee.created_at.isoformat(),
        "updatedAt": fee.updated_at.isoformat(),
    }

@router.get("/", status_code=status.HTTP_200_OK)
def list_fees(db: Session = Depends(get_db)):
    fees = service_fee_service.get_all_fees(db)
    return [_fee_to_dict(f) for f in fees]

@router.get("/{fee_id}", status_code=status.HTTP_200_OK)
def get_fee(fee_id: str, db: Session = Depends(get_db)):
    fee = service_fee_service.get_fee(db, fee_id)
    if not fee:
        raise HTTPException(status_code=404, detail="Service fee not found")
    return _fee_to_dict(fee)

@router.post("/", status_code=status.HTTP_201_CREATED)
def create_fee(fee_in: ServiceFeeCreate, db: Session = Depends(get_db)):
    fee_in_data = fee_in.dict()
    fee_in_data["fee_id"] = str(uuid.uuid4()) 
    fee = service_fee_service.create_fee(db, fee_in_data)
    return _fee_to_dict(fee)

@router.put("/{fee_id}", status_code=status.HTTP_200_OK)
def update_fee(fee_id: str, fee_in: ServiceFeeUpdate, db: Session = Depends(get_db)):
    fee = service_fee_service.update_fee(db, fee_id, fee_in)
    if not fee:
        raise HTTPException(status_code=404, detail="Service fee not found")
    return _fee_to_dict(fee)

@router.delete("/{fee_id}", status_code=status.HTTP_200_OK)
def delete_fee(fee_id: str, db: Session = Depends(get_db)):
    deleted = service_fee_service.delete_fee(db, fee_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Service fee not found")
    return {"deletedId": fee_id}