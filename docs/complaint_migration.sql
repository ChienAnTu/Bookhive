-- BookHive 投诉系统数据库迁移脚本
-- 版本：1.0
-- 目的：添加押金扣除相关字段

-- 使用BookHive数据库
USE BookHive;

-- 检查complaint表当前结构
DESCRIBE complaint;

-- 为complaint表添加押金扣除相关字段
ALTER TABLE complaint 
ADD COLUMN IF NOT EXISTS deducted_amount VARCHAR(20) NULL COMMENT '从押金中扣除的金额',
ADD COLUMN IF NOT EXISTS deduction_reason TEXT NULL COMMENT '押金扣除的原因说明';

-- 验证字段添加成功
SELECT 'Fields added successfully!' AS status;
DESCRIBE complaint;

-- 显示complaint表的所有数据（用于验证）
SELECT COUNT(*) AS total_complaints FROM complaint;

-- 创建索引以提高查询性能（可选）
CREATE INDEX IF NOT EXISTS idx_complaint_deducted ON complaint(deducted_amount);

-- 显示完成信息
SELECT 
    'Database migration completed successfully!' AS message,
    NOW() AS completed_at;