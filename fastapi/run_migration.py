#!/usr/bin/env python3
"""
Database migration script for complaint table deposit deduction fields
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from core.dependencies import get_db
from sqlalchemy import text

def run_migration():
    """Run the migration SQL script"""
    
    migration_sql = """
    ALTER TABLE complaint 
    ADD COLUMN deducted_amount DECIMAL(10, 2) DEFAULT 0.00;
    
    ALTER TABLE complaint 
    ADD COLUMN deposit_remaining DECIMAL(10, 2);
    
    ALTER TABLE complaint 
    ADD COLUMN auto_deduction_enabled BOOLEAN DEFAULT FALSE;
    
    ALTER TABLE complaint 
    ADD COLUMN next_deduction_date DATETIME;
    
    ALTER TABLE complaint 
    ADD COLUMN is_system_generated BOOLEAN DEFAULT FALSE;
    
    ALTER TABLE complaint 
    MODIFY COLUMN type ENUM('book-condition', 'delivery', 'user-behavior', 'overdue', 'other') NOT NULL;
    """
    
    db = next(get_db())
    try:
        # Execute migration
        for statement in migration_sql.split(';'):
            statement = statement.strip()
            if statement:
                print(f"Executing: {statement[:50]}...")
                db.execute(text(statement))
        
        db.commit()
        print("Migration completed successfully!")
        
    except Exception as e:
        print(f"Migration failed: {e}")
        db.rollback()
        return False
    finally:
        db.close()
    
    return True

if __name__ == "__main__":
    success = run_migration()
    sys.exit(0 if success else 1)