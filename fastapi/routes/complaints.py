from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional, List, Literal
from sqlalchemy.orm import Session

from core.dependencies import get_db, get_current_user
from models.user import User as UserModel
from models.complaint import Complaint, ComplaintMessage
from services.complaint_service import ComplaintService

from pydantic import BaseModel, Field
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
        "deductedAmount": c.deducted_amount,
        "deductionReason": c.deduction_reason,
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
    type: Literal["book-condition","delivery","user-behavior","other","overdue"]
    subject: str = Field(min_length=1, max_length=255)
    description: str = Field(min_length=1)

class MessageCreate(BaseModel):
    body: str = Field(min_length=1)


class AdminResolveBody(BaseModel):
    status: Optional[Literal["resolved","closed","investigating"]] = None
    adminResponse: Optional[str] = None

class DeductDepositBody(BaseModel):
    amount: float = Field(gt=0, description="Amount to deduct from deposit")
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
        raise HTTPException(status_code=403, detail="Admin access required")
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
        raise HTTPException(status_code=403, detail="Admin access required")
    c = ComplaintService.admin_update(
        db,
        complaint_id=complaint_id,
        status=body.status,
        admin_response=body.adminResponse,
    )
    return _to_read(c)


# ------ Deposit Deduction ------
@router.post("/{complaint_id}/deduct-deposit")
def deduct_deposit(
    complaint_id: str,
    body: DeductDepositBody,
    db: Session = Depends(get_db),
    user: UserModel = Depends(get_current_user),
):
    """
    Use this API for admin users to deduct amount from borrower's deposit.
    Only admins can access this endpoint.
    Amount is recorded in the complaint for tracking.

    - complaint_id is auto-generated ID of this complaint.
    """
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    c = ComplaintService.deduct_deposit(
        db,
        complaint_id=complaint_id,
        amount=str(body.amount),
        reason=body.reason or f"Deposit deduction of ${body.amount}"
    )
    return _to_read(c)


# ------ System Auto-Creation ------
class AutoComplaintBody(BaseModel):
    orderId: str = Field(..., description="Order ID that is overdue")
    borrowerId: str = Field(..., description="Borrower user ID")
    lenderId: str = Field(..., description="Lender user ID")

@router.post("/auto-create-overdue")
def auto_create_overdue_complaint(
    body: AutoComplaintBody,
    db: Session = Depends(get_db),
    user: UserModel = Depends(get_current_user),
):
    """
    System API to automatically create overdue complaints.
    This should be called by the system when an order is overdue.
    Only admin/system can call this endpoint.
    """
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Check if complaint already exists for this order
    existing = db.query(Complaint).filter(
        Complaint.order_id == body.orderId,
        Complaint.type == "overdue"
    ).first()
    
    if existing:
        return {"message": "Overdue complaint already exists", "complaint": _to_read(existing)}
    
    c = ComplaintService.create(
        db,
        complainant_id="system",  # System-generated complaint
        respondent_id=body.borrowerId,
        order_id=body.orderId,
        type="overdue",
        subject=f"Overdue Return - Order {body.orderId}",
        description=f"This order is overdue. The borrower has not returned the book on time. System will automatically deduct 20% of deposit every 7 days until resolved."
    )
    return _to_read(c)
