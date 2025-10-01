# 自动投诉系统实施指南

## 概述
本文档描述如何实现自动投诉创建和押金扣除系统，以处理逾期订单。

## 工作流程

### 1. 逾期检测
系统需要定期（建议每天）检查以下条件：
- 借阅订单的截止日期已过
- 书籍尚未归还
- 尚未为此订单创建逾期投诉

### 2. 自动投诉创建
当检测到逾期订单时：
```python
# 伪代码示例
for overdue_order in get_overdue_orders():
    # 调用API创建逾期投诉
    create_overdue_complaint(
        order_id=overdue_order.id,
        borrower_id=overdue_order.borrower_id,
        lender_id=overdue_order.lender_id
    )
```

### 3. 自动押金扣除
对于逾期投诉，系统应：
- 每7天自动扣除20%押金
- 记录扣除历史
- 通知相关用户

## API端点

### 创建逾期投诉
```
POST /api/v1/complaints/auto-create-overdue
```
**请求体：**
```json
{
  "orderId": "order_id_here",
  "borrowerId": "borrower_user_id",
  "lenderId": "lender_user_id"
}
```

### 押金扣除
```
POST /api/v1/complaints/{complaint_id}/deduct-deposit
```
**请求体：**
```json
{
  "amount": 10.50,
  "reason": "Automatic deduction for overdue - Day 7"
}
```

## 实施建议

### 方案一：定时任务（推荐）
使用系统cron job或任务调度器：
```bash
# 每天午夜检查逾期订单
0 0 * * * python /path/to/check_overdue_orders.py
```

### 方案二：后台服务
创建一个持续运行的服务，定期执行检查。

### 方案三：事件驱动
在订单状态变更时触发检查。

## 数据库迁移
需要为complaint表添加新字段：
```sql
ALTER TABLE complaint 
ADD COLUMN deducted_amount VARCHAR(20),
ADD COLUMN deduction_reason TEXT;
```

## 权限控制
- 只有管理员可以创建系统投诉
- 只有管理员可以执行押金扣除
- 用户可以查看与自己相关的投诉

## 通知系统
建议实施：
- 邮件通知逾期用户
- 系统内消息通知
- 押金扣除确认通知

## 测试建议
1. 创建测试逾期订单
2. 验证投诉自动创建
3. 测试押金扣除功能
4. 验证权限控制
5. 测试通知系统