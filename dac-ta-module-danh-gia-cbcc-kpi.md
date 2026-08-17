# Đặc tả giao code module Đánh giá CBCC KPI

Module Đánh giá CBCC KPI cần được ưu tiên hoàn thiện trước vì đây là lõi nghiệp vụ của hệ thống đánh giá công chức theo Nghị định 335/2025/NĐ-CP, đồng thời đang tồn tại lỗi UAT nghiêm trọng ở phần tính điểm nhiệm vụ quy đổi tối đa 70 điểm.[cite:12][cite:17][cite:8]

## 1. Mục tiêu chức năng

Module phải hỗ trợ theo dõi, đánh giá và xếp loại công chức trên thang điểm 100; trong đó phần tiêu chí chung tối đa 30 điểm và phần kết quả thực hiện nhiệm vụ tối đa 70 điểm.[cite:15][cite:30][cite:33]

Phần mềm phải bao phủ các chức năng chính sau:[cite:17][cite:23]
- Quản lý danh mục vị trí việc làm và bộ tiêu chí đánh giá.
- Quản lý kỳ đánh giá tháng, quý, năm.
- Quản lý nhiệm vụ, sản phẩm đầu ra, số lượng giao, số lượng hoàn thành và hệ số quy đổi.
- Tự chấm, nhận xét, phê duyệt nhiều cấp.
- Tính điểm, xếp loại, tổng hợp báo cáo, xuất dữ liệu.
- Lưu vết thay đổi và kiểm tra lại lịch sử tính điểm.

## 2. Dữ liệu đầu vào

Hệ thống cần tối thiểu các nhóm dữ liệu đầu vào sau để tính đúng kết quả đánh giá theo hướng dẫn triển khai của Bộ Nội vụ.[cite:17][cite:23][cite:26]

### 2.1. Hồ sơ công chức
- Mã cán bộ.
- Họ tên.
- Đơn vị, bộ phận.
- Chức vụ.
- Vai trò người dùng hệ thống.
- Vị trí việc làm.
- Nhóm đối tượng đánh giá.

### 2.2. Kỳ đánh giá
- Tháng, quý, năm.
- Ngày mở kỳ.
- Ngày khóa kỳ.
- Trạng thái: nháp, đang tự chấm, chờ nhận xét, chờ phê duyệt, đã chốt.

### 2.3. Danh mục nhiệm vụ/sản phẩm
- Mã nhiệm vụ.
- Tên nhiệm vụ/công việc.
- Sản phẩm đầu ra.
- Đơn vị tính.
- Số lượng giao.
- Số lượng hoàn thành.
- Hệ số quy đổi sản phẩm chuẩn.
- Nhóm mức độ phức tạp nếu áp dụng.
- Mốc tiến độ, hạn hoàn thành.
- Minh chứng đính kèm hoặc liên kết hồ sơ.

### 2.4. Tiêu chí chung
- Danh sách tiêu chí phần I.
- Điểm tối đa từng tiêu chí.
- Điểm tự chấm.
- Điểm cấp trên nhận xét/chấm lại.
- Ghi chú giải trình.

### 2.5. Luồng xử lý và phê duyệt
- Người tạo phiếu.
- Người tự chấm.
- Người nhận xét.
- Người phê duyệt.
- Thời điểm thao tác.
- Ý kiến nhận xét.
- Trạng thái xử lý.

Hệ thống phải hỗ trợ ít nhất các nhóm đối tượng gồm công chức chuyên môn, nghiệp vụ; công chức lãnh đạo, quản lý; và nhóm hỗ trợ hoặc phục vụ nếu đang áp dụng chung trong cùng phần mềm.[cite:17][cite:31]

## 3. Công thức tính

Theo các tài liệu công khai về triển khai Nghị định 335/2025/NĐ-CP, đánh giá công chức thực hiện trên thang điểm 100, trong đó tiêu chí chung tối đa 30 điểm và kết quả thực hiện nhiệm vụ tối đa 70 điểm.[cite:15][cite:30][cite:33]

### 3.1. Nguyên tắc bắt buộc
- Không được hard-code phần II luôn bằng 70/70.
- Điểm phần II phải được tính từ dữ liệu nhiệm vụ/sản phẩm thực tế.
- Công thức tính phải chạy ở backend và trả về cho frontend đầy đủ điểm trung gian để đối chiếu.
- Mọi thay đổi số lượng, hệ số, tự chấm hoặc tiến độ phải làm thay đổi lại điểm sau khi lưu.[cite:6][cite:8]

### 3.2. Công thức đề xuất để giao dev

#### Bước 1: Quy đổi khối lượng giao
`assigned_converted = assigned_qty * conversion_factor`

#### Bước 2: Quy đổi khối lượng hoàn thành
`completed_converted = completed_qty * conversion_factor`

#### Bước 3: Tính tỷ lệ hoàn thành quy đổi
`completion_ratio = min(completed_converted / assigned_converted, 1)`

#### Bước 4: Tính điểm từng dòng nhiệm vụ
`line_score = self_score * k_factor * completed_qty`

Hoặc nếu hệ thống chốt theo tỷ lệ hoàn thành quy đổi toàn kỳ, áp dụng:

\[
diem\_phan\_II = min\left(70,\ 70 \times \frac{tong\_quy\_doi\_hoan\_thanh}{tong\_quy\_doi\_duoc\_giao}\right)
\]

#### Bước 5: Tính tổng điểm
\[
tong\_diem = diem\_tieu\_chi\_chung + diem\_phan\_II
\]

Điều kiện biên bắt buộc:
- `0 <= diem_tieu_chi_chung <= 30`
- `0 <= diem_phan_II <= 70`
- `0 <= tong_diem <= 100`
- Nếu `assigned_qty = 0` thì trả về trạng thái chưa đủ dữ liệu, không được chia cho 0 và không được chấm tối đa.[cite:32][cite:33][cite:6]

### 3.3. Xếp loại
Ngưỡng xếp loại nên cấu hình trong hệ thống thay vì hard-code, nhưng cần hỗ trợ tối thiểu 4 mức xếp loại theo kết quả tổng điểm.[cite:15][cite:29][cite:34]

Bảng cấu hình gợi ý:

| Mức xếp loại | Ngưỡng điểm gợi ý | Ghi chú |
|---|---:|---|
| Loại A | 90–100 | Cấu hình được [cite:29] |
| Loại B | 70 đến dưới 90 | Cấu hình được [cite:29] |
| Loại C | Theo cấu hình nội bộ | Không hard-code [cite:15] |
| Loại D | Theo cấu hình nội bộ | Không hard-code [cite:15] |

## 4. Màn hình cần có

Các màn hình cần triển khai để module vận hành đầy đủ theo quy trình đánh giá công chức.[cite:17][cite:23][cite:31]

### 4.1. Danh sách kỳ đánh giá
- Lọc theo tháng, quý, năm.
- Lọc theo đơn vị, trạng thái.
- Tạo mới, mở kỳ, khóa kỳ.

### 4.2. Danh sách phiếu đánh giá
- Tìm theo tên cán bộ, đơn vị, vị trí việc làm.
- Hiển thị trạng thái phiếu.
- Hiển thị tổng điểm, xếp loại.

### 4.3. Phiếu đánh giá chi tiết
Bố cục bắt buộc:
1. Thông tin công chức.
2. Phần I – Tiêu chí chung 30 điểm.
3. Phần II – Kết quả thực hiện nhiệm vụ 70 điểm.
4. Tổng hợp điểm và xếp loại.
5. Nhận xét, phê duyệt.
6. Lịch sử thao tác và audit log.[cite:17][cite:23][cite:8]

### 4.4. Màn hình cấu hình danh mục
- Cấu hình tiêu chí chung.
- Cấu hình danh mục nhiệm vụ/sản phẩm.
- Cấu hình hệ số quy đổi.
- Cấu hình ngưỡng xếp loại.

### 4.5. Màn hình báo cáo
- Tổng hợp theo tháng.
- Tổng hợp theo quý.
- Tổng hợp theo năm.
- Xuất Excel/PDF nếu có.
- Dashboard chỉ được đọc dữ liệu đã tính chuẩn từ module KPI, không tự tính theo công thức riêng.[cite:20][cite:5]

## 5. API cần có

### 5.1. API danh mục
- `GET /api/evaluations/catalog/positions`
- `GET /api/evaluations/catalog/task-items`
- `POST /api/evaluations/catalog/task-items`
- `PUT /api/evaluations/catalog/task-items/:id`
- `GET /api/evaluations/catalog/common-criteria`
- `PUT /api/evaluations/catalog/common-criteria`

### 5.2. API kỳ đánh giá
- `GET /api/evaluations/periods`
- `POST /api/evaluations/periods`
- `POST /api/evaluations/periods/:id/open`
- `POST /api/evaluations/periods/:id/close`

### 5.3. API phiếu đánh giá
- `GET /api/evaluations/forms`
- `GET /api/evaluations/forms/:id`
- `POST /api/evaluations/forms`
- `PUT /api/evaluations/forms/:id`
- `POST /api/evaluations/forms/:id/save-draft`
- `POST /api/evaluations/forms/:id/submit`
- `POST /api/evaluations/forms/:id/recalculate`

### 5.4. API dòng nhiệm vụ
- `POST /api/evaluations/forms/:id/task-lines`
- `PUT /api/evaluations/forms/:id/task-lines/:lineId`
- `DELETE /api/evaluations/forms/:id/task-lines/:lineId`
- `POST /api/evaluations/forms/:id/task-lines/recalculate`

### 5.5. API phê duyệt
- `POST /api/evaluations/forms/:id/review`
- `POST /api/evaluations/forms/:id/approve`
- `POST /api/evaluations/forms/:id/reject`
- `GET /api/evaluations/forms/:id/audit-log`

### 5.6. API báo cáo
- `GET /api/evaluations/reports/monthly`
- `GET /api/evaluations/reports/quarterly`
- `GET /api/evaluations/reports/yearly`
- `GET /api/evaluations/reports/export-excel`

### 5.7. Yêu cầu response bắt buộc
API `GET /api/evaluations/forms/:id` và `POST /api/evaluations/forms/:id/recalculate` phải trả về đủ dữ liệu để debug công thức.[cite:6][cite:8]

```json
{
  "formId": "EVL-2026-08-001",
  "employee": {
    "id": "CB001",
    "name": "Nguyen Van A"
  },
  "period": {
    "month": 8,
    "year": 2026
  },
  "commonCriteriaScore": 25,
  "taskScore": 18.5,
  "totalScore": 43.5,
  "rating": "Loai B",
  "taskLines": [
    {
      "id": "TL1",
      "assignedQty": 2,
      "completedQty": 1,
      "conversionFactor": 1.5,
      "selfScore": 5,
      "kFactor": 1,
      "lineScore": 5
    }
  ],
  "auditFormula": {
    "assignedConverted": 3,
    "completedConverted": 1.5,
    "taskScoreFormula": "70 * 1.5 / 3"
  }
}
```

## 6. Tiêu chí nghiệm thu

Module chỉ được nghiệm thu khi đồng thời đạt các tiêu chí sau:[cite:6][cite:8][cite:5]

- Tính đúng cấu trúc 30 điểm tiêu chí chung + 70 điểm kết quả nhiệm vụ.[cite:30][cite:33]
- Không còn hiện tượng Phần II luôn nhảy 70/70 khi dữ liệu không tương ứng.[cite:6][cite:8]
- Sửa một giá trị đầu vào thì tổng điểm thay đổi đúng sau khi lưu và tải lại phiếu.[cite:6]
- Có đủ luồng lưu nháp, gửi chấm, nhận xét, phê duyệt, từ chối, khóa kỳ.[cite:12][cite:23]
- Có audit log ghi nhận mọi thay đổi điểm và trạng thái phiếu.[cite:7]
- Xuất Excel hoạt động và khớp số liệu trên màn hình.[cite:5]
- Dashboard KPI chỉ đọc dữ liệu đã tính đúng từ backend, không tự tính lại sai.[cite:5]

### Bộ test nghiệm thu tối thiểu

| Test case | Mô tả | Kết quả mong đợi |
|---|---|---|
| TC01 | 1 nhiệm vụ, tự chấm 5 điểm, hoàn thành 1/1 | Phần II không tự động lên 70 nếu công thức không cho phép [cite:8] |
| TC02 | Sửa số lượng hoàn thành từ 1 xuống 0 | Điểm Phần II giảm tương ứng sau khi lưu [cite:6] |
| TC03 | Thêm 2 nhiệm vụ có hệ số quy đổi khác nhau | Tổng điểm bằng tổng quy đổi thực tế, không lấy max mặc định [cite:18][cite:8] |
| TC04 | Đóng kỳ đánh giá | Không cho phép sửa phiếu sau khi khóa kỳ [cite:12] |
| TC05 | Xuất Excel báo cáo | File xuất khớp số liệu trên màn hình [cite:5] |

## 7. Ghi chú giao việc cho Antigravity

Ưu tiên số 1 là sửa đúng logic tính Phần II tối đa 70 điểm từ dữ liệu nhiệm vụ/sản phẩm thực tế; sau đó hoàn thiện dữ liệu, API, màn hình, workflow và tiêu chí nghiệm thu theo đặc tả này.[cite:6][cite:8][cite:12][cite:17]

Không đóng ticket nếu mới sửa giao diện hiển thị; chỉ được đóng khi test lại các trường hợp thay đổi số lượng, tự chấm, hệ số quy đổi và tải lại phiếu mà kết quả vẫn đúng ở backend lẫn frontend.[cite:6][cite:8]
