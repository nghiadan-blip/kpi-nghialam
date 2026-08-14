# HƯỚNG DẪN TRIỂN KHAI & GHI NHẬN HỆ THỐNG KPI XÃ NGHĨA LÂM

Tài liệu này ghi nhận chi tiết quá trình hoàn thiện hệ thống `kpi.nghialam.com` nâng cấp các mô-đun quản lý hành chính phục vụ công tác điều hành của Chủ tịch UBND xã Nghĩa Lâm.

---

## 1. Hiện Trạng Repository & Nhánh Làm Việc

- **Nhánh hiện tại (Branch)**: `main` (đã đồng bộ với `feature/ubnd-executive-modules`)
- **Commit hash cuối cùng**: `d7ad342`
- **Tình trạng push GitHub**: Đã push thành công cả 2 nhánh lên `origin/main` và `origin/feature/ubnd-executive-modules`.

---

## 2. Danh Sách Các Tệp Đã Tạo & Chỉnh Sửa

### 📂 Cơ sở dữ liệu & Migration
- **Tạo mới**: [`server/database/migrations/20260814000000_create_ubnd_executive_modules.ts`](file:///d:/Dropbox/Văn%20bản/UBND%20xa%20Nghia%20Lam/CBCC/cbcc-app/server/database/migrations/20260814000000_create_ubnd_executive_modules.ts) (Tạo cấu trúc 6 bảng nghiệp vụ mới).
- **Chỉnh sửa**: [`server/database/seeds/01_initial_seed.ts`](file:///d:/Dropbox/Văn%20bản/UBND%20xa%20Nghia%20Lam/CBCC/cbcc-app/server/database/seeds/01_initial_seed.ts) (Nạp dữ liệu giả lập thực tế của các xóm thuộc xã Nghĩa Lâm).

### 📂 Backend (Controllers & Routes)
- **Tạo mới**:
  - [`server/src/controllers/budgetController.ts`](file:///d:/Dropbox/Văn%20bản/UBND%20xa%20Nghia%20Lam/CBCC/cbcc-app/server/src/controllers/budgetController.ts) (API thu/chi ngân sách địa phương và xuất file Excel).
  - [`server/src/controllers/publicInvestmentController.ts`](file:///d:/Dropbox/Văn%20bản/UBND%20xa%20Nghia%20Lam/CBCC/cbcc-app/server/src/controllers/publicInvestmentController.ts) (API tiến độ giải ngân đầu tư công từng công trình và xuất file Excel).
  - [`server/src/controllers/landCertificateController.ts`](file:///d:/Dropbox/Văn%20bản/UBND%20xa%20Nghia%20Lam/CBCC/cbcc-app/server/src/controllers/landCertificateController.ts) (API phân luồng hồ sơ GCN QSDĐ xanh/vàng/đỏ và Kế hoạch 965).
  - [`server/src/controllers/officeController.ts`](file:///d:/Dropbox/Văn%20bản/UBND%20xa%20Nghia%20Lam/CBCC/cbcc-app/server/src/controllers/officeController.ts) (API hậu cần xe công, hội trường, tiếp khách và quyết toán văn phòng phẩm).
  - [`server/src/controllers/executiveDashboardController.ts`](file:///d:/Dropbox/Văn%20bản/UBND%20xa%20Nghia%20Lam/CBCC/cbcc-app/server/src/controllers/executiveDashboardController.ts) (API bảng điều hành Chủ tịch tích hợp thư ký AI DeepSeek tóm tắt).
  - [`server/src/routes/budgetRoutes.ts`](file:///d:/Dropbox/Văn%20bản/UBND%20xa%20Nghia%20Lam/CBCC/cbcc-app/server/src/routes/budgetRoutes.ts)
  - [`server/src/routes/publicInvestmentRoutes.ts`](file:///d:/Dropbox/Văn%20bản/UBND%20xa%20Nghia%20Lam/CBCC/cbcc-app/server/src/routes/publicInvestmentRoutes.ts)
  - [`server/src/routes/landCertificateRoutes.ts`](file:///d:/Dropbox/Văn%20bản/UBND%20xa%20Nghia%20Lam/CBCC/cbcc-app/server/src/routes/landCertificateRoutes.ts)
  - [`server/src/routes/officeRoutes.ts`](file:///d:/Dropbox/Văn%20bản/UBND%20xa%20Nghia%20Lam/CBCC/cbcc-app/server/src/routes/officeRoutes.ts)
  - [`server/src/routes/executiveDashboardRoutes.ts`](file:///d:/Dropbox/Văn%20bản/UBND%20xa%20Nghia%20Lam/CBCC/cbcc-app/server/src/routes/executiveDashboardRoutes.ts)
- **Chỉnh sửa**:
  - [`server/src/app.ts`](file:///d:/Dropbox/Văn%20bản/UBND%20xa%20Nghia%20Lam/CBCC/cbcc-app/server/src/app.ts) (Khai báo và gắn kết 5 route nghiệp vụ mới).
  - [`server/src/models/index.ts`](file:///d:/Dropbox/Văn%20bản/UBND%20xa%20Nghia%20Lam/CBCC/cbcc-app/server/src/models/index.ts) (Khai báo kiểu TypeScript Knex Table).
  - [`server/src/controllers/evaluationController.ts`](file:///d:/Dropbox/Văn%20bản/UBND%20xa%20Nghia%20Lam/CBCC/cbcc-app/server/src/controllers/evaluationController.ts) (Đồng bộ điểm chuẩn criteria về 10/10/10 theo QĐ 283).
  - [`server/test_e2e_full.ts`](file:///d:/Dropbox/Văn%20bản/UBND%20xa%20Nghia%20Lam/CBCC/cbcc-app/server/test_e2e_full.ts) (Tích hợp tự động reset seed trước khi chạy).

### 📂 Frontend (Vite & React)
- **Tạo mới**:
  - [`client/src/pages/Budget.tsx`](file:///d:/Dropbox/Văn%20bản/UBND%20xa%20Nghia%20Lam/CBCC/cbcc-app/client/src/pages/Budget.tsx) (Giao diện Quản lý ngân sách).
  - [`client/src/pages/PublicInvestment.tsx`](file:///d:/Dropbox/Văn%20bản/UBND%20xa%20Nghia%20Lam/CBCC/cbcc-app/client/src/pages/PublicInvestment.tsx) (Giao diện tiến độ công trình đầu tư công).
  - [`client/src/pages/LandCertificates.tsx`](file:///d:/Dropbox/Văn%20bản/UBND%20xa%20Nghia%20Lam/CBCC/cbcc-app/client/src/pages/LandCertificates.tsx) (Giao diện rà soát đất đai & KH 965).
  - [`client/src/pages/OfficeManagement.tsx`](file:///d:/Dropbox/Văn%20bản/UBND%20xa%20Nghia%20Lam/CBCC/cbcc-app/client/src/pages/OfficeManagement.tsx) (Giao diện đăng ký hậu cần văn phòng).
- **Chỉnh sửa**:
  - [`client/src/types/index.ts`](file:///d:/Dropbox/Văn%20bản/UBND%20xa%20Nghia%20Lam/CBCC/cbcc-app/client/src/types/index.ts) (Đồng bộ kiểu TypeScript API).
  - [`client/src/services/api.ts`](file:///d:/Dropbox/Văn%20bản/UBND%20xa%20Nghia%20Lam/CBCC/cbcc-app/client/src/services/api.ts) (Khai báo API Axios connection).
  - [`client/src/App.tsx`](file:///d:/Dropbox/Văn%20bản/UBND%20xa%20Nghia%20Lam/CBCC/cbcc-app/client/src/App.tsx) (Khai báo định tuyến các trang nghiệp vụ mới).
  - [`client/src/components/Navbar.tsx`](file:///d:/Dropbox/Văn%20bản/UBND%20xa%20Nghia%20Lam/CBCC/cbcc-app/client/src/components/Navbar.tsx) (Thêm liên kết phân quyền trên menu chính).
  - [`client/src/pages/Dashboard.tsx`](file:///d:/Dropbox/Văn%20bản/UBND%20xa%20Nghia%20Lam/CBCC/cbcc-app/client/src/pages/Dashboard.tsx) (Giao diện Bảng Điều Hành Chủ Tịch tích hợp thư ký AI).

---

## 3. Danh Sách API Đã Tạo Mới (RBAC Secured)

| Endpoint | Method | Vai trò được phép | Mô tả tính năng |
| :--- | :---: | :---: | :--- |
| `/api/budget` | `GET` | Mọi CBCC | Xem dự toán thu/chi ngân sách xóm/xã |
| `/api/budget/revenue` | `POST`/`PUT`/`DELETE` | ADMIN, LEADERSHIP, DEPT_HEAD | Quản lý nguồn thu đất đai công ích, hoa lợi |
| `/api/budget/expenditure` | `POST`/`PUT`/`DELETE` | Mọi CBCC | Đăng ký chi hoạt động công vụ & phê duyệt |
| `/api/budget/export` | `GET` | Mọi CBCC | Xuất Excel bảng thu chi ngân sách năm |
| `/api/public-investment` | `GET` | Mọi CBCC | Xem tiến độ thi công và giải ngân công trình |
| `/api/public-investment` | `POST`/`PUT`/`DELETE` | ADMIN, LEADERSHIP, DEPT_HEAD | Cập nhật tiến độ dự án, tháo gỡ vướng mắc |
| `/api/public-investment/export` | `GET` | Mọi CBCC | Xuất Excel tiến độ các công trình đầu tư |
| `/api/land-certificates/cases` | `GET`/`POST`/`PUT`/`DELETE` | Mọi CBCC | CRUD hồ sơ cấp sổ phân luồng xanh/vàng/đỏ |
| `/api/land-certificates/kh965` | `GET`/`POST` | Mọi CBCC | Cập nhật số thửa rà soát theo xóm |
| `/api/office` | `GET`/`POST` | Mọi CBCC | Đăng ký lịch xe công, phòng họp, tiếp khách |
| `/api/office/:id` | `PUT`/`DELETE` | Lãnh đạo hoặc Chủ đơn | Duyệt trạng thái chuẩn bị, quyết toán hóa đơn |
| `/api/executive-dashboard` | `GET` | LEADERSHIP, ADMIN | Bảng số liệu điều hành và AI kết luận giao ban |

---

## 4. Kết Quả Kiểm Thử & Build Đóng Gói
1. **Biên dịch Frontend (Vite build)**: **THÀNH CÔNG** (Exited with code 0).
2. **Biên dịch Backend (TypeScript compiler)**: **THÀNH CÔNG** (Exited with code 0).
3. **E2E Test Suite** (`npx ts-node test_e2e_full.ts`): **23/23 PASS** (Không lỗi).

---

## 5. Hướng Dẫn Deploy Lên VPS (`kpi.nghialam.com`)

> [!CAUTION]
> **CẢNH BÁO BẮT BUỘC**: Luôn chạy sao lưu (backup) cơ sở dữ liệu SQLite thật trước khi tiến hành cập nhật mã nguồn hoặc chạy migration!

### Bước 1: Sao lưu Cơ sở dữ liệu hiện tại
Kết nối SSH vào VPS và chạy tập tin kịch bản backup:
```bash
/var/www/kpi-app/backup_db.sh
```
*(Hoặc chạy thủ công lệnh sao lưu an toàn: `sqlite3 /var/www/kpi-data/cbcc.sqlite ".backup /var/backups/kpi/cbcc_manual_$(date +%Y%m%d_%H%M%S).sqlite"`)*

### Bước 2: Cập nhật mã nguồn trên VPS
Chuyển đến thư mục ứng dụng và thực hiện kéo mã nguồn mới nhất:
```bash
cd /var/www/kpi-app
git pull --ff-only origin main
```

### Bước 3: Chạy nâng cấp Schema cơ sở dữ liệu (Migration)
```bash
npm run db:migrate
```

### Bước 4: Biên dịch và Khởi động lại dịch vụ PM2
```bash
npm run build
pm2 reload cbcc-server
```

### Bước 5: Kiểm tra cấu hình và Tải lại cấu hình Nginx
```bash
/www/server/nginx/sbin/nginx -t -c /www/server/nginx/conf/nginx.conf
/www/server/nginx/sbin/nginx -s reload
```
