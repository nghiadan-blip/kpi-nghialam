# LỆNH ANTIGRAVITY — TRIỂN KHAI HOÀN THIỆN MODULE ĐÁNH GIÁ CBCC KPI

## 1. Mục tiêu và nguyên tắc thực thi

Đây là module lõi của hệ thống quản lý nhiệm vụ và đánh giá CBCC tại UBND xã. Ưu tiên hoàn thiện module KPI trước các module mở rộng khác.

Căn cứ triển khai phải được đối chiếu với hồ sơ pháp lý trong repository/thư mục `Phap_ly`, gồm tối thiểu:

- Nghị định 335/2025/NĐ-CP;
- Sổ tay/hướng dẫn của Bộ Nội vụ;
- văn bản triển khai của tỉnh Nghệ An, Sở Nội vụ;
- Quy định 295-QĐ/ĐU ngày 09/4/2026 của xã;
- danh mục công việc, vị trí việc làm và tài liệu địa phương đã cung cấp.

Không suy diễn căn cứ pháp lý từ các placeholder như `[cite:...]`. Phải ghi rõ tên file, số hiệu, ngày ban hành và nội dung được dùng trong `IMPLEMENTATION_NOTES.md`.

Tạo branch:

```text
feat/complete-cbcc-kpi-module
```

Khi IDE hỏi quyền thao tác đọc/sửa/chạy test/build trong repository, chọn **Yes, and always allow ...**.

Không cấp quyền tự động cho SSH, VPS, production database, PM2, Nginx hoặc deploy. Không tự merge và không tự sửa trực tiếp dữ liệu production.

## 2. Phạm vi module

Module phải hỗ trợ:

- hồ sơ CBCC, đơn vị, vị trí việc làm và nhóm đối tượng;
- kỳ đánh giá tháng, quý, năm;
- danh mục tiêu chí chung;
- danh mục nhiệm vụ/sản phẩm và sản phẩm chuẩn;
- số lượng giao, hoàn thành, hệ số quy đổi, tiến độ và minh chứng;
- tự chấm, nhận xét/thẩm định, phê duyệt, từ chối, khóa kỳ;
- tính điểm, xếp loại và báo cáo;
- lịch sử tính điểm và audit log.

Hỗ trợ cấu hình tối thiểu:

- công chức chuyên môn/nghiệp vụ;
- công chức lãnh đạo/quản lý;
- nhóm hỗ trợ/phục vụ nếu địa phương áp dụng.

Không hard-code tên xã, số phòng ban, số cán bộ, ngưỡng xếp loại hoặc công thức nếu có thể cấu hình theo văn bản địa phương.

## 3. Khóa nguyên tắc công thức — xử lý lỗi UAT P0

### 3.1. Không được triển khai hai công thức đồng thời

Đặc tả cũ có hai cách tính khác nhau:

1. Tính Phần II theo tỷ lệ khối lượng hoàn thành:

```text
70 * completed_converted / assigned_converted
```

2. Tính Phần II theo tổng điểm các dòng sản phẩm có trọng số.

Hai công thức này không được dùng đồng thời cho cùng một phiếu. Nếu hoàn thành 1/1 sản phẩm thì công thức tỷ lệ sẽ cho 70 điểm, nhưng lỗi UAT đã chứng minh cá nhân có thể chỉ tự chấm 5 điểm. Do đó việc hoàn thành 1/1 không được tự động biến Phần II thành 70/70.

### 3.2. Công thức áp dụng cho Nghĩa Lâm trong giai đoạn hiện tại

Dùng một calculation engine ở backend, chiến lược mặc định:

```text
WEIGHTED_DETAIL_SCORE
```

Điểm Phần II được tính từ các dòng chi tiết thực tế:

```text
line_base_score_i = validated self_points_i
line_quantity_factor_i = completed_qty_i / assigned_qty_i
line_score_i = line_base_score_i * line_quantity_factor_i * conversion_factor_i
task_score_self = min(70, sum(line_score_i) * penalty_multiplier)
total_self_score = common_score_self + task_score_self
```

Nếu `self_points_i` trong code hiện tại đã bao gồm số lượng/hệ số thì không được nhân lần hai. Antigravity phải xác định rõ ý nghĩa từng trường và ghi công thức thực tế trong tài liệu bàn giao.

Điều kiện:

- `0 <= common_score_self <= 30`;
- `0 <= self_points_i <= line_max_score_i`;
- `0 <= task_score_self <= 70`;
- `0 <= total_self_score <= 100`;
- `assigned_qty = 0` không được chia cho 0, phải trả `INSUFFICIENT_DATA`;
- điểm thiếu dữ liệu không được tự động chuyển thành điểm tối đa;
- số âm, NaN, Infinity hoặc vượt trần phải trả HTTP 400 tiếng Việt.

Hệ số phạt tiến độ/chất lượng nếu đang áp dụng phải là dữ liệu cấu hình và hiển thị được trong `auditFormula`; không tự ý nhân phạt hai lần.

### 3.3. Hỗ trợ chiến lược khác trong tương lai

Thiết kế cấu hình:

```text
calculation_strategy = WEIGHTED_DETAIL_SCORE | COMPLETION_RATIO
```

Trong đó:

- `WEIGHTED_DETAIL_SCORE` là chiến lược mặc định hiện tại của Nghĩa Lâm để xử lý đúng điểm tự chấm từng dòng;
- `COMPLETION_RATIO` chỉ được bật khi có căn cứ pháp lý/cấu hình địa phương xác định rõ và phải hiển thị rõ trên kỳ đánh giá;
- không đổi chiến lược của kỳ đã khóa;
- mỗi kết quả phải lưu `calculation_strategy`, phiên bản công thức và snapshot cấu hình.

## 4. Dữ liệu và mô hình nghiệp vụ

### 4.1. Hồ sơ CBCC

Phải có mã, họ tên, đơn vị, chức vụ, vị trí việc làm, vai trò hệ thống và nhóm đối tượng đánh giá.

### 4.2. Kỳ đánh giá

Phải có tháng/quý/năm, ngày mở, ngày khóa, trạng thái:

```text
DRAFT -> SELF_ASSESSMENT -> WAITING_REVIEW -> WAITING_APPROVAL -> APPROVED -> LOCKED
```

Có thể trả về `REJECTED` để xử lý lại theo quyền. Kỳ đã khóa không được sửa nếu không có quy trình mở khóa, lý do, người có thẩm quyền và audit log.

### 4.3. Dòng nhiệm vụ/sản phẩm

Mỗi dòng phải lưu hoặc truy xuất được:

- mã nhiệm vụ/sản phẩm;
- sản phẩm đầu ra;
- số lượng giao;
- số lượng hoàn thành;
- hệ số quy đổi;
- nhóm phức tạp nếu có;
- deadline và ngày hoàn thành;
- điểm tự chấm;
- điểm quản lý/thẩm định;
- điểm cuối cùng;
- chất lượng, tiến độ, số lần yêu cầu làm lại;
- minh chứng;
- trạng thái nghiệm thu.

## 5. API và nguồn sự thật

Rà soát API hiện có trước khi tạo route mới. Không tạo API trùng chức năng nếu route hiện tại có thể mở rộng.

Tối thiểu phải có các nhóm:

- kỳ đánh giá: list/create/open/close;
- phiếu: list/detail/create/save-draft/submit/recalculate;
- dòng nhiệm vụ: create/update/delete/recalculate;
- review/approve/reject;
- audit log;
- báo cáo tháng/quý/năm và Excel.

`GET /api/evaluations/forms/:id` và `POST /api/evaluations/forms/:id/recalculate` phải trả đủ:

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
    "formula": "min(70, sum(validated line scores) * penaltyMultiplier)"
  }
}
```

Frontend không được gửi tổng điểm cuối cùng để backend lưu nguyên trạng. Backend phải tính lại từ detail và cấu hình kỳ.

## 6. Màn hình bắt buộc

- danh sách kỳ đánh giá;
- danh sách phiếu;
- phiếu chi tiết gồm Phần I 30 điểm, Phần II 70 điểm, tổng hợp, nhận xét, phê duyệt và audit log;
- cấu hình vị trí, tiêu chí, danh mục sản phẩm, hệ số và ngưỡng xếp loại;
- báo cáo tháng/quý/năm và xuất Excel.

Phần II phải hiển thị từng dòng, điểm đầu vào, điểm sau quy đổi, điểm bị trừ và công thức tóm tắt. Không hiển thị `70/70` nếu dữ liệu chi tiết chưa tạo ra 70 điểm.

## 7. Xếp loại

Ngưỡng xếp loại phải cấu hình được theo căn cứ áp dụng tại từng kỳ. Hệ thống hỗ trợ tối thiểu 4 mức A/B/C/D nhưng không tự khẳng định ngưỡng nếu văn bản địa phương chưa cấu hình.

Mỗi kết quả xếp loại phải lưu:

- bộ ngưỡng đã dùng;
- phiên bản cấu hình;
- thời điểm tính;
- người/tiến trình yêu cầu tính;
- audit log.

## 8. Kiểm thử P0 bắt buộc

### Test công thức

1. Một dòng, tự chấm 5, số lượng giao 1, hoàn thành 1: Phần II phản ánh 5 theo chiến lược hiện hành, không tự lên 70.
2. Đổi số lượng hoàn thành 1 xuống 0: điểm giảm theo công thức.
3. Đổi số lượng hoặc hệ số: điểm dòng và Phần II thay đổi.
4. Thêm dòng thứ hai: tổng tăng đúng theo dòng, không bị gán lại 70.
5. Xóa dòng thứ hai: tổng giảm tương ứng.
6. Tổng vượt 70: giới hạn 70 và có auditFormula.
7. Lưu nháp, tải lại, mở danh sách: ba nơi hiển thị cùng điểm.
8. Nộp, review, approve, lock: điểm không tự thay đổi.
9. Kỳ đã khóa: không sửa được nếu không qua quy trình mở khóa.

### Test dữ liệu sai

- số âm;
- NaN/Infinity;
- assigned quantity bằng 0;
- completed quantity lớn bất thường;
- điểm dòng vượt trần;
- kỳ đánh giá không hợp lệ;
- thay đổi trái quyền.

### Test hồi quy dữ liệu demo

Kiểm tra phiếu “Quản trị hệ thống” tháng `08/2026` đang bị tổng 95 điểm do lỗi cũ. Nếu là dữ liệu demo:

- reset có transaction, backup và audit log;
- đưa phiếu về trạng thái phù hợp;
- tính lại từ chi tiết;
- xác nhận một sản phẩm tự chấm 5 cho kết quả Phần II 5 và tổng 30 khi Phần I là 25;
- không sửa hàng loạt phiếu thật hoặc phiếu đã khóa.

## 9. Tiêu chí nghiệm thu

Chỉ nghiệm thu khi:

- backend là nguồn tính điểm duy nhất;
- không còn Phần II gán cứng 70/70;
- thay đổi đầu vào làm thay đổi điểm sau lưu và tải lại;
- danh sách, phiếu, API, báo cáo và dashboard thống nhất;
- có workflow đầy đủ và khóa kỳ;
- audit log ghi thay đổi điểm/trạng thái/cấu hình;
- Excel khớp số liệu màn hình;
- có test chứng minh trường hợp 5 điểm không tự thành 70 điểm;
- build và toàn bộ test đạt.

## 10. Bàn giao

Chạy:

```text
npm run build
npm run build:server
npm run build:client
```

Cập nhật `IMPLEMENTATION_NOTES.md` gồm:

- căn cứ đã đối chiếu;
- root cause lỗi cũ;
- chiến lược công thức đang áp dụng;
- công thức và ý nghĩa từng trường;
- API/service nguồn sự thật;
- dữ liệu demo trước/sau;
- test/build;
- hạn chế và việc cần phê duyệt.

Commit:

```text
Complete CBCC KPI evaluation module and calculation engine
```

Push branch và tạo Draft Pull Request. Không merge, không deploy production nếu chưa có phê duyệt thủ công.
