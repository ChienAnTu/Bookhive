# ============= 导入必要的类 =============
import uuid
from datetime import datetime
from decimal import Decimal
import sys
import os

# 添加项目根目录到Python路径（从 tests 目录向上一级到 fastapi 目录）
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.insert(0, parent_dir)

# 现在可以导入模型类
from models.checkout import Checkout, CheckoutItem

# 生成唯一ID的辅助函数
def generate_uuid():
    return str(uuid.uuid4())

# ============= CHECKOUT 数据 =============
checkout_id = generate_uuid()

checkout_data = {
    "checkout_id": checkout_id,
    "user_id": "user_12345678901234567890",
    
    # 地址信息
    "contact_name": "李小红",
    "phone": "+61 456 789 012",
    "street": "88 Swanston Street, Unit 15A",
    "city": "Melbourne",
    "postcode": "3000",
    "country": "Australia",
    
    # 费用汇总（稍后计算）
    "deposit": Decimal("0.00"),      # 将根据borrowing items计算
    "service_fee": Decimal("15.00"), # 固定服务费
    "shipping_fee": Decimal("18.50"), # 配送费
    "total_due": Decimal("0.00"),    # 将在最后计算
    
    "status": "PENDING",
    "created_at": datetime.now(),
    "updated_at": datetime.now()
}

# ============= 4个 CHECKOUT ITEMS 数据 =============

# Owner 1: 3本书 (1买 + 2借)
owner_1_id = "owner_11111111111111111111"

# Owner 1 - 商品 1: 购买
checkout_item_1 = {
    "item_id": generate_uuid(),
    "checkout_id": checkout_id,
    "book_id": generate_uuid(),
    "owner_id": owner_1_id,
    "action_type": "PURCHASE",
    "price": Decimal("42.50"),        # 购买价格
    "deposit": None,                  # 购买没有押金
    "shipping_method": "Delivery",
    "shipping_quote": Decimal("8.50"),
    "service_code": "AUS_PARCEL_REGULAR",
    "created_at": datetime.now(),
    "updated_at": datetime.now()
}

# Owner 1 - 商品 2: 借阅
checkout_item_2 = {
    "item_id": generate_uuid(),
    "checkout_id": checkout_id,
    "book_id": generate_uuid(),
    "owner_id": owner_1_id,
    "action_type": "BORROW",
    "price": None,                    # 借阅没有价格
    "deposit": Decimal("30.00"),      # 借阅押金
    "shipping_method": "Delivery",
    "shipping_quote": Decimal("5.00"),
    "service_code": "AUS_PARCEL_REGULAR",
    "created_at": datetime.now(),
    "updated_at": datetime.now()
}

# Owner 1 - 商品 3: 借阅
checkout_item_3 = {
    "item_id": generate_uuid(),
    "checkout_id": checkout_id,
    "book_id": generate_uuid(),
    "owner_id": owner_1_id,
    "action_type": "BORROW",
    "price": None,                    # 借阅没有价格
    "deposit": Decimal("25.00"),      # 借阅押金
    "shipping_method": "Pickup",      # 自取
    "shipping_quote": Decimal("0.00"), # 自取无配送费
    "service_code": None,
    "created_at": datetime.now(),
    "updated_at": datetime.now()
}

# Owner 2: 2本书 (都借阅)
owner_2_id = "owner_22222222222222222222"

# Owner 2 - 商品 1: 借阅
checkout_item_4 = {
    "item_id": generate_uuid(),
    "checkout_id": checkout_id,
    "book_id": generate_uuid(),
    "owner_id": owner_2_id,
    "action_type": "BORROW",
    "price": None,                    # 借阅没有价格
    "deposit": Decimal("35.00"),      # 借阅押金
    "shipping_method": "Delivery",
    "shipping_quote": Decimal("5.00"),
    "service_code": "AUS_PARCEL_EXPRESS",
    "created_at": datetime.now(),
    "updated_at": datetime.now()
}

# Owner 2 - 商品 2: 借阅 
checkout_item_5 = {
    "item_id": generate_uuid(),
    "checkout_id": checkout_id,
    "book_id": generate_uuid(),
    "owner_id": owner_2_id,
    "action_type": "BORROW",
    "price": None,                    # 借阅没有价格
    "deposit": Decimal("40.00"),      # 借阅押金
    "shipping_method": "Delivery",
    "shipping_quote": Decimal("0.00"), # 合并配送，无额外费用
    "service_code": "AUS_PARCEL_EXPRESS",
    "created_at": datetime.now(),
    "updated_at": datetime.now()
}

# 所有checkout items
checkout_items_data = [
    checkout_item_1, checkout_item_2, checkout_item_3, 
    checkout_item_4, checkout_item_5
]

# ============= 计算费用汇总 =============

# 计算总押金 (只包括借阅的押金)
total_deposit = sum(
    item["deposit"] for item in checkout_items_data 
    if item["deposit"] is not None
)

# 计算总购买金额
total_purchase = sum(
    item["price"] for item in checkout_items_data 
    if item["price"] is not None
)

# 计算总配送费
total_shipping = sum(
    item["shipping_quote"] for item in checkout_items_data
)

# 更新checkout费用
checkout_data["deposit"] = total_deposit
checkout_data["shipping_fee"] = total_shipping
checkout_data["total_due"] = total_deposit + total_purchase + checkout_data["service_fee"] + total_shipping

# ============= 创建 SQLAlchemy 对象实例 =============

# 创建 Checkout 对象
checkout = Checkout(**checkout_data)

# 创建 CheckoutItem 对象列表
checkout_items = []
for item_data in checkout_items_data:
    checkout_item = CheckoutItem(**item_data)
    checkout_items.append(checkout_item)

# 建立关系
checkout.items = checkout_items

# ============= 测试 add_calculate_order_amounts 函数 =============

# 先创建 orders_data (模拟 split_checkout_to_orders 的返回结果)
from collections import defaultdict

def split_checkout_to_orders_simulation(checkout):
    """模拟 split_checkout_to_orders 函数的返回结果"""
    groups = defaultdict(list)
    
    for item in checkout.items:
        # 按 owner_id 和 action_type 分组
        key = (item.owner_id, item.action_type.lower())
        groups[key].append(item)
    
    return list(groups.values())

# 获取分组后的订单数据
orders_data = split_checkout_to_orders_simulation(checkout)

print("📊 split_checkout_to_orders 返回的 orders_data:")
print("-" * 50)
for i, order_items in enumerate(orders_data, 1):
    first_item = order_items[0]
    print(f"订单组 {i}: Owner {first_item.owner_id} - {first_item.action_type.upper()} ({len(order_items)} 本书)")

# 模拟 add_calculate_order_amounts 函数的计算逻辑
def add_calculate_order_amounts_simulation(orders_data, checkout):
    """模拟 add_calculate_order_amounts 函数 - 保留完整信息"""
    results = []

    for order_items in orders_data:
        if not order_items:
            continue

        deposit_or_sale_amount = 0
        shipping_out_fee_amount = 0

        # 计算 deposit 或 price 总额
        for item in order_items:
            if item.action_type.lower() == "purchase":
                deposit_or_sale_amount += float(item.price or 0)
            elif item.action_type.lower() == "borrow":
                deposit_or_sale_amount += float(item.deposit or 0)

        # 计算配送费
        post_items = [item for item in order_items if item.shipping_method and item.shipping_method.lower() == "delivery"]
        if post_items:
            shipping_out_fee_amount = float(post_items[0].shipping_quote or 0)
        else:
            shipping_out_fee_amount = 0

        # 服务费
        service_fee_amount = float(checkout.service_fee or 0)

        # ⚠️ 问题：原函数只返回计算结果，丢失了原始数据
        results.append({
            # 💰 计算出的金额字段
            "deposit_or_sale_amount": deposit_or_sale_amount,
            "service_fee_amount": service_fee_amount,
            "shipping_out_fee_amount": shipping_out_fee_amount,
            "order_total": deposit_or_sale_amount + service_fee_amount + shipping_out_fee_amount,
            
            # ❌ 缺失的重要字段：
            # "owner_id": ???
            # "action_type": ???
            # "delivery_method": ???
            # "items": ???  # CheckoutItem 列表
            # "contact_name": ???
            # "phone": ???
            # "street": ???
            # "city": ???
            # "postcode": ???
            # "country": ???
        })

    return results

# 改进版本 - 保留完整信息
def add_calculate_order_amounts_improved(orders_data, checkout):
    """改进版：保留完整的订单信息"""
    results = []

    for order_items in orders_data:
        if not order_items:
            continue

        first_item = order_items[0]  # 用于获取共同信息
        deposit_or_sale_amount = 0
        shipping_out_fee_amount = 0

        # 计算金额
        for item in order_items:
            if item.action_type.lower() == "purchase":
                deposit_or_sale_amount += float(item.price or 0)
            elif item.action_type.lower() == "borrow":
                deposit_or_sale_amount += float(item.deposit or 0)

        # 计算配送费
        post_items = [item for item in order_items if item.shipping_method and item.shipping_method.lower() == "delivery"]
        if post_items:
            shipping_out_fee_amount = float(post_items[0].shipping_quote or 0)
        else:
            shipping_out_fee_amount = 0

        service_fee_amount = float(checkout.service_fee or 0)

        # 🎯 完整的订单数据
        results.append({
            # 📋 订单基本信息
            "owner_id": first_item.owner_id,
            "action_type": first_item.action_type,
            "delivery_method": "post" if post_items else "pickup",
            "items": order_items,  # 保留原始 CheckoutItem 对象列表
            
            # 🏠 配送地址信息 (从 checkout 获取)
            "contact_name": checkout.contact_name,
            "phone": checkout.phone,
            "street": checkout.street,
            "city": checkout.city,
            "postcode": checkout.postcode,
            "country": checkout.country,
            
            # 💰 金额计算
            "deposit_or_sale_amount": deposit_or_sale_amount,
            "service_fee_amount": service_fee_amount,
            "shipping_out_fee_amount": shipping_out_fee_amount,
            "order_total": deposit_or_sale_amount + service_fee_amount + shipping_out_fee_amount,
        })

    return results

# 执行改进版计算
calculated_results_improved = add_calculate_order_amounts_improved(orders_data, checkout)

print("\n🔧 改进版 add_calculate_order_amounts 返回结果:")
print("=" * 70)
for i, result in enumerate(calculated_results_improved, 1):
    print(f"📋 订单 {i}:")
    print(f"   👤 Owner ID: {result['owner_id']}")
    print(f"   📚 Action Type: {result['action_type'].upper()}")
    print(f"   📦 Delivery Method: {result['delivery_method']}")
    print(f"   📖 Items Count: {len(result['items'])}")
    print(f"   🏠 Contact: {result['contact_name']}")
    print(f"   📍 Address: {result['street']}, {result['city']}")
    print(f"   💰 Amount: ${result['deposit_or_sale_amount']:.2f}")
    print(f"   🔧 Service Fee: ${result['service_fee_amount']:.2f}")
    print(f"   🚚 Shipping: ${result['shipping_out_fee_amount']:.2f}")
    print(f"   💵 Total: ${result['order_total']:.2f}")
    print("-" * 50)

print(f"✅ 完整数据保留：每个订单包含 {len(calculated_results_improved[0].keys())} 个字段")

print("\n⚠️  原函数问题：只返回了金额计算，缺失了:")
print("   - owner_id, action_type")
print("   - delivery_method")  
print("   - 配送地址信息")
print("   - CheckoutItem 对象列表")

print("\n✅ 测试数据创建完毕！")