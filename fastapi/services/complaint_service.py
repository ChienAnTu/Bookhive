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

    # Deposit deduction
    @staticmethod
    def deduct_deposit(
        db: Session,
        *,
        complaint_id: str,
        amount: float,
        reason: Optional[str] = None
    ) -> Complaint:
        """
        Deduct amount from borrower's deposit for this complaint.
        This simulates the deposit deduction by updating admin response.
        """
        c = ComplaintService.get(db, complaint_id)
        
        if not c.order_id:
            from fastapi import HTTPException
            raise HTTPException(status_code=400, detail="Cannot deduct deposit - complaint not linked to order")
        
        # Update complaint status and admin response to record the deduction
        c.status = "resolved"  # Auto-resolve after deduction
        deduction_msg = f"Deposit deduction: ${amount:.2f}"
        if reason:
            deduction_msg += f". Reason: {reason}"
        
        if c.admin_response:
            c.admin_response += f"\n{deduction_msg}"
        else:
            c.admin_response = deduction_msg
        
        db.add(c)
        db.commit()
        db.refresh(c)
        
        # TODO: Integrate with order settlement system
        # This would call OrderService.deduct_deposit(order_id, amount)
        
        return c

    @staticmethod
    def auto_deduct_overdue_deposits(db: Session) -> List[Complaint]:
        """
        Process automatic deposit deductions for overdue complaints.
        Called by scheduled task every 7 days.
        """
        from datetime import datetime, timedelta
        
        # Find overdue complaints that need auto deduction
        overdue_complaints = db.query(Complaint).filter(
            and_(
                Complaint.type == "overdue",
                Complaint.auto_deduction_enabled == True,
                Complaint.status.in_(["pending", "investigating"]),
                or_(
                    Complaint.next_deduction_date.is_(None),
                    Complaint.next_deduction_date <= datetime.now()
                )
            )
        ).all()
        
        updated_complaints = []
        for complaint in overdue_complaints:
            try:
                # Deduct 20% of remaining deposit
                # TODO: Get actual deposit amount from order
                deduction_amount = 20.00  # Placeholder - should calculate 20% of deposit
                
                complaint.deducted_amount = (complaint.deducted_amount or 0) + deduction_amount
                complaint.next_deduction_date = datetime.now() + timedelta(days=7)
                
                admin_response = f"Automatic deduction: ${deduction_amount:.2f} (20% penalty for overdue)"
                if complaint.admin_response:
                    complaint.admin_response += f"\n{admin_response}"
                else:
                    complaint.admin_response = admin_response
                
                db.add(complaint)
                updated_complaints.append(complaint)
                
            except Exception as e:
                print(f"Failed to process auto deduction for complaint {complaint.id}: {e}")
                continue
        
        if updated_complaints:
            db.commit()
            for c in updated_complaints:
                db.refresh(c)
        
        return updated_complaints
