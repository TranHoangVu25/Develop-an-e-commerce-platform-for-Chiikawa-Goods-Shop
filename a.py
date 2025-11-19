import json
import os
from pymongo import MongoClient

# --- 1. Kết nối MongoDB ---
uri = "mongodb://admin:123456@localhost:27017/cart_service?authSource=admin"
client = MongoClient(uri)
db = client["cart_service"]
collection = db["products"]

# --- 2. Danh sách file JSON cần import ---
json_files = [
    "products_Amenity.json",
    "products_Apparel.json",
    "products_Backpack.json",
    "products_Food.json",
    "products_Goods.json",
    "products_Interior.json",
    "products_Kitchen goods.json",
    "products_Outdoor.json",
    "products_PCSmartphone goods.json",
    "products_PlushMascot.json",
    "products_Pre-orders.json",
    "products_Stationery.json",
    "products_Towel.json"
]

# --- 3. Log file ---
log_file = "import.log"
log_lines = []

# --- 4. Hàm import từng file ---
def import_json_file(file_path):
    try:
        if not os.path.exists(file_path):
            log_lines.append(f"❌ Không tìm thấy file: {file_path}")
            return

        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        # Nếu file chứa 1 object, biến nó thành list
        if isinstance(data, dict):
            data = [data]

        imported = 0
        updated = 0

        for item in data:
            if "id" not in item:
                log_lines.append(f"⚠️  Bỏ qua bản ghi không có 'id' trong {file_path}")
                continue

            result = collection.replace_one({"id": item["id"]}, item, upsert=True)

            if result.matched_count > 0:
                updated += 1
            else:
                imported += 1

        log_lines.append(
            f"✅ {file_path}: {imported} thêm mới, {updated} cập nhật, tổng {len(data)} bản ghi."
        )

    except Exception as e:
        log_lines.append(f"❌ Lỗi khi xử lý {file_path}: {e}")


# --- 5. Import tất cả file ---
for file in json_files:
    import_json_file(file)

# --- 6. Ghi log ra file ---
with open(log_file, "w", encoding="utf-8") as f:
    f.write("\n".join(log_lines))

print("🎯 Import hoàn tất! Kiểm tra file import.log để xem chi tiết.")
