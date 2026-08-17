# BÁO CÁO NGHIỆM THU GIAO DIỆN & UAT MODULE QUẢN LÝ DỰ ÁN ĐẦU TƯ CÔNG
**UBND XÃ NGHĨA LÂM - HỆ THỐNG QUẢN LÝ CÁN BỘ CÔNG CHỨC VÀ ĐIỀU HÀNH TỔNG HỢP**
*Ngày lập báo cáo: 17/08/2026*
*Môi trường: Testing / Staging (Branch: feat/project-legal-compliance-2026)*

---

## 1. Tổng Quan Nghiệm Thu Giao Diện (UI/UX)

Module Quản lý Dự án Đầu tư công (`/projects`) đã được hoàn thiện nâng cấp toàn diện theo thiết kế chính quy, đáp ứng đầy đủ tiêu chuẩn thông tin hành chính công, phân quyền RBAC đa cấp độ và tự động hóa quy trình nghiệp vụ:

| Thành Phần Giao Diện | Yêu Cầu Thiết Kế | Trạng Thái Đạt Được | Đánh Giá Nghiệm Thu |
| :--- | :--- | :--- | :--- |
| **Thanh Tiêu Đề & Thống Kê** | Thống kê nhanh tổng dự án, vốn phân bổ, giải ngân TB, số dự án chậm trễ và cảnh báo chênh lệch tiến độ | Tích hợp card KPI động với màu sắc chuẩn hành chính (`#1864AB`, `#2B8A3E`, `#E8590C`, `#D6336C`) | ✅ ĐẠT |
| **Bộ Lọc Đa Tiêu Chí** | Lọc theo mã trạng thái chuẩn, loại vướng mắc, nhóm A/B/C, nguồn vốn, CĐT, cảnh báo | Hệ thống 7 bộ lọc dropdown + toggle chậm tiến độ + input tìm kiếm không dấu | ✅ ĐẠT |
| **Bảng Danh Sách Dự Án** | Hiển thị mã chuẩn `DA-YYYY-NN`, tên, nhóm, vốn, tiến độ %, đợt thanh toán, trạng thái Việt hóa | Table responsive với thanh tiến độ kép (kế hoạch/thực tế), badges phân loại, badges vướng mắc | ✅ ĐẠT |
| **Cột Hành Động Phân Quyền** | Nút Xem chi tiết, Chỉnh sửa, Vướng mắc, Hợp đồng, Nghiệm thu, Hồ sơ, Xóa/Lưu trữ | Menu thao tác nhanh + kiểm tra RBAC (ẩn/vô hiệu hóa với vai trò không có thẩm quyền) | ✅ ĐẠT |
| **Modal Chi Tiết Dự Án** | 5 Tab: Thông tin chung, 16 bước workflow, Vướng mắc công trình, Đợt thanh toán, Nhật ký Audit | Đầy đủ 5 tab chuyên sâu, cho phép thêm vướng mắc, thêm chứng từ giải ngân, duyệt workflow | ✅ ĐẠT |
| **Modal Khởi Tạo Dự Án** | Wizard kiểm tra mã `DA-YYYY-NN`, chặn số âm, chặn giải ngân > vốn, liên kết ĐTC 1:1 | Form thông minh tự động validate regex, làm sạch tên nhà thầu và tính tỷ lệ giải ngân | ✅ ĐẠT |
| **Xuất Báo Cáo Excel** | Xuất tệp Excel thực tế khớp chính xác theo bộ lọc hiện tại với metadata người xuất & thời điểm | Tích hợp endpoint `/api/projects/export` tạo tệp `.xlsx` chuẩn bảng biểu | ✅ ĐẠT |

---

## 2. Kết Quả Kiểm Thử UAT Theo Phân Quyền Người Dùng (RBAC)

### 2.1. Lãnh đạo UBND xã (Chủ tịch / Phó Chủ tịch)
- **Tài khoản test**: `chutich` (Trần Văn Nam - Chủ tịch UBND xã)
- **Kết quả kiểm thử**:
  - Xem toàn bộ danh sách dự án của toàn xã: **PASS**
  - Thẩm quyền phê duyệt các bước quy trình 1 - 16: **PASS**
  - Thẩm quyền tạo mới dự án và điều chỉnh các trường nhạy cảm: **PASS**
  - Thẩm quyền lưu trữ (Archive) dự án: **PASS**
  - Cơ chế chặn xóa cứng khi đã phát sinh vốn/hồ sơ (HTTP 409): **PASS**

### 2.2. Trưởng Bộ phận Địa chính - Xây dựng
- **Tài khoản test**: `truongphong_dc` (Lê Hoàng Anh)
- **Kết quả kiểm thử**:
  - Xem toàn bộ danh sách dự án do xã quản lý: **PASS**
  - Tạo mới hồ sơ dự án và tự sinh mã `DA-YYYY-NN`: **PASS**
  - Cập nhật số quyết định duyệt, hồ sơ thiết kế, hợp đồng kinh tế: **PASS**
  - Ký duyệt các bước thẩm định kỹ thuật, nghiệm thu kỹ thuật: **PASS**

### 2.3. Công chức phụ trách dự án (Project Manager / Cán bộ Địa chính)
- **Tài khoản test**: `congchuc_dc` (Vũ Minh Tuấn)
- **Kết quả kiểm thử**:
  - Xem chi tiết dự án mình được phân công quản lý: **PASS**
  - Cập nhật tiến độ thực tế, nhật ký hiện trường, đính kèm biên bản: **PASS**
  - Ghi nhận vướng mắc công trình và đề xuất biện pháp xử lý: **PASS**
  - Khai báo chứng từ giải ngân thanh toán: **PASS**
  - Bị chặn sửa đổi các trường nhạy cảm (QĐ phê duyệt, TMĐT) với HTTP 403 Forbidden: **PASS**

### 2.4. Công chức ngoài bộ phận (Văn phòng / Thống kê)
- **Tài khoản test**: `congchuc_vp` (Nguyễn Văn Phong)
- **Kết quả kiểm thử**:
  - Không thể xem danh sách toàn bộ dự án ngoài phạm vi phân công: **PASS**
  - Truy cập trực tiếp URL dự án bị chặn HTTP 403 Forbidden: **PASS**
  - Cố gắng tạo mới dự án bị chặn HTTP 403 Forbidden: **PASS**

---

## 3. Xác Nhận Kiểm Thử Gate Rules & Luồng Dữ Liệu Nghiệp Vụ

1. **Gate Rule 1 (Phê duyệt chủ trương)**: Không cho duyệt Bước 1 khi thiếu file Nghị quyết HĐND $\rightarrow$ **PASS**.
2. **Gate Rule 2 (Ký hợp đồng)**: Chặn lưu trạng thái ký hợp đồng nếu thiếu thông tin nhà thầu, số HĐ hoặc giá trị HĐ $\rightarrow$ **PASS**.
3. **Gate Rule 3 (Nghiệm thu hoàn thành)**: Chặn chuyển sang `COMPLETION_ACCEPTANCE` khi thiếu Biên bản nghiệm thu công trình $\rightarrow$ **PASS**.
4. **Gate Rule 4 (Bàn giao đưa vào sử dụng)**: Chặn chuyển sang `HANDED_OVER` khi thiếu Biên bản bàn giao $\rightarrow$ **PASS**.
5. **Gate Rule 5 (Phê duyệt quyết toán)**: Chặn chuyển sang `SETTLEMENT_APPROVED` khi thiếu Quyết định phê duyệt quyết toán $\rightarrow$ **PASS**.
6. **Gate Rule 6 (Bảo vệ dữ liệu tài chính)**: Chặn xóa vĩnh viễn (Hard Delete) dự án đã phát sinh số liệu giải ngân, hồ sơ tài liệu hoặc chứng từ đợt thanh toán $\rightarrow$ Trả về **HTTP 409 Conflict** $\rightarrow$ **PASS**.

---

## 4. Kết Luận
Giao diện người dùng và toàn bộ các luồng tương tác UAT của module Quản lý Dự án Đầu tư công (`/projects`) đã đạt tiêu chuẩn nghiệp vụ, sẵn sàng bàn giao kỹ thuật trên branch `feat/project-legal-compliance-2026`.
