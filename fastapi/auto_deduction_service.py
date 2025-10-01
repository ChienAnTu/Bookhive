#!/usr/bin/env python3
"""
逾期投诉自动押金扣除系统
每7天自动扣除20%押金
"""

import pymysql
import schedule
import time
from datetime import datetime, timedelta
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

def process_overdue_complaints():
    """处理逾期投诉自动押金扣除"""
    connection = None
    try:
        print(f"🔄 {datetime.now()} - 开始检查逾期投诉...")
        connection = pymysql.connect(**DB_CONFIG)
        cursor = connection.cursor()
        
        # 查找需要扣除押金的逾期投诉
        # 条件：type='overdue', status='pending' or 'investigating', 每7天扣除一次
        query = """
        SELECT id, complainant_id, created_at, deducted_amount
        FROM complaint 
        WHERE type = 'overdue' 
        AND status IN ('pending', 'investigating')
        AND (
            deducted_amount IS NULL 
            OR (created_at <= %s AND deducted_amount IS NOT NULL)
        )
        """
        
        # 查找7天前创建的投诉
        seven_days_ago = datetime.now() - timedelta(days=7)
        cursor.execute(query, (seven_days_ago,))
        overdue_complaints = cursor.fetchall()
        
        processed_count = 0
        
        for complaint_id, complainant_id, created_at, current_deducted in overdue_complaints:
            try:
                # 计算应该扣除的总金额（每7天20%）
                days_overdue = (datetime.now() - created_at).days
                deduction_cycles = days_overdue // 7
                
                if deduction_cycles > 0:
                    # 假设押金为$100，每次扣除20%
                    base_deposit = 100.0
                    total_deduction_rate = min(deduction_cycles * 0.2, 1.0)  # 最多扣除100%
                    deduction_amount = base_deposit * total_deduction_rate
                    
                    # 更新投诉记录
                    update_query = """
                    UPDATE complaint 
                    SET deducted_amount = %s,
                        deduction_reason = %s,
                        status = CASE 
                            WHEN %s >= 100.0 THEN 'closed'
                            ELSE 'resolved'
                        END,
                        admin_response = %s,
                        updated_at = NOW()
                    WHERE id = %s
                    """
                    
                    reason = f"Automatic deduction for overdue (Day {days_overdue}): {deduction_cycles * 20}% of deposit"
                    admin_response = f"System automatically deducted ${deduction_amount:.2f} from deposit due to overdue violation."
                    
                    cursor.execute(update_query, (
                        f"{deduction_amount:.2f}",
                        reason,
                        deduction_amount,
                        admin_response,
                        complaint_id
                    ))
                    
                    processed_count += 1
                    print(f"✅ 处理投诉 {complaint_id}: 扣除 ${deduction_amount:.2f}")
                    
            except Exception as e:
                print(f"❌ 处理投诉 {complaint_id} 时出错: {str(e)}")
                continue
        
        # 提交所有更改
        connection.commit()
        print(f"🎯 完成处理，共处理 {processed_count} 个逾期投诉")
        
    except Exception as e:
        print(f"❌ 自动扣除系统出错: {str(e)}")
        if connection:
            connection.rollback()
            
    finally:
        if connection:
            connection.close()

def start_auto_deduction_service():
    """启动自动扣除服务"""
    print("🚀 启动逾期投诉自动扣除服务...")
    
    # 每天检查一次
    schedule.every().day.at("02:00").do(process_overdue_complaints)
    
    print("⏰ 已安排每天凌晨2点执行自动扣除检查")
    print("🔧 首次运行检查...")
    process_overdue_complaints()
    
    while True:
        schedule.run_pending()
        time.sleep(60)  # 每分钟检查一次调度

if __name__ == "__main__":
    start_auto_deduction_service()