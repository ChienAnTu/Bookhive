#!/usr/bin/env python3
"""
Automatic Deposit Deduction Service for BookHive

This service handles:
1. Automatic creation of overdue complaints when orders become overdue
2. Automatic 20% deposit deduction every 7 days for overdue complaints
3. Order settlement updates after deductions

Run this as a scheduled task (e.g., daily cron job)
"""

import sys
import os
from datetime import datetime, timedelta
from typing import List

# Add the fastapi directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database.connection import get_db
from services.complaint_service import ComplaintService
from models.order import Order
from models.complaint import Complaint
from sqlalchemy import and_


def create_overdue_complaints():
    """
    Check for overdue orders and create automatic complaints for them.
    """
    print(f"[{datetime.now()}] Checking for overdue orders...")
    
    db = next(get_db())
    try:
        # Find orders that are overdue but don't have complaints yet
        now = datetime.now()
        overdue_orders = db.query(Order).filter(
            and_(
                Order.status == "BORROWING",
                Order.due_at < now,
                # TODO: Add check to ensure no existing overdue complaint exists
            )
        ).all()
        
        created_complaints = []
        
        for order in overdue_orders:
            try:
                # Check if overdue complaint already exists
                existing_complaint = db.query(Complaint).filter(
                    and_(
                        Complaint.order_id == order.id,
                        Complaint.type == "overdue"
                    )
                ).first()
                
                if existing_complaint:
                    continue  # Skip if complaint already exists
                
                # Calculate days overdue
                days_overdue = (now - order.due_at).days
                
                # Create system-generated overdue complaint
                complaint = ComplaintService.create(
                    db,
                    complainant_id="system",  # System-generated
                    order_id=order.id,
                    respondent_id=order.borrower_id,
                    type="overdue",
                    subject=f"Book return overdue - {days_overdue} days",
                    description=f"This order became overdue on {order.due_at.strftime('%Y-%m-%d')}. "
                               f"Automatic deposit deductions will apply every 7 days until resolved.",
                    is_system_generated=True
                )
                
                created_complaints.append(complaint)
                print(f"Created overdue complaint for order {order.id} ({days_overdue} days overdue)")
                
            except Exception as e:
                print(f"Failed to create overdue complaint for order {order.id}: {e}")
                continue
        
        print(f"Created {len(created_complaints)} new overdue complaints")
        return created_complaints
        
    finally:
        db.close()


def process_automatic_deductions():
    """
    Process automatic 20% deposit deductions for overdue complaints.
    """
    print(f"[{datetime.now()}] Processing automatic deposit deductions...")
    
    db = next(get_db())
    try:
        updated_complaints = ComplaintService.auto_deduct_overdue_deposits(db)
        
        print(f"Processed automatic deductions for {len(updated_complaints)} complaints")
        
        for complaint in updated_complaints:
            print(f"  - Complaint {complaint.id}: Deducted ${complaint.deducted_amount}")
        
        return updated_complaints
        
    finally:
        db.close()


def update_order_statuses():
    """
    Update order statuses from BORROWING to OVERDUE when appropriate.
    """
    print(f"[{datetime.now()}] Updating overdue order statuses...")
    
    db = next(get_db())
    try:
        now = datetime.now()
        
        # Find borrowing orders that are past due date
        overdue_orders = db.query(Order).filter(
            and_(
                Order.status == "BORROWING",
                Order.due_at < now
            )
        ).all()
        
        updated_count = 0
        for order in overdue_orders:
            order.status = "OVERDUE"
            db.add(order)
            updated_count += 1
        
        if updated_count > 0:
            db.commit()
            print(f"Updated {updated_count} orders to OVERDUE status")
        
        return updated_count
        
    except Exception as e:
        print(f"Failed to update order statuses: {e}")
        db.rollback()
        return 0
    finally:
        db.close()


def main():
    """
    Main function to run all automatic processes.
    """
    print(f"[{datetime.now()}] Starting automatic deduction service...")
    
    try:
        # Step 1: Update order statuses
        update_order_statuses()
        
        # Step 2: Create overdue complaints for new overdue orders
        create_overdue_complaints()
        
        # Step 3: Process automatic deductions for existing overdue complaints
        process_automatic_deductions()
        
        print(f"[{datetime.now()}] Automatic deduction service completed successfully")
        
    except Exception as e:
        print(f"[{datetime.now()}] Error in automatic deduction service: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()