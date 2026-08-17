# HƯỚNG DẪN TRIỂN KHAI & GHI NHẬN HỆ THỐNG KPI XÃ NGHĨA LÂM

Tài liệu này ghi nhận chi tiết quá trình hoàn thiện hệ thống `kpi.nghialam.com` nâng cấp các mô-đun quản lý hành chính phục vụ công tác điều hành của Chủ tịch UBND xã Nghĩa Lâm.

---

## 1. Hiện Trạng Repository & Nhánh Làm Việc

- **Nhánh hiện tại (Branch)**: `main` (đã đồng bộ với `feature/ubnd-executive-modules`)
- **Commit hash cuối cùng**: `0a78520`
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

---

## 6. Nhật ký Nâng cấp Phân hệ KPI (Nghị định 335 & Quyết định 283)

Để đáp ứng các văn bản pháp lý mới và hoàn thiện hệ thống, chúng tôi đã thực hiện nâng cấp toàn diện lõi tính điểm KPI cùng các tính năng đi kèm:

### 📂 Cơ sở dữ liệu & Migration
- **Tạo mới**: `server/database/migrations/20260814100000_update_kpi_rules.ts` (Thiết lập 2 bảng mới `evaluation_periods` và `evaluation_appeals` để quản lý việc khóa kỳ đánh giá định kỳ và giải quyết kiến nghị, bổ sung cột `requested_score` cho bảng khiếu nại).

### 📂 Backend (Calculations & Quota Rules)
- **Chỉnh sửa**: 
  - [`server/src/controllers/evaluationController.ts`](file:///d:/Dropbox/Văn%20bản/UBND%20xa%20Nghia%20Lam/CBCC/cbcc-app/server/src/controllers/evaluationController.ts):
    - Tự động hóa trừ điểm tiến độ (-25% mỗi lỗi trễ hạn `delay_count`) và chất lượng (-25% mỗi lỗi làm lại `rework_count`) từ các Task liên kết.
    - Sửa lỗi thẩm định của Trưởng phòng và Lãnh đạo xã: khi điều chỉnh điểm chi tiết của từng sản phẩm, hệ thống tự động tính toán lại điểm tổng nhiệm vụ (`task_score_mgr`, `task_score_final`) và điểm tổng kết cuối cùng (`final_score`) theo tỷ lệ thực tế.
    - Tích hợp công thức tính điểm 6 chiều cho vị trí Lãnh đạo/Quản lý: $TaskScore = \frac{qtyRate + progRate + qualRate + d + đ + e}{6}$.
    - Thêm cơ chế **Khóa kỳ đánh giá**: Chặn lưu nháp, nộp tự đánh giá, thẩm định hoặc phê duyệt nếu kỳ đánh giá tháng đó đã được đánh dấu là `LOCKED`.
    - Thêm cơ chế **Kiểm soát hạn mức xuất sắc 20%**: Hệ thống tự động chặn phê duyệt xếp loại "Hoàn thành xuất sắc nhiệm vụ" (score >= 90) nếu vượt quá tỷ lệ 20% tổng số cán bộ "Hoàn thành tốt nhiệm vụ" trở lên, ngoại trừ trường hợp được đánh dấu là ngoại lệ đặc biệt kèm lý do cụ thể.
  - [`server/src/routes/evaluationRoutes.ts`](file:///d:/Dropbox/Văn%20bản/UBND%20xa%20Nghia%20Lam/CBCC/cbcc-app/server/src/routes/evaluationRoutes.ts): Khai báo các route khóa kỳ và kiến nghị.

### 📂 Frontend (Vite & React components)
- **Chỉnh sửa**:
  - [`client/src/services/api.ts`](file:///d:/Dropbox/Văn%20bản/UBND%20xa%20Nghia%20Lam/CBCC/cbcc-app/client/src/services/api.ts): Bổ sung các Axios API quản lý kỳ đánh giá (`getPeriods`, `lockPeriod`, `unlockPeriod`).
  - [`client/src/components/EvaluationFormModal.tsx`](file:///d:/Dropbox/Văn%20bản/UBND%20xa%20Nghia%20Lam/CBCC/cbcc-app/client/src/components/EvaluationFormModal.tsx):
    - Điều chỉnh thang điểm tiêu chí chung về tối đa 10đ/tiêu chí theo đúng Phụ lục I Quyết định 283/QĐ-UBND (Chính trị: 10đ, Chuyên môn: 10đ, Đổi mới sáng tạo: 10đ).
    - Tích hợp đồng bộ hiển thị và tính toán điểm trừ lỗi trễ hạn / chất lượng từ Task liên kết, tự động cập nhật điểm 6 chiều cho Lãnh đạo.
  - [`client/src/pages/Evaluations.tsx`](file:///d:/Dropbox/Văn%20bản/UBND%20xa%20Nghia%20Lam/CBCC/cbcc-app/client/src/pages/Evaluations.tsx):
    - Tích hợp giao diện khóa/mở khóa kỳ đánh giá tháng trực tuyến dành cho Admin/Lãnh đạo xã.
    - Chặn sửa đổi phiếu nếu kỳ đã bị khóa.

### 📊 Kết quả kiểm thử
- **E2E Comprehensive Test Suite**: **23/23 PASS** (Không có lỗi). Toàn bộ luồng tự chấm, thẩm định, phê duyệt, gửi email thông báo, giám sát hạn mức xuất sắc, ghi nhật ký hoạt động đều hoạt động 100% chính xác.

---

## 7. Đề xuất Kế hoạch Nâng cấp Hệ thống KPI trong tương lai

Dựa trên việc nghiên cứu chuyên sâu 03 tài liệu đặc tả nghiệp vụ và pháp lý (`KPI_LEGAL_BASIS.md`, `KPI_MODULE_DEEP_SPEC.md`, `ANTIGRAVITY_THUC_THI_CAP_NHAT_KPI_NGHIALAM.md`), dưới đây là danh sách các nội dung đề xuất nâng cấp trong tương lai (khi được kích hoạt và cho phép sửa code):

### 7.1. Tích hợp Quản lý Vị trí Việc làm (VTVL) & Khung năng lực
- **Thiết lập mô hình dữ liệu VTVL**:
  - Tạo các bảng `positions`, `position_duties` (sản phẩm đầu ra và tiêu chí hoàn thành tương ứng phụ lục 1A, 1B, 1C), `position_competencies` (năng lực và cấp độ từ 1-5 theo phụ lục 2A, 2B), `user_position_assignments`.
- **Ràng buộc nghiệp vụ**:
  - Tự động kiểm tra và đưa ra cảnh báo nếu giao việc sai VTVL của cán bộ, thiếu người phụ trách chính hoặc thiếu minh chứng.
  - Hỗ trợ kết xuất bảng đối chiếu: **Người - VTVL - Nhiệm vụ - Sản phẩm - Hệ số - Minh chứng - Điểm - Căn cứ**.

### 7.2. Cấu hình Phiên bản Công thức Tính điểm động (`kpi_formula_versions`)
- Tách biệt logic công thức tính điểm (như tỷ lệ trừ 25% trễ hạn, ngưỡng điểm xếp loại) ra khỏi mã nguồn cứng và lưu trữ trong bảng `kpi_formula_versions` để quản trị viên có thể điều chỉnh linh hoạt theo sự thay đổi của văn bản trung ương/địa phương.

### 7.3. Nâng cấp Nghiệp vụ Giao việc phức tạp
- **Nhiệm vụ chuyển giao**: Ghi nhận lịch sử chuyển giao việc giữa các cán bộ (lý do chuyển giao, khối lượng đã làm của người cũ, khối lượng bàn giao cho người mới).
- **Nhiệm vụ nhóm**: Hỗ trợ phân rã và xác định rõ tỷ trọng tham gia (%) của các thành viên trong nhóm thực hiện (tổng tỷ trọng = 100%).
- **Nhiệm vụ kéo dài**: Phân bổ chỉ tiêu/tiến độ thực hiện theo từng tuần hoặc tháng.

### 7.4. Hệ thống nhắc việc tự động (Zalo/Telegram Webhook)
- Xây dựng phân hệ cấu hình webhook gửi tin nhắn nhắc nhở trực tiếp đến tài khoản công chức khi có việc sắp quá hạn hoặc phiếu đánh giá chưa nộp.



## 8. Nhật ký Xử lý UAT, Khóa Chéo Kỳ Đánh Giá & Kiểm Thử Tải (Giai đoạn UAT)

- **Nhánh làm việc chính (Branch)**: `feature/ubnd-executive-modules` (Đã được merge hoàn toàn và đồng bộ sang nhánh `main`).
- **Commit Hash cuối cùng trên cả 2 nhánh (main & feature)**: `4f5ae65e17de1eddc16195363ae8a760531f3baa`
- **Tình trạng push GitHub**: Đã push và đồng bộ thành công cả 2 nhánh local lên `origin/main` và `origin/feature/ubnd-executive-modules`.

### 📂 Nội dung đã hoàn thành & Tệp sửa đổi trong Giai đoạn UAT:
1. **Sửa lỗi hệ số quy đổi K & Số lượng giao việc**:
   - [`server/src/controllers/catalogController.ts`](file:///d:/Dropbox/Văn%20bản/UBND%20xa%20Nghia%20Lam/CBCC/cbcc-app/server/src/controllers/catalogController.ts) & [`client/src/components/CatalogModal.tsx`](file:///d:/Dropbox/Văn%20bản/UBND%20xa%20Nghia%20Lam/CBCC/cbcc-app/client/src/components/CatalogModal.tsx): Validate $K > 0$ và điểm gốc chuẩn $> 0$ ở cả frontend/backend.
   - [`server/src/controllers/taskController.ts`](file:///d:/Dropbox/Văn%20bản/UBND%20xa%20Nghia%20Lam/CBCC/cbcc-app/server/src/controllers/taskController.ts) & [`client/src/components/TaskModal.tsx`](file:///d:/Dropbox/Văn%20bản/UBND%20xa%20Nghia%20Lam/CBCC/cbcc-app/client/src/components/TaskModal.tsx): Validate số lượng giao $> 0$.
2. **Khóa chéo kỳ đánh giá toàn bộ phân hệ nghiệp vụ**:
   - Tích hợp kiểm tra kỳ đánh giá tháng tại các hàm CRUD của [`budgetController.ts`](file:///d:/Dropbox/Văn%20bản/UBND%20xa%20Nghia%20Lam/CBCC/cbcc-app/server/src/controllers/budgetController.ts), [`publicInvestmentController.ts`](file:///d:/Dropbox/Văn%20bản/UBND%20xa%20Nghia%20Lam/CBCC/cbcc-app/server/src/controllers/publicInvestmentController.ts), [`landCertificateController.ts`](file:///d:/Dropbox/Văn%20bản/UBND%20xa%20Nghia%20Lam/CBCC/cbcc-app/server/src/controllers/landCertificateController.ts), và [`officeController.ts`](file:///d:/Dropbox/Văn%20bản/UBND%20xa%20Nghia%20Lam/CBCC/cbcc-app/server/src/controllers/officeController.ts).
3. **Bảo toàn điểm tự chấm & Ô nhập điểm trực tiếp khi đánh giá**:
   - [`server/src/controllers/evaluationController.ts`](file:///d:/Dropbox/Văn%20bản/UBND%20xa%20Nghia%20Lam/CBCC/cbcc-app/server/src/controllers/evaluationController.ts) & [`client/src/components/EvaluationFormModal.tsx`](file:///d:/Dropbox/Văn%20bản/UBND%20xa%20Nghia%20Lam/CBCC/cbcc-app/client/src/components/EvaluationFormModal.tsx): Bảo toàn điểm tự chấm/thẩm định khi không sửa đổi. Ẩn điểm mặc định `0đ` thành `-` khi chưa đánh giá, chuyển đổi cột điểm sang các ô nhập số trực tiếp cho cấp duyệt tương ứng (`isManager` hoặc `isLeadership`).
4. **Enforce Đơn vị & VTVL khi phê duyệt tài khoản**:
   - [`server/src/controllers/userController.ts`](file:///d:/Dropbox/Văn%20bản/UBND%20xa%20Nghia%20Lam/CBCC/cbcc-app/server/src/controllers/userController.ts) & [`client/src/components/ApproveMemberModal.tsx`](file:///d:/Dropbox/Văn%20bản/UBND%20xa%20Nghia%20Lam/CBCC/cbcc-app/client/src/components/ApproveMemberModal.tsx): Bắt buộc gán Đơn vị và VTVL khi duyệt đăng ký thành viên.
5. **Liên kết chéo nhiệm vụ với các mô-đun**:
   - Tạo migration `20260814200000_uat_enhancements.ts` thêm 5 cột liên kết chéo. Tích hợp form chọn và lưu liên kết chéo tại [`TaskModal.tsx`](file:///d:/Dropbox/Văn%20bản/UBND%20xa%20Nghia%20Lam/CBCC/cbcc-app/client/src/components/TaskModal.tsx).
6. **Kiểm thử tải (Load Test)**:
   - Viết [`seed_load_test.ts`](file:///d:/Dropbox/Văn%20bản/UBND%20xa%20Nghia%20Lam/CBCC/cbcc-app/server/scripts/seed_load_test.ts) và [`run_load_test.ts`](file:///d:/Dropbox/Văn%20bản/UBND%20xa%20Nghia%20Lam/CBCC/cbcc-app/server/scripts/run_load_test.ts) tạo 8 phòng ban, 58 cán bộ, 802 danh mục và 1050 nhiệm vụ. Kết quả truy vấn luôn có tốc độ xử lý nhanh xuất sắc (dưới 45ms).
7. **Đóng gói dự án (Vite & TSC build)**:
   - Build thành công toàn bộ ứng dụng (Exit code 0).
   - E2E Test Suite chạy thành công toàn bộ 23/23 bài test (Exit code 0).

---

## 9. Hoàn Thiện Module Đánh Giá CBCC KPI & Kiểm Soát Phân Quyền RBAC Toàn Diện (Giai Đoạn Final)

- **Nhánh làm việc (Branch)**: `feat/complete-cbcc-kpi-module`
- **Căn cứ pháp lý cốt lõi**:
  - Nghị định số 335/2025/NĐ-CP ngày 31/12/2025 của Chính phủ;
  - Sổ tay hướng dẫn đánh giá, xếp loại cán bộ, công chức của Bộ Nội vụ;
  - Kế hoạch số 51-KH/TU ngày 07/5/2026 của Ban Thường vụ Tỉnh ủy Nghệ An;
  - Quy định số 295-QĐ/ĐU ngày 09/4/2026 của Ban Thường vụ Đảng ủy xã Nghĩa Lâm;
  - Văn bản ma trận chi tiết: [`KPI_LEGAL_TRACEABILITY_MATRIX.md`](./KPI_LEGAL_TRACEABILITY_MATRIX.md).

### 9.1. Xử lý triệt để Lỗi P0 Tính điểm Phần II (Calculation Engine)
- **Vấn đề trước đây**: Công thức cũ tính theo tỷ lệ hoàn thành 3 chiều dẫn đến việc phiếu chỉ có 1 sản phẩm 5 điểm vẫn bị tự động gán điểm trần 70/70.
- **Giải pháp chuẩn hóa**:
  - Xây dựng service độc lập [`server/src/services/kpiCalculationEngine.ts`](./server/src/services/kpiCalculationEngine.ts) áp dụng chiến lược duy nhất `WEIGHTED_DETAIL_SCORE` (Version `2026.08.1`).
  - **Công thức tính điểm**:
    $$\text{line\_score}_i = \text{quantity}_i \times \text{baseline\_score}_i \times \text{coefficient}_i$$
    $$\text{taskScore} = \min\left(70.0, \sum(\text{line\_score}_i) \times \text{penaltyMultiplier}\right)$$
    $$\text{totalScore} = \min\left(100.0, \text{commonCriteriaScore} + \text{taskScore}\right)$$
  - Backend là nguồn sự thật duy nhất về điểm số. Mọi endpoint (`POST /draft`, `POST /review`, `POST /approve`, `GET /forms/:id`, `POST /forms/:id/recalculate`) đều sử dụng engine tính điểm thống nhất và cung cấp cấu trúc `auditFormula`.

### 9.2. Xử lý triệt để Lỗi P0 Broken Access Control (RBAC Controls)
1. **Phân quyền Giao nhiệm vụ (`POST /api/tasks`)**:
   - Chặn tuyệt đối tài khoản Công chức thường (`EMPLOYEE`) tự ý giao việc qua API (trả về `403 Forbidden`).
   - Giới hạn phạm vi giao việc của Trưởng bộ phận (`DEPARTMENT_HEAD`) chỉ trong đơn vị/phòng ban phụ trách.
   - Chỉ `ADMIN`, `LEADERSHIP` và `DEPARTMENT_HEAD` (trong phòng) mới có quyền tạo và phân công nhiệm vụ.
2. **Kiểm soát Truy cập Phân hệ Chuyên sâu**:
   - **Đầu tư công (`/api/public-investment`, `/api/investment`)**: Chỉ `ADMIN`, `LEADERSHIP`, và Cán bộ/Trưởng bộ phận Địa chính - Xây dựng (Dept 3) mới có quyền truy cập và chỉnh sửa. Các công chức khác gọi API đều nhận `403 Forbidden`.
   - **Tài chính - Ngân sách (`/api/budget`, `/api/budgets`)**: Chỉ `ADMIN`, `LEADERSHIP`, và Cán bộ/Trưởng bộ phận Tài chính - Kế toán (Dept 6) mới có quyền đọc và quản lý thu/chi.
   - **Đất đai & KH965 (`/api/land-certificates`)**: Chỉ `ADMIN`, `LEADERSHIP`, và Cán bộ/Trưởng bộ phận Địa chính (Dept 3) mới có quyền đọc và xử lý hồ sơ.
   - **Giao diện & Route Guard**: Đã tích hợp `allowedDepartments` vào [`ProtectedRoute.tsx`](./client/src/components/ProtectedRoute.tsx) và [`App.tsx`](./client/src/App.tsx) để chặn truy cập từ phía client.

### 9.3. Kết quả Kiểm thử Toàn diện
- **P0 KPI Formula Test Suite (`test_p0_kpi_formula.ts`)**: **10/10 PASS** (Bảo toàn điểm, thay đổi số lượng, thêm/xóa dòng, giới hạn trần 70, khóa kỳ, chặn dữ liệu sai).
- **RBAC Task Assignment Test Suite (`test_rbac_task_assignment.ts`)**: **5/5 PASS** (Chặn công chức giao việc, giới hạn phạm vi phòng ban).
- **Full RBAC Security Matrix Test Suite (`test_rbac_full_matrix.ts`)**: **11/11 PASS** (Kiểm tra đầy đủ Role $\times$ Module $\times$ Read/Write).
- **Full E2E Comprehensive Test Suite (`test_e2e_full.ts`)**: **23/23 PASS**.
- **Build Verification**:
  - `npm run build:server` -> **SUCCESS** (Exit code 0).
  - `npm run build:client` -> **SUCCESS** (Exit code 0).
  - `npm run build` -> **SUCCESS** (Exit code 0).

---

## 10. Xây Dựng Module Quản Lý Toàn Bộ Vòng Đời Dự Án (`/projects`) Liên Kết Có Kiểm Soát Với Giải Ngân Đầu Tư Công (`/public-investment`)

- **Nhánh làm việc (Branch)**: `feat/project-management-module`
- **Mục tiêu**: Xây dựng phân hệ quản lý toàn bộ vòng đời dự án đầu tư công từ:
  $$\text{Chủ trương} \rightarrow \text{Phê duyệt} \rightarrow \text{Đấu thầu/Hợp đồng} \rightarrow \text{Thi công} \rightarrow \text{Nghiệm thu} \rightarrow \text{Quyết toán} \rightarrow \text{Bàn giao đưa vào sử dụng}$$
  liên kết chặt chẽ và không trùng lặp số liệu với module giải ngân vốn đầu tư công (`/public-investment`).

### 10.1. Cấu trúc Cơ sở Dữ liệu & Migration
- **Migration**: [`server/database/migrations/20260817000000_create_projects_and_milestones_tables.ts`](./server/database/migrations/20260817000000_create_projects_and_milestones_tables.ts)
- **Bảng `projects`**:
  - `id`: Khóa chính;
  - `investment_project_id`: FK liên kết duy nhất (`UNIQUE`, `NULLABLE`) tới `public_investment_projects.id`;
  - `project_code`: Unique (Mã công trình/dự án);
  - `project_name`: Tên công trình;
  - `investment_group`: Nhóm A / B / C theo Luật Đầu tư công;
  - `approval_decision_no`, `approval_date`, `approving_authority`, `design_approval_no`;
  - `bidding_method`, `contractor_selection_date`, `contract_no`, `contract_value`;
  - `start_date`, `planned_end_date`, `actual_end_date`;
  - `acceptance_status`, `acceptance_date`;
  - `settlement_status`, `settlement_value`, `settlement_date`, `handover_date`;
  - `project_manager_id`: FK tới `users`;
  - `supervisor_unit`: Đơn vị tư vấn/Ban giám sát cộng đồng;
  - `version`: Optimistic locking;
  - `created_by`, `updated_by`, `created_at`, `updated_at`.
- **Bảng `project_milestones`**:
  - `id`, `project_id` (FK cascade), `milestone_name`, `milestone_type`, `planned_date`, `actual_date`, `status`, `note`.

### 10.2. Nguyên Tắc Nguồn Dữ Liệu & Đồng Bộ Hai Chiều Không Trùng Lặp
1. **Nguồn dữ liệu tài chính chính**:
   - Vốn kế hoạch, Vốn phân bổ, Đã giải ngân, Tỷ lệ giải ngân, Tiến độ hiện trường (%) và Vướng mắc được lưu trữ duy nhất tại `public_investment_projects`.
   - Phân hệ `/projects` chỉ truy vấn (Left Join) trực tiếp từ nguồn ĐTC để hiển thị, tuyệt đối không tạo bản sao hoặc nhập lại số liệu tài chính.
2. **Giao dịch an toàn (Transactions)**:
   - Khi tạo mới dự án đồng thời với công trình ĐTC, hệ thống bọc trong Knex Transaction: nếu một bên lỗi sẽ rollback toàn bộ.
   - Ràng buộc $1:1$ được bảo đảm chặt chẽ (1 công trình ĐTC chỉ liên kết tối đa 1 dự án).
3. **Bảo vệ toàn vẹn dữ liệu**:
   - Cấm xóa dự án nếu công trình đã phát sinh giải ngân ($>0$ VNĐ) hoặc đã nghiệm thu/quyết toán hoàn thành $\rightarrow$ Trả HTTP `409 Conflict`.
   - Cấm đổi mã dự án khi đã có số liệu giải ngân/nghiệm thu.

### 10.3. Phân Quyền RBAC & Route Guard
- **API Endpoints**:
  - `GET /api/projects`: Trả danh sách có lọc và phân trang (Lãnh đạo & Dept 3 xem toàn bộ; cán bộ khác chỉ xem dự án được gán làm PM).
  - `GET /api/projects/:id`: Trả chi tiết, milestones và dữ liệu ĐTC liên kết (Chặn 403 đối với cán bộ không liên quan).
  - `POST /api/projects`: Chỉ Lãnh đạo, Trưởng bộ phận Địa chính (Dept 3), và Cán bộ Địa chính.
  - `PUT /api/projects/:id`: Kiểm soát chi tiết theo cấp thẩm quyền (Sửa QĐ phê duyệt/Hợp đồng và Nghiệm thu/Quyết toán yêu cầu thẩm quyền Lãnh đạo/Trưởng phòng).
  - `DELETE /api/projects/:id`: Chỉ Lãnh đạo và Admin (có ràng buộc 409).
  - `POST /api/projects/:id/link-investment` & `unlink-investment`: Kiểm soát liên kết.
  - `GET /api/projects/dashboard`: Thống kê theo nhóm A/B/C, giai đoạn vòng đời, tài chính tổng hợp từ ĐTC.
  - `GET /api/projects/export`: Xuất báo cáo Excel định dạng hành chính xã Nghĩa Lâm.
- **Frontend Route Guard**:
  - `/projects`: Bảo vệ bởi `ProtectedRoute allowedDepartments={[3]}`.
  - Menu `Quản lý dự án` hiển thị linh hoạt theo vai trò trên [`Navbar.tsx`](./client/src/components/Navbar.tsx).

### 10.4. Kết Quả Kiểm Thử Toàn Diện
1. **Data Linking & 2-Way Integrity Suite (`test_project_linking.ts`)**: **5/5 PASS**
   - Chặn liên kết trùng;
   - Tạo đồng thời qua Transaction;
   - Đọc tự động số liệu giải ngân mới nhất từ nguồn;
   - Bảo toàn số liệu ĐTC khi sửa vòng đời;
   - Chặn xóa dự án có giải ngân với HTTP 409.
2. **Project RBAC Matrix Suite (`test_project_rbac.ts`)**: **7/7 PASS**
   - Chặn cán bộ ngoài Dept 3 xem và tạo dự án;
   - Cho phép PM xem dự án được gán;
   - Chặn PM sửa trường nhạy cảm;
   - Cho phép Trưởng phòng và Lãnh đạo thao tác theo thẩm quyền.
3. **Project Lifecycle, Milestones & Validation Suite (`test_project_lifecycle.ts`)**: **5/5 PASS**
   - Chặn ngày kết thúc trước ngày khởi công;
   - Chặn giá trị hợp đồng/quyết toán âm;
   - Thêm, sửa, xóa mốc tiến độ;
   - Dashboard tổng hợp chính xác.
4. **All Existing Regression Suites**:
   - `test_rbac_full_matrix.ts` $\rightarrow$ **11/11 PASS**.
   - `test_p0_kpi_formula.ts` $\rightarrow$ **10/10 PASS**.
   - `test_e2e_full.ts` $\rightarrow$ **23/23 PASS**.
5. **Build Verification**:
   - `npm run build:server` $\rightarrow$ **SUCCESS** (Exit code 0).
   - `npm run build:client` $\rightarrow$ **SUCCESS** (Exit code 0).
   - `npm run build` $\rightarrow$ **SUCCESS** (Exit code 0).

### 10.5. Các Nội Dung Đánh Dấu `LEGAL_REVIEW_REQUIRED`
- Tiêu chí phân loại dự án nhóm A/B/C theo hạn mức tổng mức đầu tư quy định tại Điều 8, 9, 10 Luật Đầu tư công cần được Hội đồng nhân dân / UBND tỉnh Nghệ An và huyện Nghĩa Đàn rà soát định kỳ theo các văn bản phân cấp quản lý đầu tư công mới nhất.

---

## 11. Triển Khai Toàn Diện Mô-đun Quản Lý Dự Án Đầu Tư Công Cấp Xã Theo Đặc Tả 16 Bước (`PROJECT_MANAGEMENT_MODULE_FINAL_SPEC.md`)

- **Nhánh làm việc**: `feat/complete-project-lifecycle-management`
- **Mục tiêu**: Thực thi 100% đặc tả quản lý vòng đời dự án đầu tư công cấp xã tại `/projects`, liên kết không trùng lặp với `/public-investment` theo đúng quy định Luật Đầu tư công, Luật Xây dựng, Nghị định 335 và quy trình hành chính thực tế tại xã Nghĩa Lâm.

### 11.1. Chi Tiết Triển Khai 5 Giai Đoạn

#### Giai đoạn 1: Dữ liệu và trạng thái P0
- **Mở rộng schema bảng `projects`**: Bổ sung phân loại nhóm A/B/C, quy mô, địa điểm, mục tiêu, chủ đầu tư, đơn vị quản lý, đơn vị thụ hưởng, thời hạn bảo hành, 11 trạng thái vòng đời chuẩn hóa (`PREPARATION` $\rightarrow$ `CLOSED`, `ARCHIVED`, `CANCELLED_DRAFT`), cờ rà soát dữ liệu `data_review_flag`.
- **Tự sinh mã dự án chuẩn hóa**: Hàm `generateProjectCode(year)` tự động sinh mã theo quy tắc `DA-YYYY-NN` (ví dụ `DA-2026-01`, `DA-2026-02`).
- **Chính sách bảo vệ dữ liệu P0**:
  - Không cho phép xóa dự án đã phát sinh giải ngân thực tế hoặc đã có hồ sơ tài liệu đính kèm $\rightarrow$ Trả về mã lỗi `HTTP 409 Conflict` kèm thông báo tiếng Việt rõ ràng.
  - Hỗ trợ chuyển sang trạng thái "Lưu trữ" (`ARCHIVED`) hoặc "Hủy bản nháp" (`CANCELLED_DRAFT`).

#### Giai đoạn 2: Hồ sơ điện tử, workflow 16 bước, RBAC và Audit
- **Quy trình 16 bước chuẩn cấp xã**:
  1. *Bước 1*: Đưa vào Kế hoạch ĐTC (Nghị quyết HĐND xã - TM. HĐND - CHỦ TỊCH).
  2. *Bước 2*: Lập & thẩm định Báo cáo đề xuất chủ trương đầu tư (QĐ thành lập Hội đồng thẩm định trước Báo cáo thẩm định).
  3. *Bước 3*: Quyết định chủ trương đầu tư (Tập thể UBND xã - TM. UBND - CHỦ TỊCH).
  4. *Bước 4*: Lựa chọn đơn vị tư vấn khảo sát, lập BCKTKT (Hợp đồng tư vấn hợp lệ).
  5. *Bước 5*: Phê duyệt nhiệm vụ khảo sát xây dựng (Chủ đầu tư / Chủ tịch UBND xã).
  6. *Bước 6*: Phê duyệt phương án kỹ thuật khảo sát (Chủ đầu tư).
  7. *Bước 7*: Thực hiện khảo sát & lập BCKTKT (Nghiệm thu kết quả khảo sát).
  8. *Bước 8*: Thẩm định BCKTKT, thiết kế & dự toán (Dự toán không vượt tổng mức Bước 3).
  9. *Bước 9*: Phê duyệt dự án / BCKTKT (Quyết định đầu tư của Chủ tịch UBND xã - Điều kiện mở mã dự án & giải ngân).
  10. *Bước 10*: Phê duyệt kế hoạch lựa chọn nhà thầu (QĐ phê duyệt KHLCNT).
  11. *Bước 11*: Lựa chọn nhà thầu, phê duyệt kết quả & ký hợp đồng (Không cho thi công khi chưa ký hợp đồng).
  12. *Bước 12*: Bố trí kế hoạch vốn hằng năm và giải ngân (Kiểm soát chi Kho bạc).
  13. *Bước 13*: Thi công & quản lý chất lượng (Nhật ký hiện trường, Ban Giám sát đầu tư cộng đồng).
  14. *Bước 14*: Nghiệm thu hoàn thành và bàn giao (Bắt buộc hồ sơ hoàn công & biên bản nghiệm thu).
  15. *Bước 15*: Lập, thẩm tra và phê duyệt quyết toán (Chủ tịch UBND xã phê duyệt).
  16. *Bước 16*: Bàn giao quản lý, khai thác, bảo hành, tất toán tài khoản & đóng dự án.
- **Cổng điều kiện chuyển bước (Gate Rules)**:
  - Khóa Bước 1 nếu thiếu Nghị quyết HĐND xã.
  - Khóa Bước 9 nếu thiếu số Quyết định phê duyệt BCKTKT.
  - Khóa Bước 11/13 nếu thiếu hợp đồng xây lắp hợp lệ.
  - Khóa Bước 14 nếu thiếu biên bản nghiệm thu hoàn thành.
  - Tự động kích hoạt bước tiếp theo (`IN_PROGRESS`) và đồng bộ `lifecycle_status` khi bước trước hoàn thành.
- **Checklist điện tử trước khi Chủ tịch ký**: 8 tiêu chí kiểm tra pháp lý, thẩm quyền tập thể, số liệu tài chính không vượt trần, hồ sơ kèm theo.
- **Kho hồ sơ điện tử (`project_documents`)**: Quản lý 18 loại văn bản đính kèm, phân loại theo bước hoặc dự án, quản lý phiên bản `version` và trạng thái xác thực.
- **Nhật ký kiểm soát (`audit_logs`)**: Ghi nhận toàn bộ thao tác thêm mới, sửa đổi, phê duyệt bước, đính kèm/xóa tài liệu.

#### Giai đoạn 3 & 4: Vốn, Giải ngân, Đấu thầu, Nghiệm thu & Quyết toán
- **Liên kết tài chính không trùng lặp**: Đọc trực tiếp kế hoạch vốn, vốn phân bổ, đã giải ngân, % tỷ lệ giải ngân từ bảng nguồn `public_investment_projects` qua phép JOIN.
- **Đấu thầu & Hợp đồng**: Quản lý hình thức lựa chọn nhà thầu, nhà thầu chính, số hợp đồng, giá trị hợp đồng, thời gian thi công, bảo lãnh hợp đồng.
- **Nghiệm thu & Quyết toán**: Quản lý biên bản nghiệm thu từng phần / hoàn thành, hồ sơ quyết toán A-B, giá trị thẩm tra, giá trị phê duyệt, thời hạn bảo hành 12 tháng.

#### Giai đoạn 5: Dashboard điều hành, Cảnh báo Chênh lệch & Báo cáo
- **Cảnh báo Chênh lệch Tiến độ & Giải ngân (`progress_gaps`)**:
  - Tự động phát hiện khi $Tỷ\ lệ\ giải\ ngân - Tiến\ độ\ thi\ công > 15\%$ (cảnh báo vàng) hoặc $> 30\%$ (cảnh báo đỏ nguy cơ giải ngân vượt khối lượng nghiệm thu).
  - Cảnh báo khi công trình đạt 100% tiến độ thi công nhưng chưa lập biên bản nghiệm thu hoàn thành.
- **Xuất báo cáo Excel hành chính**: Xuất dữ liệu dự án ra tệp `.xlsx` theo mẫu chuẩn UBND xã Nghĩa Lâm.

### 11.2. Kết Quả Kiểm Thử Master Spec

| Suite kiểm thử | File test | Số test cases | Kết quả |
| :--- | :--- | :---: | :---: |
| **Master Spec 5 Phases** | `test_project_master_spec.ts` | 5/5 | **PASS 100%** |
| **Project Linking & Data Integrity** | `test_project_linking.ts` | 5/5 | **PASS 100%** |
| **Project RBAC Matrix** | `test_project_rbac.ts` | 7/7 | **PASS 100%** |
| **Project Lifecycle & Validation** | `test_project_lifecycle.ts` | 5/5 | **PASS 100%** |
| **Full RBAC Security Matrix** | `test_rbac_full_matrix.ts` | 11/11 | **PASS 100%** |
| **P0 KPI Calculation Engine** | `test_p0_kpi_formula.ts` | 10/10 | **PASS 100%** |
| **End-to-End System Suite** | `test_e2e_full.ts` | 23/23 | **PASS 100%** |

### 11.3. Kết Quả Đóng Gói (Build Verification)
- `npm run build:server` $\rightarrow$ **SUCCESS** (Exit code 0, 0 error).
- `npm run build:client` $\rightarrow$ **SUCCESS** (Exit code 0, 0 error, Vite bundle generated).
- `npm run build` $\rightarrow$ **SUCCESS** (Exit code 0).

