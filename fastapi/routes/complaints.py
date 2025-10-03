from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional, List, Literal
from sqlalchemy.orm import Session

from core.dependencies import get_db, get_current_user
from models.user import User as UserModel
from models.complaint import Complaint, ComplaintMessage
from services.complaint_service import ComplaintService

from pydantic import BaseModel, constr
from typing import Optional, Literal

router = APIRouter(prefix="/complaints", tags=["Complaint"])

# ------ Helpers to match frontend field names ------
def _to_read(c: Complaint) -> dict:
    return {
        "id": c.id,
        "orderId": c.order_id,
        "complainantId": c.complainant_id,
        "respondentId": c.respondent_id,
        "type": c.type,
        "subject": c.subject,
        "description": c.description,
        "status": c.status,
        "adminResponse": c.admin_response,
        "deductedAmount": getattr(c, 'deducted_amount', None),
        "depositRemaining": getattr(c, 'deposit_remaining', None),
        "autoDeductionEnabled": getattr(c, 'auto_deduction_enabled', False),
        "nextDeductionDate": getattr(c, 'next_deduction_date', None),
        "createdAt": c.created_at,
        "updatedAt": c.updated_at,
    }

def _msg_to_read(m: ComplaintMessage) -> dict:
    return {
        "id": m.id,
        "complaintId": m.complaint_id,
        "senderId": m.sender_id,
        "body": m.body,
        "createdAt": m.created_at,
    }

# ------ Create ------
class ComplaintCreateBody(BaseModel):
    orderId: Optional[str] = None
    respondentId: Optional[str] = None
    type: Literal["book-condition","delivery","user-behavior","overdue","other"]
    subject: constr(min_length=1, max_length=255)
    description: constr(min_length=1)
    isSystemGenerated: Optional[bool] = False

class MessageCreate(BaseModel):
    body: constr(min_length=1)


class AdminResolveBody(BaseModel):
    status: Optional[Literal["resolved","closed","investigating"]] = None
    adminResponse: Optional[str] = None

class DepositDeductionBody(BaseModel):
    amount: float
    reason: Optional[str] = None

@router.post("", status_code=201)
def create_complaint(
    body: ComplaintCreateBody,
    db: Session = Depends(get_db),
    user: UserModel = Depends(get_current_user),
):
    """
    Use this API to create a new complaint.
    Send complaint type, subject, description, and optionally related orderId or respondentId.
    It will return the created complaint with status = "pending".

    - respondendId is the one you're complaining about.
    """
    c = ComplaintService.create(
        db,
        complainant_id=user.user_id,
        order_id=body.orderId,
        respondent_id=body.respondentId,
        type=body.type,
        subject=body.subject,
        description=body.description,
        is_system_generated=body.isSystemGenerated or False
    )
    return _to_read(c)


# ------ List ------
@router.get("")
def list_complaints(
    status: Optional[str] = Query(None),
    role: Optional[Literal["mine","admin"]] = Query("mine"),
    db: Session = Depends(get_db),
    user: UserModel = Depends(get_current_user),
):
    """
    GET /complaints?role=mine&status=pending

    Use this API to list complaints.
    - If role=mine, it shows complaints related to the current user (as complainant or respondent).
    - If role=admin, it shows all complaints (requires admin user). -> You need admin account for this.
    You can filter by status (pending, investigating, resolved, closed).
    """
    if role == "admin" and not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin only")
    if role == "admin":
        items = ComplaintService.list_all(db, status=status)
    else:
        items = ComplaintService.list_for_user(db, user_id=user.user_id, status=status)
    return {"items": [_to_read(i) for i in items]}

# ------ Get ------
@router.get("/{complaint_id}")
def get_complaint(
    complaint_id: str,
    db: Session = Depends(get_db),
    user: UserModel = Depends(get_current_user),
):
    """
    Use this API to view one complaint in detail.
    It returns the complaint information plus all messages linked to it.
    Only the complainant, respondent, or an admin can access it.

    - complaint_id is auto-generated ID of this complaint.
    """

    c = ComplaintService.get(db, complaint_id)
    if user.user_id not in (c.complainant_id, c.respondent_id) and not user.is_admin:
        raise HTTPException(status_code=403, detail="Forbidden")
    msgs = ComplaintService.list_messages(db, complaint_id=complaint_id)
    return {"complaint": _to_read(c), "messages": [_msg_to_read(m) for m in msgs]}

# ------ Messages ------
@router.post("/{complaint_id}/messages", status_code=201)
def add_message(
    complaint_id: str,
    body: MessageCreate,
    db: Session = Depends(get_db),
    user: UserModel = Depends(get_current_user),
):
    """
    Use this API to add a message inside an existing complaint.
    Provide the message body text.
    The response will return the new message object with senderId and createdAt.
    - complaint_id is auto-generated ID of this complaint.
    """

    c = ComplaintService.get(db, complaint_id)
    if user.user_id not in (c.complainant_id, c.respondent_id) and not user.is_admin:
        raise HTTPException(status_code=403, detail="Forbidden")
    m = ComplaintService.add_message(
        db, complaint_id=complaint_id, sender_id=user.user_id, body=body.body
    )
    return _msg_to_read(m)


# ------ Admin actions ------
@router.post("/{complaint_id}/resolve")
def resolve_complaint(
    complaint_id: str,
    body: AdminResolveBody,
    db: Session = Depends(get_db),
    user: UserModel = Depends(get_current_user),
):
    """
    Use this API for admin users to handle a complaint.  -> You need admin account for this.
    Send a new status (investigating, resolved, or closed) and optional adminResponse.
    It will return the updated complaint record with the new status and admin notes.

    - complaint_id is auto-generated ID of this complaint.
    """

    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin only")
    c = ComplaintService.admin_update(
        db,
        complaint_id=complaint_id,
        status=body.status,
        admin_response=body.adminResponse,
    )
    return _to_read(c)


@router.post("/{complaint_id}/deduct-deposit")
def deduct_deposit(
    complaint_id: str,
    body: DepositDeductionBody,
    db: Session = Depends(get_db),
    user: UserModel = Depends(get_current_user),
):
    """
    Admin-only endpoint to deduct amount from borrower's deposit.
    This is used for complaint resolution where compensation is needed.
    
    Example usage:
    POST /complaints/{id}/deduct-deposit
    {
        "amount": 15.00,
        "reason": "Book damage compensation"
    }
    """
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin only")
    
    try:
        c = ComplaintService.deduct_deposit(
            db,
            complaint_id=complaint_id,
            amount=body.amount,
            reason=body.reason
        )
        return _to_read(c)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    # For now, return success response
    try:
        # Here you would implement the actual deposit deduction logic
        # ComplaintService.deduct_deposit(db, complaint_id, body.amount, body.reason)
        
        return {
            "success": True,
            "message": f"Successfully deducted ${body.amount} from deposit",
            "deductedAmount": body.amount,
            "reason": body.reason
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

