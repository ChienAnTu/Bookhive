-- Migration: Add deposit deduction fields to complaint table
-- Date: 2025-10-03
-- Description: Add fields to support deposit deduction functionality for complaints

-- Add new fields to complaint table
ALTER TABLE complaint 
ADD COLUMN deducted_amount DECIMAL(10, 2) DEFAULT 0.00,
ADD COLUMN deposit_remaining DECIMAL(10, 2),
ADD COLUMN auto_deduction_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN next_deduction_date DATETIME,
ADD COLUMN is_system_generated BOOLEAN DEFAULT FALSE;

-- Update complaint type enum to include 'overdue'
ALTER TABLE complaint 
MODIFY COLUMN type ENUM('book-condition', 'delivery', 'user-behavior', 'overdue', 'other') NOT NULL;

-- Add index for auto deduction queries
CREATE INDEX idx_complaint_auto_deduction ON complaint (type, auto_deduction_enabled, next_deduction_date);

-- Add index for system generated complaints
CREATE INDEX idx_complaint_system_generated ON complaint (is_system_generated, created_at);