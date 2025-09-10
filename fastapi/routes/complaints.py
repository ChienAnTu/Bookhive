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
    type: Literal["book-condition","delivery","user-behavior","other"]
    subject: constr(min_length=1, max_length=255)
    description: constr(min_length=1)

class MessageCreate(BaseModel):
    body: constr(min_length=1)


class AdminResolveBody(BaseModel):
    status: Optional[Literal["resolved","closed","investigating"]] = None
    adminResponse: Optional[str] = None

@router.post("", status_code=201)
def create_complaint(
    body: ComplaintCreateBody,
    db: Session = Depends(get_db),
    user: UserModel = Depends(get_current_user),
):
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
    if role == "admin" and user.user_id != "admin":  # TODO: Change the admin to a proper judging logic
        raise HTTPException(status_code=403, detail="Admin only")
    if role == "admin":                              # TODO: Change the admin to a proper judging logic
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
    c = ComplaintService.get(db, complaint_id)
    if user.user_id not in (c.complainant_id, c.respondent_id) and user.user_id != "admin":  # TODO: Change the admin to a proper judging logic
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
    c = ComplaintService.get(db, complaint_id)
    if user.user_id not in (c.complainant_id, c.respondent_id) and user.user_id != "admin":  # TODO: Change the admin to a proper judging logic
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
    if user.user_id != "admin":                 # TODO: Change the admin to a proper judging logic
        raise HTTPException(status_code=403, detail="Admin only")
    c = ComplaintService.admin_update(
        db,
        complaint_id=complaint_id,
        status=body.status,
        admin_response=body.adminResponse,
    )
    return _to_read(c)

