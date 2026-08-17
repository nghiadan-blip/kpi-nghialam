# MASTER COMMAND — HOÀN THIỆN MODULE ĐÁNH GIÁ CBCC KPI

## 1. Chế độ thực thi và giới hạn

Đây là lệnh triển khai duy nhất cho module Đánh giá CBCC KPI của hệ thống `kpi.nghialam.com`.

Tạo branch:

```text
feat/complete-cbcc-kpi-module
```

Khi IDE hỏi quyền đọc, sửa file, chạy test hoặc build trong repository, chọn **Yes, and always allow ...**.

Không tự động cấp quyền cho:

- SSH/VPS;
- production database;
- PM2/Nginx;
- deploy/restart dịch vụ;
- xóa hoặc sửa dữ liệu production.

Không tự merge và không tự deploy production.

Trước khi thực hiện, kiểm tra working tree, branch hiện tại và đọc các file dự án: `MASTER_SPEC.md`, `CLAUDE.md`, `AGENTS.md`, `IMPLEMENTATION_NOTES.md`, các đặc tả KPI, controller/service/model/migration/frontend/test hiện có.

## 2. Căn cứ pháp lý bắt buộc

Bắt buộc đọc tài liệu trong thư mục `Phap_ly` và tài liệu đã cung cấp, gồm:

- Nghị định 335/2025/NĐ-CP;
- Sổ tay/hướng dẫn của Bộ Nội vụ về xây dựng bộ tiêu chí, sản phẩm/công việc chuẩn và đánh giá công chức;
- văn bản triển khai của tỉnh Nghệ An;
- văn bản của Sở Nội vụ Nghệ An;
- Kế hoạch 51-KH/TU ngày 07/5/2026 của Ban Thường vụ Tỉnh ủy Nghệ An;
- Quy định 295-QĐ/ĐU ngày 09/4/2026 của Đảng ủy xã Nghĩa Lâm;
- danh mục công việc, vị trí việc làm, khung năng lực và tài liệu nội bộ của xã.

Thứ tự ưu tiên áp dụng:

1. Nghị định và phụ lục/biểu mẫu kèm theo;
2. hướng dẫn chính thức của Bộ Nội vụ;
3. văn bản triển khai của tỉnh/Sở Nội vụ;
4. quy định nội bộ của xã;
5. cấu hình và đặc tả phần mềm.

Không dùng bài báo, bản dự thảo, tài liệu truyền thông hoặc suy luận cá nhân thay cho văn bản chính thức.

## 3. Ma trận truy xuất pháp lý — bắt buộc trước khi code

Trước khi sửa code, phải tạo file `KPI_LEGAL_TRACEABILITY_MATRIX.md` gồm các cột:

| Nội dung nghiệp vụ | Văn bản căn cứ | Điều/khoản/phụ lục/trang | Quy tắc phải triển khai | File/API/model/configuration liên quan | Trạng thái |
|---|---|---|---|---|---|
| Đối tượng đánh giá |  |  |  |  |  |
| Kỳ đánh giá |  |  |  |  |  |
| Tiêu chí chung |  |  |  |  |  |
| Kết quả nhiệm vụ |  |  |  |  |  |
| Sản phẩm/công việc chuẩn |  |  |  |  |  |
| Hệ số quy đổi |  |  |  |  |  |
| Số lượng/chất lượng/tiến độ |  |  |  |  |  |
| Tự chấm/thẩm định/phê duyệt |  |  |  |  |  |
| Xếp loại |  |  |  |  |  |
| Hồ sơ/audit/lưu trữ |  |  |  |  |  |

Nếu chưa xác định được điều/khoản/phụ lục/trang thì ghi `LEGAL_REVIEW_REQUIRED` và không tự triển khai phần nghiệp vụ đó.

## 4. Mục tiêu module

Module phải hỗ trợ:

- hồ sơ CBCC, đơn vị, chức vụ, vị trí việc làm, vai trò và nhóm đối tượng;
- kỳ đánh giá tháng, quý, năm;
- danh mục tiêu chí chung;
- danh mục nhiệm vụ/sản phẩm và sản phẩm chuẩn;
- số lượng giao, hoàn thành, hệ số quy đổi, deadline, chất lượng, tiến độ, minh chứng;
- tự chấm, nhận xét/thẩm định, phê duyệt, từ chối, khóa kỳ;
- tính điểm, xếp loại, báo cáo và xuất Excel/PDF nếu có;
- lịch sử tính điểm, thay đổi cấu hình và audit log.

Hỗ trợ tối thiểu các nhóm:

- công chức chuyên môn/nghiệp vụ;
- công chức lãnh đạo/quản lý;
- nhóm hỗ trợ/phục vụ nếu văn bản địa phương áp dụng.

Không hard-code tên xã, số đơn vị, số cán bộ, ngưỡng xếp loại hoặc công thức nếu có thể cấu hình.

## 5. Lỗi P0 — công thức Phần II luôn bằng 70/70

### 5.1. Bằng chứng UAT

- Phiếu “Quản trị hệ thống”, tháng 08/2026, có dòng sản phẩm tự chấm 5 điểm.
- Phần II vẫn hiển thị 70/70.
- Lưu nháp làm tổng tự chấm thành 95 = 25 + 70.
- Đổi số lượng từ 1 lên 5 làm điểm dòng tăng từ 5 lên 25 nhưng Phần II vẫn 70/70.

Không được đóng lỗi bằng cách chỉ sửa UI. Phải trace từ chi tiết dòng → calculation service → API lưu nháp → API danh sách → database → báo cáo/dashboard.

### 5.2. Không dùng đồng thời hai công thức

Đặc tả có thể xuất hiện hai chiến lược:

```text
COMPLETION_RATIO
70 * completed_converted / assigned_converted
```

và:

```text
WEIGHTED_DETAIL_SCORE
Tổng điểm thực tế của các dòng nhiệm vụ có trọng số
```

Không được áp dụng đồng thời hai chiến lược cho một phiếu. Phải xác định chiến lược theo Nghị định 335, Sổ tay Bộ Nội vụ và văn bản Nghệ An/Nghĩa Lâm, sau đó lưu vào cấu hình kỳ.

Không mặc nhiên coi cấu trúc 30 điểm + 70 điểm hoặc bất kỳ ngưỡng nào là quy định pháp lý nếu chưa đối chiếu trực tiếp với văn bản đang có hiệu lực.

### 5.3. Engine tính điểm

Tạo hoặc xác định một calculation engine duy nhất ở backend. Frontend không được gửi tổng điểm cuối cùng để backend lưu nguyên trạng.

Engine phải có phiên bản và chiến lược:

```text
calculation_strategy = WEIGHTED_DETAIL_SCORE | COMPLETION_RATIO
calculation_version = YYYY.MM.N
```

Nếu căn cứ đã xác nhận chiến lược `WEIGHTED_DETAIL_SCORE`, điểm được tính theo dữ liệu chi tiết:

```text
line_score_i = validated_detail_score_i * quantity_factor_i * conversion_factor_i
task_score = min(task_section_max, sum(line_score_i) * penalty_multiplier)
total_score = common_score + task_score
```

Không nhân hai lần số lượng/hệ số nếu điểm dòng đã bao gồm các yếu tố đó. Phải ghi rõ ý nghĩa từng trường và công thức thực tế trong `IMPLEMENTATION_NOTES.md`.

Điều kiện bắt buộc:

- `0 <= common_score <= common_section_max`;
- `0 <= line_score <= line_max_score`;
- `0 <= task_score <= task_section_max`;
- `0 <= total_score <= total_score_max`;
- số âm, NaN, Infinity hoặc vượt trần trả HTTP 400 tiếng Việt;
- assigned quantity bằng 0 không chia cho 0 và không tự động được điểm tối đa;
- thiếu minh chứng/thiếu nghiệm thu phải thể hiện trạng thái, không tự biến thành hoàn thành.

Mọi điểm, hệ số, ngưỡng xếp loại và hệ số phạt phải có căn cứ pháp lý, phiên bản cấu hình và audit log.

### 5.4. Test P0 bắt buộc

1. Một dòng tự chấm 5: Phần II phản ánh điểm thực tế, không tự lên 70.
2. Đổi số lượng hoàn thành 1 → 0: điểm giảm đúng.
3. Đổi số lượng/hệ số: điểm dòng và Phần II thay đổi.
4. Thêm dòng: tổng tăng đúng, không gán lại 70.
5. Xóa dòng: tổng giảm đúng.
6. Tổng vượt mức tối đa: giới hạn theo cấu hình và trả `auditFormula`.
7. Lưu nháp, tải lại, mở danh sách: cùng một giá trị.
8. Nộp, thẩm định, phê duyệt, khóa kỳ: điểm không tự thay đổi.
9. Kiểm tra phiếu “Quản trị hệ thống” tháng 08/2026 và reset demo có transaction, backup, audit log; không sửa hàng loạt dữ liệu thật.

## 6. Workflow, thẩm quyền và khóa kỳ

Trạng thái tối thiểu:

```text
DRAFT -> SELF_ASSESSMENT -> WAITING_REVIEW -> WAITING_APPROVAL -> APPROVED -> LOCKED
```

Có thể có `REJECTED` để xử lý lại theo quyền.

Phải kiểm soát:

- người được đánh giá chỉ tự chấm trong phạm vi cho phép;
- người nhận xét/thẩm định kiểm tra sản phẩm, minh chứng, số lượng, chất lượng, tiến độ;
- người phê duyệt đúng thẩm quyền;
- kỳ đã khóa không sửa nếu không có quy trình mở khóa, lý do, người có quyền và audit log;
- AI chỉ hỗ trợ tổng hợp/dự thảo, không tự chấm, phê duyệt, xếp loại chính thức hoặc ban hành.

## 7. Lỗi P0 — phân quyền giao nhiệm vụ

Tài khoản Công chức hiện có thể gọi `POST /api/tasks` và giao nhiệm vụ cho bất kỳ ai, kể cả Quản trị hệ thống.

### 7.1. Quyền đúng

Chỉ các vai trò hiện có tương ứng với:

- `ADMIN`;
- `LEADERSHIP`;
- `DEPT_HEAD` trong phạm vi đơn vị được phân quyền;

mới được tạo/giao nhiệm vụ.

Công chức/nhân viên thường, tài khoản chưa phê duyệt, bị khóa hoặc chỉ có quyền xem không được giao nhiệm vụ.

### 7.2. Backend bắt buộc

Tại `POST /api/tasks` hoặc endpoint thực tế tương ứng, kiểm tra:

1. token/session hợp lệ;
2. tài khoản hoạt động và đã phê duyệt;
3. permission `TASK_ASSIGN_CREATE`;
4. `assigned_to` và `department_id` thuộc phạm vi được phép;
5. dữ liệu đầu vào hợp lệ;
6. chỉ sau đó mới insert.

Thiếu quyền trả HTTP `403 Forbidden`, thông báo tiếng Việt và không tạo bản ghi.

Không tin các trường `role`, `isAdmin`, `canAssign`, `assigned_by` hoặc `department_id` do frontend gửi.

### 7.3. Rà soát toàn bộ API

Rà soát quyền và object-level authorization cho:

- tạo, sửa, xóa, chuyển nhiệm vụ;
- đổi người thực hiện, deadline, số lượng, hệ số;
- cập nhật trạng thái, upload/xóa minh chứng;
- tự chấm, thẩm định, phê duyệt, từ chối KPI;
- khóa/mở khóa kỳ, sửa điểm sau khóa;
- tạo/sửa/xóa danh mục sản phẩm và hệ số.

Ẩn nút frontend chỉ là lớp hỗ trợ, không thay thế kiểm tra backend.

### 7.4. Test RBAC bắt buộc

- Công chức gọi `POST /tasks`: 403, không có bản ghi mới.
- Công chức cố giao cho ADMIN: 403.
- Công chức sửa/xóa/chuyển nhiệm vụ ngoài quyền: 403.
- Công chức giả mạo role/creator/department: không nâng quyền.
- Lãnh đạo giao việc hợp lệ: thành công.
- Trưởng bộ phận giao trong đơn vị: thành công.
- Trưởng bộ phận giao ngoài phạm vi: 403.
- Admin thao tác hợp lệ: thành công.
- Tài khoản chưa phê duyệt/bị khóa: 401 hoặc 403 theo quy ước.

## 8. Mô hình dữ liệu tối thiểu

### Hồ sơ CBCC

Mã, họ tên, đơn vị, chức vụ, vai trò, vị trí việc làm, nhóm đánh giá, trạng thái hoạt động/phê duyệt.

### Kỳ đánh giá

Tháng/quý/năm, ngày mở, ngày khóa, trạng thái, căn cứ pháp lý, bộ tiêu chí/version, calculation strategy/version, người phê duyệt cấu hình.

### Dòng nhiệm vụ/sản phẩm

Mã, tên, sản phẩm đầu ra, số lượng giao/hoàn thành, hệ số, nhóm phức tạp, deadline, ngày hoàn thành, điểm tự chấm, điểm quản lý, điểm cuối, chất lượng, tiến độ, minh chứng, nghiệm thu.

### Audit log

Ai, vai trò, thời gian, đối tượng, giá trị trước/sau, lý do, căn cứ, phiên bản công thức/cấu hình và hành động.

Không xóa hoặc ghi đè lịch sử tính điểm.

## 9. API tối thiểu

Rà soát API hiện có trước khi tạo route mới; không tạo endpoint trùng chức năng.

- kỳ: list/create/open/close;
- phiếu: list/detail/create/save-draft/submit/recalculate;
- dòng: create/update/delete/recalculate;
- review/approve/reject;
- audit log;
- báo cáo tháng/quý/năm và Excel.

API detail và recalculate phải trả đủ:

```json
{
  "formId": "EVL-2026-08-001",
  "period": { "month": 8, "year": 2026 },
  "calculationStrategy": "WEIGHTED_DETAIL_SCORE",
  "calculationVersion": "2026.08.1",
  "commonCriteriaScore": 25,
  "taskScore": 5,
  "totalScore": 30,
  "rating": null,
  "taskLines": [],
  "auditFormula": {
    "taskSectionMax": 70,
    "penaltyMultiplier": 1,
    "formula": "min(taskSectionMax, sum(validated line scores) * penaltyMultiplier)"
  }
}
```

## 10. Màn hình và báo cáo

Phải có:

- danh sách kỳ đánh giá;
- danh sách phiếu;
- phiếu chi tiết Phần I/Phần II/tổng hợp/xếp loại/nhận xét/phê duyệt/audit;
- cấu hình tiêu chí, vị trí, sản phẩm, hệ số, ngưỡng;
- báo cáo tháng/quý/năm và xuất Excel/PDF nếu có.

Dashboard chỉ đọc dữ liệu đã tính chuẩn từ backend, không tự tính lại bằng công thức riêng.

## 11. Nghiệm thu pháp lý và kỹ thuật

Không nghiệm thu nếu thiếu một trong các điều kiện:

- có `KPI_LEGAL_TRACEABILITY_MATRIX.md` với điều/khoản/phụ lục/trang;
- cấu hình tiêu chí, điểm, hệ số, ngưỡng và thẩm quyền có căn cứ;
- không còn Phần II gán cứng 70/70;
- thay đổi đầu vào làm thay đổi điểm sau lưu/tải lại;
- backend/frontend/danh sách/báo cáo/dashboard thống nhất;
- đầy đủ lưu nháp, gửi, nhận xét, phê duyệt, từ chối, khóa/mở khóa;
- audit log đầy đủ;
- Công chức không thể giao nhiệm vụ qua API trực tiếp;
- xuất Excel khớp số liệu màn hình.

## 12. Kiểm tra cuối và bàn giao

Chạy:

```text
npm run build
npm run build:server
npm run build:client
```

Chạy toàn bộ test hiện có và test mới cho KPI/RBAC. Kiểm tra TypeScript, lint, migration/schema và không đưa dữ liệu công dân thật vào test.

Cập nhật:

- `KPI_LEGAL_TRACEABILITY_MATRIX.md`;
- `IMPLEMENTATION_NOTES.md`;
- tài liệu calculation engine;
- ma trận quyền RBAC;
- test evidence trước/sau;
- danh sách nội dung còn `LEGAL_REVIEW_REQUIRED`.

Commit:

```text
Complete legal-compliant CBCC KPI module and RBAC controls
```

Push branch và tạo Draft Pull Request. Không tự merge, không migrate production, không restart dịch vụ và không deploy nếu chưa được phê duyệt thủ công.

Cuối cùng trả về:

- branch;
- commit SHA;
- danh sách file thay đổi;
- ma trận pháp lý;
- công thức thực tế đã áp dụng;
- kết quả build/test;
- dữ liệu demo đã reset nếu có;
- các điểm còn cần lãnh đạo/pháp chế phê duyệt.
