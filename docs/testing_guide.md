# 🧪 投诉系统功能测试指南

## 🚀 测试环境
- **前端**: http://localhost:3000
- **后端**: http://localhost:8000
- **API文档**: http://localhost:8000/docs

## 📋 测试清单

### 1. 基础功能测试
- [ ] 访问投诉页面: http://localhost:3000/complain
- [ ] 检查页面加载是否正常
- [ ] 验证统计卡片显示

### 2. 普通用户权限测试
#### 登录普通用户账户后：
- [ ] 只能看到"Submit and track your complaints"提示
- [ ] 看不到"Admin"标签
- [ ] 看不到"All Complaints (Admin)"按钮
- [ ] 可以创建新投诉
- [ ] 点击投诉详情页面
- [ ] 确认看不到"Admin Actions"按钮
- [ ] 可以添加消息到投诉

### 3. 管理员权限测试
#### 登录管理员账户后：
- [ ] 看到"Admin"蓝色标签
- [ ] 看到"Manage and resolve user complaints"提示
- [ ] 看到"My Complaints"和"All Complaints (Admin)"切换按钮
- [ ] 可以切换查看所有投诉
- [ ] 点击投诉详情页面
- [ ] 看到"Admin Actions"按钮
- [ ] 可以修改投诉状态
- [ ] 可以进行押金扣除操作

### 4. 押金扣除功能测试
#### 在管理员面板中：
- [ ] 选择"Deduct from Deposit"选项
- [ ] 输入扣除金额（如：25.50）
- [ ] 输入扣除原因
- [ ] 点击"Apply Action"
- [ ] 验证投诉状态变为"Resolved"
- [ ] 检查押金扣除信息显示

### 5. 工作流程测试
- [ ] 创建投诉（状态：Open）
- [ ] 管理员标记为"In Progress"
- [ ] 管理员添加回复
- [ ] 管理员解决或扣除押金（状态：Resolved）
- [ ] 管理员关闭投诉（状态：Closed）

## 🔍 预期结果

### 普通用户界面
```
Support & Complaints
Submit and track your complaints

[New Complaint 按钮]

统计卡片：Total, Open, In Progress, Resolved
投诉列表（只显示自己的）
```

### 管理员界面
```
Support & Complaints [Admin标签]
Manage and resolve user complaints

[My Complaints] [All Complaints (Admin)] [New Complaint]

统计卡片：所有投诉的统计
投诉列表（可查看所有或个人）
```

### 投诉详情页（管理员）
```
Support Details
Case ID: xxx

[Admin Actions 按钮]

投诉信息
管理员回复区域
押金扣除信息（如果有）
添加消息区域
```

## ⚠️ 注意事项

1. **权限验证**: 确保普通用户无法通过任何方式访问管理员功能
2. **数据安全**: 验证用户只能看到相关投诉
3. **状态流转**: 确认状态按照 Open → In Progress → Resolved → Closed 流转
4. **押金记录**: 验证押金扣除信息正确保存和显示

## 🐛 如遇问题

1. **权限错误**: 检查用户的`is_admin`字段
2. **API错误**: 查看后端日志 http://localhost:8000/docs
3. **前端错误**: 检查浏览器控制台
4. **数据库错误**: 确认迁移脚本已执行

## 🎯 测试成功标准

- [ ] 权限控制完全生效
- [ ] 管理员功能正常工作
- [ ] 押金扣除功能可用
- [ ] 页面响应式设计正常
- [ ] 所有API接口返回正确数据