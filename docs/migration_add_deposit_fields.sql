-- 投诉系统数据库迁移脚本
-- 添加押金扣除相关字段

USE BookHive;

-- 为complaint表添加新字段
ALTER TABLE complaint 
ADD COLUMN deducted_amount VARCHAR(20) NULL COMMENT '从押金扣除的金额',
ADD COLUMN deduction_reason TEXT NULL COMMENT '扣除押金的原因';

-- 验证字段添加成功
DESCRIBE complaint;

-- 显示完成信息
SELECT 'Migration completed successfully!' AS message;