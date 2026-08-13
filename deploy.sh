#!/bin/bash
# ==============================================================================
# SCRIPT TRIỂN KHAI TỰ ĐỘNG HỆ THỐNG ĐÁNH GIÁ CBCC XÃ NGHĨA LÂM LÊN VPS LINUX
# Địa chỉ IP VPS: 36.50.26.174
# Tên miền dự kiến: kpi.nghialam.com
# ==============================================================================

set -e

echo "=== 1. CẬP NHẬT GÓI HỆ THỐNG & CÀI ĐẶT MÔI TRƯỜNG CƠ BẢN ==="
sudo apt-get update -y
sudo apt-get install -y curl git nginx build-essential

# Cài đặt Node.js 20.x LTS nếu chưa có
if ! command -v node &> /dev/null; then
    echo "Đang cài đặt Node.js v20.x LTS..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

# Cài đặt PM2 toàn cục
sudo npm install -g pm2

echo "=== 2. CÀI ĐẶT DEPENDENCIES & BUILD SERVER ==="
cd server
npm install --production=false
npm run build
cd ..

echo "=== 3. CÀI ĐẶT DEPENDENCIES & BUILD CLIENT (VITE) ==="
cd client
npm install
npm run build
cd ..

echo "=== 4. THIẾT LẬP CƠ SỞ DỮ LIỆU SQLITE ==="
cd server
npx knex migrate:latest --knexfile knexfile.ts
cd ..

echo "=== 5. KHỞI CHẠY TIẾN TRÌNH VỚI PM2 ==="
pm2 start ecosystem.config.js
pm2 save
pm2 startup | grep 'sudo' | bash || true

echo "=== 6. CẤU HÌNH NGINX WEB SERVER ==="
sudo cp nginx/cbcc.conf /etc/nginx/sites-available/cbcc.conf
sudo ln -sf /etc/nginx/sites-available/cbcc.conf /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

echo "=== 7. MỞ FIREWALL (UFW) ==="
sudo ufw allow 80/tcp || true
sudo ufw allow 443/tcp || true
sudo ufw allow 22/tcp || true
sudo ufw allow OpenSSH || true
sudo ufw --force enable || true

echo "================================================================="
echo "🎉 TRIỂN KHAI THÀNH CÔNG HỆ THỐNG ĐÁNH GIÁ CBCC XÃ NGHĨA LÂM!"
echo "🌐 Truy cập hệ thống tại: http://kpi.nghialam.com hoặc http://36.50.26.174"
echo "================================================================="
