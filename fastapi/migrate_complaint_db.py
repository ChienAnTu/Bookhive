#!/usr/bin/env python3
"""
BookHive 数据库迁移脚本
添加投诉系统押金扣除功能所需的数据库字段
"""

import pymysql
import os
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# 数据库连接配置
DB_CONFIG = {
    'host': 'capstone15db.c7u8yy6k6lxl.ap-southeast-2.rds.amazonaws.com',
    'user': 'admin',
    'password': '12345678',
    'database': 'BookHive',
    'charset': 'utf8mb4',
    'port': 3306
}

def execute_migration():
    """执行数据库迁移"""
    connection = None
    try:
        # 连接数据库
        print("🔗 连接到数据库...")
        connection = pymysql.connect(**DB_CONFIG)
        cursor = connection.cursor()
        
        # 检查complaint表是否存在
        cursor.execute("SHOW TABLES LIKE 'complaint'")
        if not cursor.fetchone():
            print("❌ complaint表不存在，请先创建基础表结构")
            return False
            
        # 检查字段是否已存在
        cursor.execute("DESCRIBE complaint")
        existing_columns = [row[0] for row in cursor.fetchall()]
        
        fields_to_add = []
        if 'deducted_amount' not in existing_columns:
            fields_to_add.append("deducted_amount VARCHAR(20) NULL COMMENT '从押金中扣除的金额'")
        if 'deduction_reason' not in existing_columns:
            fields_to_add.append("deduction_reason TEXT NULL COMMENT '押金扣除的原因说明'")
            
        if not fields_to_add:
            print("✅ 数据库字段已存在，无需迁移")
            return True
            
        # 执行ALTER TABLE添加字段
        for field in fields_to_add:
            sql = f"ALTER TABLE complaint ADD COLUMN {field}"
            print(f"📝 执行: {sql}")
            cursor.execute(sql)
            
        # 提交更改
        connection.commit()
        print("✅ 数据库迁移成功完成！")
        
        # 验证字段添加
        cursor.execute("DESCRIBE complaint")
        columns = cursor.fetchall()
        print("\n📋 complaint表当前结构:")
        for col in columns:
            print(f"   {col[0]} - {col[1]} - {col[2]} - {col[5]}")
            
        return True
        
    except Exception as e:
        print(f"❌ 数据库迁移失败: {str(e)}")
        if connection:
            connection.rollback()
        return False
        
    finally:
        if connection:
            connection.close()
            print("🔒 数据库连接已关闭")

if __name__ == "__main__":
    print("🚀 开始BookHive投诉系统数据库迁移...")
    success = execute_migration()
    if success:
        print("🎉 迁移完成！可以重启后端服务了。")
    else:
        print("💥 迁移失败！请检查数据库连接和权限。")