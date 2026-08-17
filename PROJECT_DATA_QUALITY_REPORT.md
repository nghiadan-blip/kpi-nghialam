# BÁO CÁO CHẤT LƯỢNG DỮ LIỆU & BẢO VỆ TÀI CHÍNH MODULE QUẢN LÝ DỰ ÁN
**UBND XÃ NGHĨA LÂM - HỆ THỐNG QUẢN LÝ CÁN BỘ CÔNG CHỨC VÀ ĐIỀU HÀNH TỔNG HỢP**
*Ngày lập: 17/08/2026*
*Phạm vi: Toàn bộ cơ sở dữ liệu `projects`, `public_investment_projects`, `project_obstacles`, `project_payment_disbursements`*

---

## 1. Chuẩn Hóa Danh Mục & Mã Trạng Thái Dữ Liệu

Hệ thống đã loại bỏ hoàn toàn việc lưu trữ chuỗi hiển thị tiếng Việt tùy ý trong cơ sở dữ liệu và chuẩn hóa thành danh mục Enum mã nội bộ tiếng Anh chuẩn công nghệ:

### 1.1. Mã Trạng Thái Vòng Đời Dự Án (`lifecycle_status`)
| Mã Nội Bộ | Nhãn Tiếng Việt Hiển Thị | Định Nghĩa Nghiệp Vụ |
| :--- | :--- | :--- |
| `PREPARATION` | Chuẩn bị dự án | Đang lập báo cáo đề xuất chủ trương, thẩm định ban đầu |
| `INVESTMENT_APPROVED` | Đã duyệt chủ trương / DA | Đã có Nghị quyết HĐND và Quyết định phê duyệt dự án |
| `BIDDING` | Đang lựa chọn nhà thầu | Đang đăng tải E-TBMT, mở thầu hoặc chỉ định thầu |
| `CONTRACTED` | Đã ký hợp đồng | Đã ký kết hợp đồng kinh tế và bảo đảm thực hiện hợp đồng |
| `CONSTRUCTION` | Đang thi công | Nhà thầu đang triển khai xây lắp trên công trường |
| `DELAYED` | Chậm tiến độ | Quá hạn kế hoạch hoặc phát sinh vướng mắc nghiêm trọng |
| `PARTIAL_ACCEPTANCE` | Nghiệm thu từng phần | Đã nghiệm thu giai đoạn/hạng mục hoàn thành |
| `COMPLETION_ACCEPTANCE`| Nghiệm thu hoàn thành | Đã tổ chức nghiệm thu hoàn thành toàn bộ công trình |
| `HANDED_OVER` | Đã bàn giao đưa vào SD | Đã lập biên bản bàn giao cho đơn vị thụ hưởng quản lý |
| `SETTLEMENT_UNDER_REVIEW`| Đang thẩm tra quyết toán | Đã nộp hồ sơ quyết toán vốn đầu tư hoàn thành |
| `SETTLEMENT_APPROVED` | Đã phê duyệt quyết toán | Đã có Quyết định phê duyệt quyết toán của cấp có thẩm quyền |
| `WARRANTY` | Đang bảo hành | Công trình đang trong thời hạn bảo hành theo hợp đồng |
| `COMPLETED` | Hoàn thành toàn bộ | Kết thúc bảo hành, tất toán tài khoản dự án |
| `ARCHIVED` | Đã lưu trữ | Hồ sơ lưu trữ lịch sử, không tham gia thống kê điều hành |

### 1.2. Danh Mục Loại Vướng Mắc (`project_obstacles`)
1. `LAND_CLEARANCE`: Vướng mắc Giải phóng mặt bằng, kiểm đếm, giá đất bồi thường.
2. `LEGAL_PROCEDURE`: Vướng mắc Thủ tục pháp lý, thẩm duyệt PCCC, cấp phép môi trường.
3. `WEATHER`: Thiên tai, mưa bão, thời tiết bất lợi làm gián đoạn thi công.
4. `CONTRACTOR`: Năng lực nhà thầu yếu kém, chậm huy động máy móc nhân lực.
5. `FUNDING`: Khó khăn nguồn vốn, chậm phân bổ hoặc kho bạc giải ngân chậm.
6. `DESIGN`: Thay đổi thiết kế, xử lý địa chất hoặc điều chỉnh dự toán.
7. `OTHER`: Các vướng mắc phát sinh khác.

### 1.3. Chuẩn Hóa Tên Nhà Thầu
- Hệ thống đã loại bỏ hoàn toàn các chuỗi rác như "Chưa lựa chọn nhà thầu", "Chưa có nhà thầu" trong cơ sở dữ liệu.
- Trường `contractor_name` để `NULL` khi chưa lựa chọn, kết hợp cờ trạng thái `contractor_selection_status: 'NOT_SELECTED' | 'SELECTED'`.

---

## 2. Ràng Buộc Tính Toàn Vẹn & Chống Nhân Bản Tài Chính

### 2.1. Quan Hệ 1:1 Giữa Hồ Sơ Dự Án Và Danh Mục Đầu Tư Công
- Mỗi dự án trong bảng `projects` chỉ liên kết tối đa với 1 bản ghi trong bảng `public_investment_projects` thông qua khóa ngoại `investment_project_id` có cơ chế kiểm tra `UNIQUE`.
- Các câu lệnh SQL truy vấn số liệu giải ngân đọc trực tiếp 1 chiều từ nguồn số liệu kế toán ĐTC, loại bỏ hoàn toàn rủi ro `JOIN` nhân đôi/nhân ba tổng vốn:
  - **Tổng vốn phân bổ toàn xã**: 2,600,000,000 VNĐ
  - **Tổng giải ngân thực tế**: 1,830,000,000 VNĐ
  - **Tỷ lệ giải ngân bình quân**: 70.38% (Khớp 100% giữa Dashboard và Bảng chi tiết).

### 2.2. Kiểm Soát Giá Trị Số & Quy Tắc Logic
- **Chặn số âm**: Chặn toàn bộ giá trị âm đối với Kế hoạch vốn, Vốn phân bổ, Giải ngân, Giá trị hợp đồng, Giá trị quyết toán.
- **Chặn giải ngân vượt vốn**: Số tiền giải ngân không được vượt quá số vốn phân bổ được giao.
- **Chặn ký hợp đồng không hợp lệ**: Không cho nhập số hợp đồng nếu thiếu tên nhà thầu và giá trị hợp đồng.
- **Chặn hợp đồng vượt tổng mức đầu tư**: Giá trị hợp đồng xây lắp không được vượt TMĐT khi chưa có quyết định điều chỉnh dự án.

---

## 3. Kết Quả Kiểm Tra Tính Toàn Vẹn Dữ Liệu
Toàn bộ 4 dự án mẫu cùng 2 bản ghi vướng mắc và 2 đợt thanh toán giải ngân trong cơ sở dữ liệu đã được rà soát sạch 100%, không phát sinh lỗi khóa ngoại, không có dữ liệu mồ côi (orphaned records).
