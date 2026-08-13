#!/bin/bash
# ==============================================================================
# SCRIPT TỰ ĐỘNG SAO LƯU DỮ LIỆU ĐÁNH GIÁ CBCC HÀNG NGÀY TRÊN VPS (KPI-APP)
# ==============================================================================

set -Eeuo pipefail
umask 077

BACKUP_DIR="/var/backups/kpi"
DB_FILE="/var/www/kpi-data/cbcc.sqlite"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/cbcc_${TIMESTAMP}.sqlite"

echo "=== BẮT ĐẦU QUY TRÌNH SAO LƯU CƠ SỞ DỮ LIỆU ==="

# 1. Kiểm tra sự tồn tại của CSDL nguồn
if [ ! -f "$DB_FILE" ]; then
    echo "❌ LỖI: Không tìm thấy file cơ sở dữ liệu nguồn tại: $DB_FILE" >&2
    exit 1
fi

# 2. Kiểm tra sự tồn tại của công cụ sqlite3
if ! command -v sqlite3 &> /dev/null; then
    echo "❌ LỖI: Công cụ 'sqlite3' chưa được cài đặt trên VPS. Vui lòng cài đặt bằng: apt-get install sqlite3" >&2
    exit 1
fi

# 3. Tạo thư mục sao lưu nếu chưa có
mkdir -p "$BACKUP_DIR"

# 4. Thực hiện sao lưu online nhất quán bằng sqlite3 .backup
echo "⏳ Đang tạo bản sao lưu trực tuyến của SQLite..."
sqlite3 "$DB_FILE" ".backup '$BACKUP_FILE'"

# 5. Nén tệp sao lưu bằng gzip
if [ -f "$BACKUP_FILE" ]; then
    echo "⏳ Đang nén tệp sao lưu..."
    gzip "$BACKUP_FILE"
    echo "✅ Đã sao lưu và nén CSDL thành công tại: ${BACKUP_FILE}.gz"
else
    echo "❌ LỖI: Không thể tạo tệp sao lưu." >&2
    exit 1
fi

# 6. Dọn dẹp các tệp sao lưu cũ hơn 30 ngày
echo "⏳ Đang kiểm tra và dọn dẹp các tệp sao lưu cũ (trên 30 ngày)..."
find "$BACKUP_DIR" -type f -name "cbcc_*.sqlite.gz" -mtime +30 -delete
echo "✅ Đã dọn dẹp xong."

echo "=== HOÀN TẤT SAO LƯU DỮ LIỆU ==="
