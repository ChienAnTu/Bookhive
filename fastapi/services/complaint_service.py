from uuid import uuid4
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import select, or_, and_

from models.complaint import Complaint, ComplaintMessage, COMPLAINT_STATUS_ENUM, COMPLAINT_TYPE_ENUM

class ComplaintService:

    # Create
    @staticmethod
    def create(
        db: Session,
        *,
        complainant_id: str,
        type: str,
        subject: str,
        description: str,
        order_id: Optional[str] = None,
        respondent_id: Optional[str] = None,
    ) -> Complaint:
        if type not in COMPLAINT_TYPE_ENUM:
            from fastapi import HTTPException
            raise HTTPException(status_code=422, detail="Invalid complaint type")

        c = Complaint(
            id=str(uuid4()),
            complainant_id=complainant_id,
            respondent_id=respondent_id,
            order_id=order_id,
            type=type,
            subject=subject,
            description=description,
            status="pending",
        )
        db.add(c)
        db.commit()
        db.refresh(c)
        return c

    # List (by user role)
    @staticmethod
    def list_for_user(
        db: Session,
        *,
        user_id: str,
        status: Optional[str] = None
    ) -> List[Complaint]:
        stmt = select(Complaint).where(
            or_(Complaint.complainant_id == user_id, Complaint.respondent_id == user_id)
        )
        if status:
            stmt = stmt.where(Complaint.status == status)
        return db.execute(stmt.order_by(Complaint.created_at.desc())).scalars().all()

    # Admin list
    @staticmethod
    def list_all(db: Session, *, status: Optional[str] = None) -> List[Complaint]:
        stmt = select(Complaint)
        if status:
            stmt = stmt.where(Complaint.status == status)
        return db.execute(stmt.order_by(Complaint.created_at.desc())).scalars().all()

    # Get (with permission check deferred to router)
    @staticmethod
    def get(db: Session, complaint_id: str) -> Complaint:
        c = db.get(Complaint, complaint_id)
        if not c:
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="Complaint not found")
        return c

    # Update status / admin response
    @staticmethod
    def admin_update(
        db: Session,
        *,
        complaint_id: str,
        status: Optional[str] = None,
        admin_response: Optional[str] = None
    ) -> Complaint:
        c = ComplaintService.get(db, complaint_id)
        if status:
            if status not in COMPLAINT_STATUS_ENUM:
                from fastapi import HTTPException
                raise HTTPException(status_code=422, detail="Invalid status")
            c.status = status
        if admin_response is not None:
            c.admin_response = admin_response
        db.add(c)
        db.commit()
        db.refresh(c)
        return c

    # Messages
    @staticmethod
    def add_message(db: Session, *, complaint_id: str, sender_id: str, body: str) -> ComplaintMessage:
        ComplaintService.get(db, complaint_id)  # ensure exists
        m = ComplaintMessage(
            id=str(uuid4()),
            complaint_id=complaint_id,
            sender_id=sender_id,
            body=body.strip()
        )
        db.add(m)
        db.commit()
        db.refresh(m)
        return m

    @staticmethod
    def list_messages(db: Session, *, complaint_id: str) -> List[ComplaintMessage]:
        return db.query(ComplaintMessage).filter(ComplaintMessage.complaint_id == complaint_id).order_by(ComplaintMessage.created_at.asc()).all()
