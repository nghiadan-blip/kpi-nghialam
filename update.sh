#!/bin/bash
# ==============================================================================
# SCRIPT CẬP NHẬT & NÂNG CẤP HỆ THỐNG 1-CLICK TRÊN VPS (KPI-APP)
# ==============================================================================

set -Eeuo pipefail

# 1. Luôn chạy script backup_db.sh trước khi cập nhật
echo "=== 1. CHẠY SAO LƯU CƠ SỞ DỮ LIỆU ==="
if [ -f "./backup_db.sh" ]; then
    bash ./backup_db.sh
else
    echo "⚠️ Cảnh báo: Không tìm thấy tệp ./backup_db.sh, bỏ qua bước sao lưu."
fi

# 2. Định vị thư mục mã nguồn kpi-app
echo "=== 2. KÉO MÃ NGUỒN MỚI TỪ GIT ==="
cd /var/www/kpi-app

if [ -d ".git" ]; then
    echo "⏳ Đang đồng bộ mã nguồn với origin/main..."
    git fetch origin main
    git pull --ff-only origin main
else
    echo "⚠️ Cảnh báo: Không phát hiện kho Git, bỏ qua pull code."
fi

# 3. Cài đặt thư viện và Build dự án
echo "=== 3. CÀI ĐẶT DEPENDENCIES & BIÊN DỊCH ==="
# Cài đặt sạch dependencies bằng npm ci cho tính nhất quán của production
npm ci

# Biên dịch cả Client & Server
npm run build

# 4. Tải lại tiến trình Server PM2
echo "=== 4. TẢI LẠI PM2 PROCESS ==="
pm2 reload cbcc-server --update-env

# 5. Kiểm tra cấu hình và Tải lại Nginx (aaPanel)
echo "=== 5. KIỂM TRA & TẢI LẠI NGINX (aaPanel) ==="
if [ -f "/www/server/nginx/sbin/nginx" ]; then
    echo "⏳ Đang kiểm tra cấu hình Nginx..."
    /www/server/nginx/sbin/nginx -t -c /www/server/nginx/conf/nginx.conf

    echo "⏳ Đang reload Nginx..."
    /www/server/nginx/sbin/nginx -s reload
    echo "✅ Đã tải lại cấu hình Nginx thành công."
else
    echo "⚠️ Cảnh báo: Không tìm thấy Nginx tại đường dẫn aaPanel mặc định."
fi

# 6. Kiểm tra API Health Check của Backend
echo "=== 6. KIỂM TRA SỨC KHỎE API BACKEND ==="
echo "⏳ Đang kiểm tra API Health Check..."
if curl -fsS http://127.0.0.1:5000/api/health > /dev/null; then
    echo "✅ API Health Check: [OK] - Server phản hồi tốt!"
else
    echo "❌ LỖI: API Backend không phản hồi hoặc phản hồi lỗi!" >&2
    exit 1
fi

echo "================================================================="
echo "🎉 QUY TRÌNH NẬP CODE & NÂNG CẤP VPS HOÀN TẤT THÀNH CÔNG!"
echo "🌐 Ứng dụng hoạt động tại: https://kpi.nghialam.com"
echo "================================================================="
