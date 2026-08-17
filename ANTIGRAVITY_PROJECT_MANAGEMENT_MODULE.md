# ĐẶC TẢ GIAO ANTIGRAVITY — MODULE QUẢN LÝ DỰ ÁN

## 1. Mục tiêu

Xây dựng module `Quản lý Dự án` tại route:

```text
/projects
```

Module phải quản lý toàn bộ vòng đời dự án đầu tư công:

```text
Chủ trương đầu tư → Phê duyệt → Đấu thầu/hợp đồng → Thi công
→ Nghiệm thu → Quyết toán → Bàn giao đưa vào sử dụng
```

Module phải liên kết với module `Giải ngân vốn đầu tư công` đang có tại:

```text
/public-investment
```

Không phá vỡ dữ liệu hoặc chức năng hiện có.

Tạo branch:

```text
feat/project-management-module
```

Khi IDE hỏi quyền đọc, sửa file, chạy test hoặc build trong repository, chọn **Yes, and always allow ...**.

Không tự deploy, không sửa trực tiếp database production, không tự merge.

## 2. Nguyên tắc dữ liệu và liên kết

Không sao chép và nhập lại các số liệu tài chính đã có trong `public_investment_projects`.

### 2.1. Nguồn dữ liệu chính

| Nhóm dữ liệu | Bảng/module nguồn chính | Module hiển thị |
|---|---|---|
| Vốn kế hoạch/phân bổ | `public_investment_projects` | `/public-investment`, `/projects` |
| Đã giải ngân/tỷ lệ giải ngân | `public_investment_projects` | `/public-investment`, `/projects` |
| Tiến độ thi công hiện tại | `public_investment_projects` | `/public-investment`, `/projects` |
| Chủ trương/phê duyệt | `projects` | `/projects` |
| Đấu thầu/hợp đồng | `projects` | `/projects` |
| Mốc tiến độ chi tiết | `project_milestones` | `/projects` |
| Nghiệm thu/quyết toán/bàn giao | `projects` | `/projects` |

Không để hai module cùng sửa một trường mà không có quy tắc nguồn chính.

### 2.2. Khóa liên kết

Ưu tiên liên kết bằng khóa ngoại:

```text
projects.investment_project_id
    → public_investment_projects.id
```

Đồng thời giữ `project_code` duy nhất để hiển thị và đối soát. Nếu dữ liệu cũ chỉ có `project_code`, phải tạo migration đối soát và không tự gộp hai dự án khác nhau chỉ vì tên gần giống.

Ràng buộc:

- một bản ghi `public_investment_projects` chỉ có tối đa một `projects`;
- `project_code` phải unique trong phạm vi tenant/đơn vị;
- không cho đổi mã dự án khi đã có giải ngân, nghiệm thu, quyết toán hoặc audit log nếu chưa có quy trình đổi mã;
- mọi liên kết, hủy liên kết và đồng bộ phải ghi audit log.

### 2.3. Đồng bộ hai chiều có kiểm soát

“Hai chiều” nghĩa là hai module có thể truy xuất dữ liệu liên kết và cập nhật các nhóm dữ liệu thuộc quyền quản lý của mình; không có nghĩa là sao chép tất cả trường theo vòng lặp.

- Khi tạo dự án mới, cho phép chọn bản ghi đầu tư công có sẵn hoặc tạo giao dịch liên kết mới.
- Khi tạo đồng thời, phải dùng transaction: nếu một bên lỗi thì rollback cả hai.
- Khi sửa vốn/giải ngân ở `/public-investment`, `/projects` chỉ đọc lại dữ liệu mới nhất từ bảng nguồn.
- Khi sửa thông tin vòng đời ở `/projects`, `/public-investment` chỉ hiển thị các trường liên quan nếu cần.
- Không để frontend tự đồng bộ bằng hai request rời rạc.
- Nếu cần đồng bộ các trường chung như tên dự án/chủ đầu tư, phải có service phía server, transaction và audit log.
- Xử lý xung đột bằng `updated_at`/version hoặc transaction; không âm thầm ghi đè thay đổi mới hơn.

## 3. Mô hình dữ liệu

### 3.1. Bảng `projects`

Tạo migration theo naming convention hiện có, gồm tối thiểu:

- `id`;
- `investment_project_id` FK tới `public_investment_projects.id`, unique, nullable khi tạo dự án độc lập;
- `project_code` unique;
- `project_name`;
- `investment_group` cấu hình A/B/C theo căn cứ pháp luật áp dụng;
- `approval_decision_no`;
- `approval_date`;
- `approving_authority`;
- `design_approval_no`;
- `bidding_method`;
- `contractor_selection_date`;
- `contract_no`;
- `contract_value`;
- `start_date`;
- `planned_end_date`;
- `actual_end_date`;
- `acceptance_status`;
- `acceptance_date`;
- `settlement_status`;
- `settlement_value`;
- `settlement_date`;
- `handover_date`;
- `project_manager_id` FK tới `users`;
- `supervisor_unit`;
- `created_by`, `updated_by` nếu pattern hiện có hỗ trợ;
- `created_at`, `updated_at`;
- `version` hoặc cơ chế optimistic locking nếu hệ thống đã có.

Các trường tài chính không tạo bản sao trong bảng này.

### 3.2. Bảng `project_milestones`

- `id`;
- `project_id` FK;
- `milestone_name`;
- `milestone_type` nếu cần cấu hình;
- `planned_date`;
- `actual_date`;
- `status`;
- `note`;
- `created_by`, `updated_by`;
- `created_at`, `updated_at`.

Ràng buộc:

- `actual_date` không được trước `planned_date` nếu trạng thái là hoàn thành đúng hạn, trừ khi có quy tắc nghiệp vụ khác;
- không cho ngày nghiệm thu trước ngày khởi công;
- không cho ngày quyết toán trước ngày nghiệm thu hoàn thành;
- không cho ngày bàn giao trước ngày nghiệm thu hoàn thành;
- ngày kết thúc dự kiến phải sau ngày khởi công;
- trạng thái mốc phải được kiểm tra cả frontend và backend.

### 3.3. Enum/configuration

Không hard-code rải rác các enum. Dùng constant/schema/config tập trung cho:

- nhóm dự án A/B/C;
- cấp phê duyệt;
- hình thức lựa chọn nhà thầu;
- trạng thái nghiệm thu;
- trạng thái quyết toán;
- trạng thái mốc;
- vướng mắc;
- trạng thái dự án.

Các nhóm/cấp/thẩm quyền phải được đối chiếu với Luật Đầu tư công và văn bản phân cấp hiện hành; nếu chưa xác định phải đánh dấu `LEGAL_REVIEW_REQUIRED`.

## 4. API

Rà soát route hiện có trước khi tạo API mới.

### 4.1. Dự án

```text
GET    /api/projects
GET    /api/projects/:id
POST   /api/projects
PUT    /api/projects/:id
PATCH  /api/projects/:id
DELETE /api/projects/:id
GET    /api/projects/:id/investment
POST   /api/projects/:id/link-investment
POST   /api/projects/:id/unlink-investment
```

`GET /api/projects` hỗ trợ lọc theo mã, tên, nhóm dự án, giai đoạn, trạng thái, cán bộ phụ trách, đơn vị và phân trang.

`GET /api/projects/:id` trả chi tiết dự án, milestones và dữ liệu giải ngân liên kết, không tạo bản sao tài chính.

Không cho xóa dự án nếu đã có giải ngân, nghiệm thu, quyết toán hoặc hồ sơ liên quan. Trả HTTP 409 với lý do rõ ràng; chỉ cho hủy/đóng theo workflow được cấu hình.

### 4.2. Mốc tiến độ

```text
POST   /api/projects/:id/milestones
PUT    /api/projects/:id/milestones/:milestoneId
PATCH  /api/projects/:id/milestones/:milestoneId
DELETE /api/projects/:id/milestones/:milestoneId
```

### 4.3. Dashboard/báo cáo

```text
GET /api/projects/dashboard
GET /api/projects/export
```

Dashboard phải lấy vốn kế hoạch, phân bổ, giải ngân và tỷ lệ giải ngân từ module Đầu tư công, không tự tính lại theo nguồn khác.

## 5. RBAC bắt buộc từ đầu

Không chỉ ẩn menu ở frontend. Tất cả endpoint phải có middleware/service kiểm tra quyền và phạm vi dữ liệu.

### 5.1. Ma trận quyền

| Vai trò | Xem danh sách | Xem chi tiết | Tạo/sửa/xóa dự án | Sửa phê duyệt/hợp đồng | Sửa nghiệm thu/quyết toán |
|---|---:|---:|---:|---:|---:|
| Công chức thường | Chỉ dự án được gán nếu cấu hình cho phép | Dự án được gán | Không | Không | Không |
| Trưởng bộ phận liên quan | Trong phạm vi đơn vị | Trong phạm vi đơn vị | Có theo phạm vi | Có theo thẩm quyền | Theo cấu hình/thẩm quyền |
| Lãnh đạo UBND | Toàn xã | Toàn xã | Có | Có theo thẩm quyền | Có theo thẩm quyền |
| Quản trị viên | Theo permission kỹ thuật | Theo permission kỹ thuật | Không mặc nhiên | Không mặc nhiên | Không mặc nhiên |

Quyền nên được định nghĩa tập trung:

```text
PROJECT_READ
PROJECT_READ_ASSIGNED
PROJECT_CREATE
PROJECT_UPDATE
PROJECT_DELETE
PROJECT_UPDATE_APPROVAL
PROJECT_UPDATE_CONTRACT
PROJECT_UPDATE_ACCEPTANCE
PROJECT_UPDATE_SETTLEMENT
PROJECT_MILESTONE_MANAGE
PROJECT_EXPORT
PROJECT_LINK_INVESTMENT
```

Không tin các trường role/permission do client gửi. Kiểm tra user session/JWT từ server và kiểm tra `project_manager_id`, đơn vị, phạm vi lãnh đạo.

### 5.2. Route guard frontend

- Thêm menu `Quản lý dự án` cạnh `Đầu tư công` chỉ với vai trò/permission phù hợp.
- Route `/projects` phải chặn truy cập trực tiếp, refresh và nhập URL thủ công.
- Không tải dữ liệu trước khi hoàn tất kiểm tra quyền.
- API trả 403 phải hiển thị trang/thông báo không có quyền bằng tiếng Việt.

## 6. Giao diện `/projects`

### 6.1. Danh sách

Cột tối thiểu:

```text
Mã DA | Tên công trình | Nhóm DA | Chủ đầu tư | Nhà thầu
Giai đoạn | % Tiến độ | % Giải ngân | Trạng thái | Hành động
```

Phần `% Giải ngân` phải lấy trực tiếp từ dữ liệu liên kết `/public-investment`.

### 6.2. Chi tiết dạng tab

- Thông tin chung: mã, tên, nhóm, quyết định, cấp phê duyệt;
- Đấu thầu & Hợp đồng: hình thức, số hợp đồng, giá trị, ngày ký, nhà thầu;
- Tiến độ thi công: milestones và tiến độ thực tế liên kết;
- Giải ngân: kế hoạch, phân bổ, đã giải ngân, tỷ lệ, link về công trình đầu tư công;
- Nghiệm thu & Quyết toán: trạng thái, ngày, giá trị, bàn giao.

Không nhập lại dữ liệu tài chính trong tab Giải ngân.

### 6.3. Tạo dự án

Wizard tối thiểu:

1. Thông tin chung và chọn bản ghi đầu tư công có sẵn hoặc tạo liên kết mới;
2. Đấu thầu/hợp đồng;
3. Nghiệm thu/quyết toán nếu có;
4. Xác nhận và lưu transaction.

## 7. Dashboard

Hiển thị:

- số dự án theo nhóm A/B/C;
- đang chuẩn bị/đang thi công/chậm tiến độ/hoàn thành/quyết toán;
- tổng kế hoạch/phân bổ/đã giải ngân lấy từ module nguồn;
- công trình sắp đến hạn nghiệm thu;
- công trình sắp đến hạn quyết toán;
- vướng mắc theo nhóm;
- danh sách cần Chủ tịch chỉ đạo.

Phân biệt `NO_DATA`, `NOT_APPLICABLE`, `PENDING` và số liệu bằng 0; không hiển thị 0/0 gây hiểu nhầm.

## 8. Audit log và dữ liệu nhạy cảm

Ghi audit log cho:

- tạo/sửa/xóa/liên kết/hủy liên kết dự án;
- sửa quyết định, hợp đồng, giá trị hợp đồng;
- sửa nghiệm thu, quyết toán, bàn giao;
- sửa milestones;
- thay đổi project manager;
- mọi request bị từ chối do thiếu quyền;
- đồng bộ hoặc xung đột dữ liệu giữa hai module.

Log phải có người thao tác, vai trò, thời gian, bản ghi, giá trị trước/sau, lý do và correlation/request id nếu hệ thống có.

## 9. Test nghiệm thu

### Dữ liệu/liên kết

1. Tạo dự án liên kết với công trình đầu tư công có sẵn.
2. Tạo đồng thời hai bản ghi bằng transaction.
3. Không tạo trùng khi mã dự án đã liên kết.
4. Đổi số giải ngân ở module nguồn, `/projects` đọc được giá trị mới.
5. Sửa thông tin vòng đời ở `/projects`, module đầu tư công không bị ghi đè sai dữ liệu tài chính.
6. Xóa dự án có giải ngân: HTTP 409, không xóa.
7. Kiểm tra xung đột cập nhật và audit log.

### RBAC

1. Công chức truy cập `/projects`: bị chặn nếu không được gán quyền.
2. Công chức gọi `GET/POST/PUT/PATCH/DELETE /api/projects`: 401/403 đúng chính sách.
3. Công chức được gán làm project manager: chỉ xem đúng dự án được gán, không sửa trường nhạy cảm.
4. Công chức sửa vốn, phê duyệt, hợp đồng, quyết toán: 403 và dữ liệu không đổi.
5. Trưởng bộ phận thao tác trong phạm vi: thành công.
6. Trưởng bộ phận thao tác ngoài phạm vi: 403.
7. Lãnh đạo UBND thao tác toàn xã theo thẩm quyền: thành công.
8. Admin kỹ thuật không mặc nhiên được sửa dữ liệu nghiệp vụ.
9. Direct URL, refresh, Network/cURL/Postman đều không vượt được quyền.

### Validation

- Giá trị hợp đồng/giá trị quyết toán không âm;
- ngày tháng đúng thứ tự;
- giá trị quyết toán không vượt quy tắc nghiệp vụ được cấu hình;
- tiến độ từ 0 đến 100;
- enum hợp lệ;
- lỗi trả HTTP 400 tiếng Việt, không trả 500 do dữ liệu đầu vào.

## 10. Bàn giao

Chạy:

```text
npm run build
npm run build:server
npm run build:client
```

Chạy toàn bộ test hiện có và test mới cho liên kết dữ liệu/RBAC/validation.

Cập nhật `IMPLEMENTATION_NOTES.md` gồm:

- migration/schema;
- quy tắc nguồn dữ liệu và đồng bộ;
- API;
- ma trận RBAC;
- route guard;
- audit log;
- test evidence;
- các nội dung cần `LEGAL_REVIEW_REQUIRED` theo Luật Đầu tư công và phân cấp hiện hành.

Commit:

```text
Add project lifecycle management linked to public investment
```

Push branch và tạo Draft Pull Request. Không tự merge, không deploy production.
