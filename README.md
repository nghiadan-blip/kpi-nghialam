# Hệ Thống Quản Lý & Đánh Giá Cán Bộ Công Chức — UBND Xã Nghĩa Lâm

Ứng dụng web nội bộ hỗ trợ quản lý cán bộ, phân công nhiệm vụ, theo dõi tiến độ và thực hiện quy trình đánh giá, chấm điểm và xếp loại hàng tháng theo **Nghị định số 335/2025/NĐ-CP**.

---

## 🌟 Tính Năng Nổi Bật

1. **Xác thực & Phân quyền Đa cấp (RBAC Matrix)**:
   - `ADMIN`: Quản trị toàn hệ thống, quản lý tài khoản cán bộ, phòng ban, danh mục sản phẩm & hệ số NĐ 335.
   - `LEADERSHIP`: Lãnh đạo UBND xã (Chủ tịch / Phó Chủ tịch) — theo dõi toàn bộ cơ quan, phê duyệt điểm số cuối cùng & xếp loại tháng.
   - `DEPARTMENT_HEAD`: Trưởng phòng / Trưởng bộ phận — giao nhiệm vụ, giám sát tiến độ và thẩm định chấm điểm nhân sự trong phòng.
   - `EMPLOYEE`: Chuyên viên / Công chức — tiếp nhận nhiệm vụ, cập nhật tiến độ, nộp minh chứng và tự chấm điểm hàng tháng.

2. **Quản lý & Giao nhiệm vụ (Task Management)**:
   - Giao việc kèm hạn hoàn thành (deadline), trọng số và liên kết danh mục sản phẩm NĐ 335.
   - Theo dõi trạng thái trực quan (*Chờ tiếp nhận*, *Đang thực hiện*, *Đã hoàn thành*, *Quá hạn*).
   - Đính kèm minh chứng / số hiệu văn bản hoàn thành.

3. **Quy trình Đánh giá 3 Cấp theo Nghị định 335/2025/NĐ-CP**:
   - **Bước 1**: Cá nhân tự chấm điểm ($\text{Điểm} = \text{Số lượng} \times (5.0 \times \text{Hệ số})$) và nộp phiếu.
   - **Bước 2**: Trưởng phòng thẩm định điểm, nhận xét và chuyển lên Lãnh đạo xã.
   - **Bước 3**: Lãnh đạo UBND xã phê duyệt chính thức và tự động xếp loại:
     - **Xuất sắc (Loại A)**: $\ge 90$ điểm.
     - **Tốt (Loại B)**: $70 - 89$ điểm.
     - **Hoàn thành (Loại C)**: $50 - 69$ điểm.
     - **Không đạt (Loại D)**: $< 50$ điểm.

4. **Bảng điều khiển Thời gian thực & Xuất Báo Cáo Excel**:
   - Dashboard KPI toàn diện: tổng nhân sự, tiến độ công việc theo phòng ban, danh sách việc gấp, top cán bộ xuất sắc.
   - Xuất bảng tổng hợp kết quả đánh giá tháng ra file Excel (`.xls`) chuẩn mẫu biểu hành chính nhà nước.

---

## 🔑 Danh Sách Tài Khoản Mẫu Trải Nghiệm

Hệ thống đã nạp sẵn dữ liệu mẫu thực tế của UBND xã Nghĩa Lâm:

| Vai trò | Chức danh / Vị trí | Tên tài khoản | Mật khẩu mặc định |
|---|---|---|---|
| **Quản trị viên (ADMIN)** | Quản trị viên CNTT | `admin` | `admin123` |
| **Lãnh đạo (LEADERSHIP)** | Chủ tịch UBND xã | `chutich` | `chutich123` |
| **Lãnh đạo (LEADERSHIP)** | Phó Chủ tịch UBND xã | `phochutich` | `phochutich123` |
| **Trưởng bộ phận (HEAD)** | Giám đốc TTPVHCC | `truongphong_hcc` | `head123` |
| **Trưởng bộ phận (HEAD)** | Trưởng BP Địa chính | `truongphong_dc` | `head123` |
| **Công chức (EMPLOYEE)** | Công chức Địa chính | `congchuc_dc` | `emp123` |
| **Công chức (EMPLOYEE)** | Công chức Văn hóa - XH | `congchuc_vh` | `emp123` |

> *Giao diện Đăng nhập có sẵn thanh **"Chọn tài khoản trải nghiệm nhanh"** giúp đăng nhập 1-click vào bất kỳ vai trò nào.*

---

## 🚀 Hướng Dẫn Khởi Chạy Hệ Thống

### 1. Cài đặt dependencies (nếu chưa cài):
```bash
cd server && npm install
cd ../client && npm install
```

### 2. Khởi chạy Backend Server:
```bash
cd server
npm run dev
```
*Backend chạy tại: `http://localhost:5000` (Healthcheck: `http://localhost:5000/api/health`)*

### 3. Khởi chạy Frontend Client:
```bash
cd client
npm run dev
```
*Giao diện người dùng chạy tại: `http://localhost:3000`*

---

## 🧪 Kiểm Thử Tự Động (E2E Test Suites)

Hệ thống đạt **100% Passed** qua tất cả các bộ kiểm thử:
- `npx tsx server/test_m2.ts`: 15/15 tests passed (Auth & RBAC).
- `npx tsx server/test_m3.ts`: 10/10 tests passed (Task Management).
- `npx tsx server/test_m4.ts`: 8/8 tests passed (Decree 335 Evaluation).
- `npx tsx server/test_m5.ts`: 4/4 tests passed (Dashboards & Excel Export).
- `npx tsx server/test_e2e_full.ts`: 23/23 tests passed (Unified End-to-End Integration).
