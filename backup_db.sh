#!/bin/bash
# ==============================================================================
# SCRIPT TỰ ĐỘNG SAO LƯU DỮ LIỆU ĐÁNH GIÁ CBCC HÀNG NGÀY TRÊN VPS
# ==============================================================================

BACKUP_DIR="/var/backups/cbcc"
mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_FILE="/var/www/cbcc-app/server/database/cbcc.sqlite"
BACKUP_FILE="$BACKUP_DIR/cbcc_daily_${TIMESTAMP}.sqlite"

if [ -f "$DB_FILE" ]; then
    # Sao lưu an toàn bằng lệnh copy
    cp "$DB_FILE" "$BACKUP_FILE"
    # Nén file để tiết kiệm dung lượng
    gzip "$BACKUP_FILE"
    echo "✅ [$(date)] Đã sao lưu CSDL thành công: ${BACKUP_FILE}.gz"

    # Tự động dọn dẹp các bản sao lưu cũ hơn 30 ngày để tránh đầy ổ cứng
    find "$BACKUP_DIR" -type f -name "*.sqlite.gz" -mtime +30 -delete
else
    echo "❌ [$(date)] Không tìm thấy file CSDL tại: $DB_FILE"
fi
