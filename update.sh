#!/bin/bash
# ==============================================================================
# SCRIPT CẬP NHẬT & NÂNG CẤP HỆ THỐNG 1-CLICK TRÊN VPS (KHÔNG MẤT DỮ LIỆU)
# ==============================================================================

set -e

echo "=== 1. TỰ ĐỘNG SAO LƯU CƠ SỞ DỮ LIỆU TRƯỚC KHI NÂNG CẤP ==="
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
mkdir -p /var/backups/cbcc
if [ -f "server/database/cbcc.sqlite" ]; then
    cp server/database/cbcc.sqlite "/var/backups/cbcc/cbcc_backup_${TIMESTAMP}.sqlite"
    echo "✅ Đã tạo bản sao lưu an toàn tại: /var/backups/cbcc/cbcc_backup_${TIMESTAMP}.sqlite"
fi

echo "=== 2. KÉO CODE MỚI TỪ GIT (NẾU CÓ DÙNG GIT) ==="
if [ -d ".git" ]; then
    git pull origin main || git pull origin master
fi

echo "=== 3. CÀI ĐẶT THƯ VIỆN & BUILD LẠI BACKEND ==="
cd server
npm install --production=false
npm run build
# Chạy migration nếu có thêm bảng/cột mới
npx knex migrate:latest --knexfile knexfile.ts || true
cd ..

echo "=== 4. BUILD LẠI FRONTEND (VITE / REACT) ==="
cd client
npm install
npm run build
cd ..

echo "=== 5. RELOAD ỨNG DỤNG KHÔNG GIÁN ĐOẠN (ZERO-DOWNTIME) ==="
pm2 reload cbcc-server
sudo systemctl reload nginx

echo "================================================================="
echo "🎉 NÂNG CẤP VÀ FIX LỖI THÀNH CÔNG!"
echo "🌐 Hệ thống đã sẵn sàng tại: https://kpi.nghialam.com"
echo "================================================================="
