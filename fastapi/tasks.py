"""
tasks.py - Background tasks for order status updates

This module defines a scheduled job to automatically update order statuses 
in the database, such as transitioning orders from PENDING_SHIPMENT to BORROWING
and marking overdue orders.

Usage:
    from task import start_scheduler, stop_scheduler

    # Start scheduler when FastAPI app starts
    start_scheduler()

    # Stop scheduler when FastAPI app shuts down
    stop_scheduler()
"""

from apscheduler.schedulers.background import BackgroundScheduler
from services.order_service import OrderService
from database import SessionLocal 

scheduler = BackgroundScheduler()

def update_order_statuses():
    """hourly check and update order status"""
    db = SessionLocal() 
    try:
        borrowing_count = OrderService.update_borrowing_status(db)
        overdue_count = OrderService.update_overdue_status(db)
        print(f"Updated {borrowing_count} orders to BORROWING, {overdue_count} to OVERDUE")
    finally:
        db.close() 

def start_scheduler():
    """Start the scheduled task scheduler"""
    scheduler.add_job(update_order_statuses, 'interval', hours=1, id="order_status_job")
    scheduler.start()
    print("Order status scheduler started")

def stop_scheduler():
    """Stop the scheduled task scheduler"""
    scheduler.shutdown()
    print("Order status scheduler stopped")