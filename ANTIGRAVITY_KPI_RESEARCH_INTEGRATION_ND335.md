# LỆNH ANTIGRAVITY — TÍCH HỢP KẾT QUẢ NGHIÊN CỨU VÀ HOÀN THIỆN MODULE KPI THEO NĐ 335

## 1. Mục đích

Đọc và tích hợp báo cáo:

```text
Bao-cao-nghien-cuu-KPI-cap-xa-ND335.docx
```

vào module Đánh giá CBCC KPI của `kpi.nghialam.com`.

Đây là nhiệm vụ rà soát và hoàn thiện lõi nghiệp vụ. Không chỉ sửa giao diện. Không tự ý thay đổi dữ liệu production, không deploy, không merge vào `main` và không xóa dữ liệu thật.

Khi IDE hỏi quyền đọc/sửa file, chạy test hoặc build, chọn:

```text
Yes, and always allow ...
```

Tạo branch riêng:

```text
feat/kpi-nd335-research-integration
```

Nếu branch đã tồn tại, kiểm tra working tree trước khi dùng; không ghi đè thay đổi chưa commit.

## 2. Tài liệu phải đọc trước khi code

Đọc toàn bộ, không đọc lướt:

1. `Bao-cao-nghien-cuu-KPI-cap-xa-ND335.docx`.
2. `ANTIGRAVITY_KPI_MODULE_MASTER_EXECUTION.md`.
3. `ANTIGRAVITY_IMPLEMENT_KPI_MODULE_FINAL.md`.
4. `ANTIGRAVITY_KPI_LEGAL_COMPLIANCE_ADDENDUM.md`.
5. `KPI_LEGAL_BASIS.md`.
6. `KPI_MODULE_DEEP_SPEC.md`.
7. `KPI_LEGAL_TRACEABILITY_MATRIX.md`.
8. `IMPLEMENTATION_NOTES.md`.
9. Toàn bộ văn bản liên quan trong:

```text
D:\Dropbox\Văn bản\UBND xa Nghia Lam\CBCC\Phap_ly
```

Nếu đang chạy trong repository đã sao chép kho pháp lý thì đọc thêm:

```text
./Phap_ly
```

Các nhóm tài liệu tối thiểu:

- Nghị định 335/2025/NĐ-CP và phụ lục/tài liệu kèm theo.
- Sổ tay/hướng dẫn chính thức của Bộ Nội vụ.
- Quyết định 283/QĐ-UBND ngày 31/5/2026 của UBND xã Nghĩa Lâm — nguồn KPI nội bộ đã được xác định là căn cứ gốc.
- Quy định 295-QĐ/ĐU ngày 09/4/2026.
- Kế hoạch 51-KH/TU ngày 07/5/2026 nếu có trong kho.
- Văn bản triển khai chính thức của tỉnh Nghệ An và Sở Nội vụ Nghệ An.
- Danh mục công việc/sản phẩm, VTVL, khung năng lực, quyết định phân công và các phụ lục đã cung cấp.

Thứ tự ưu tiên: văn bản có hiệu lực và phụ lục chính thức → hướng dẫn chính thức của Bộ Nội vụ → văn bản tỉnh/Sở → QĐ 283 và văn bản xã → cấu hình phần mềm → đề xuất trong báo cáo nghiên cứu.

## 3. Phân loại bắt buộc: quy định, hướng dẫn, đề xuất

Trong tài liệu và code phải phân loại từng nội dung thành một trong ba nhóm:

- `LEGAL_MANDATORY`: bắt buộc theo văn bản có hiệu lực.
- `OFFICIAL_GUIDANCE`: hướng dẫn nghiệp vụ chính thức, dùng để triển khai nhưng không tự mở rộng nghĩa vụ pháp lý.
- `LOCAL_POLICY_PROPOSAL`: đề xuất cụ thể hóa của xã, chỉ bật sau khi được phê duyệt trong QĐ/quy chế/bộ tiêu chí áp dụng.

Không chuyển một đề xuất trong báo cáo nghiên cứu thành quy tắc bắt buộc chỉ vì báo cáo dùng từ “bắt buộc”. Các nội dung sau phải mặc định là `LOCAL_POLICY_PROPOSAL` hoặc `LEGAL_REVIEW_REQUIRED` nếu chưa có căn cứ địa phương trực tiếp:

- chia 30 điểm thành 8/8/8/6;
- tối đa 03 nhiệm vụ đột xuất/người/tháng;
- không cho nhập nhật ký lùi quá 07 ngày;
- chọn ngẫu nhiên 10% bản ghi để hậu kiểm;
- các thời hạn phản hồi 03/02/03 ngày làm việc;
- cảnh báo 80% cùng một mức xếp loại;
- các mức điểm mẫu N1–N4 và bảng hệ số mẫu trong báo cáo;
- cơ chế người đứng đầu chấm d/đ/e theo quy tắc nội bộ khác với Nghị định;
- mọi ngưỡng, tỷ lệ, hệ số phạt hoặc điều kiện loại trừ chưa có căn cứ trực tiếp.

Các đề xuất trên chỉ được đưa vào cấu hình khi có người phê duyệt, căn cứ, phiên bản và ngày hiệu lực; nếu chưa có thì hiển thị `LEGAL_REVIEW_REQUIRED`, không dùng để tính kết quả chính thức.

## 4. Kết luận pháp lý phải dùng làm baseline

Đối chiếu trực tiếp Nghị định 335/2025/NĐ-CP, đặc biệt các điều về tiêu chí chung, kết quả thực hiện nhiệm vụ, công chức lãnh đạo/quản lý, kỳ đánh giá và xếp loại. Baseline kỹ thuật phải phản ánh tối thiểu:

1. Đánh giá kết quả nhiệm vụ theo tháng hoặc quý trên sản phẩm/công việc được giao và đã quy đổi.
2. Ba thành phần của công chức không giữ chức vụ lãnh đạo, quản lý gồm:
   - số lượng;
   - chất lượng;
   - tiến độ.
3. Số lượng được xác định từ tỷ lệ sản phẩm/công việc hoàn thành đã quy đổi so với được giao đã quy đổi.
4. Chất lượng được xác định từ tỷ lệ sản phẩm/công việc hoàn thành đạt yêu cầu chất lượng đã quy đổi so với được giao; sai sót lớn ảnh hưởng chất lượng bị trừ theo quy định, trừ nguyên nhân khách quan được cấp có thẩm quyền xác nhận.
5. Tiến độ được xác định từ tỷ lệ sản phẩm/công việc hoàn thành đạt tiến độ trở lên đã quy đổi so với được giao; chậm tiến độ bị trừ theo quy định, trừ nguyên nhân khách quan được xác nhận.
6. Công chức lãnh đạo/quản lý phải bao gồm nhiệm vụ trực tiếp và nhiệm vụ chỉ đạo, điều hành, hướng dẫn, kiểm tra, giám sát, giải quyết vướng mắc trong phạm vi phụ trách; các thành phần d, đ, e phải lấy từ quy định áp dụng, không cho nhập tùy ý.
7. Ngưỡng xếp loại và tỷ lệ khống chế phải lấy theo căn cứ đang có hiệu lực và cấu hình đã phê duyệt; không tự suy diễn khi có nhiều nhóm công chức hoặc đơn vị quy mô nhỏ.

Không sử dụng bài báo, tài liệu quảng bá hoặc công thức cũ thay cho văn bản gốc. Nếu báo cáo nghiên cứu và văn bản gốc khác nhau, văn bản gốc thắng; ghi nhận chênh lệch vào ma trận pháp lý.

## 5. Sửa dứt điểm lỗi P0 công thức Phần II

### 5.1. Công thức chính thức duy nhất

Không dùng đồng thời hai chiến lược cho một phiếu. Sau khi đối chiếu văn bản, tạo một phiên bản engine duy nhất có mã, ví dụ:

```text
ND335_OFFICIAL_ABC_2026.08.1
```

Không dùng `WEIGHTED_DETAIL_SCORE` dựa trên `self_score × quantity × coefficient` làm công thức pháp lý chính nếu công thức đó không được quy định trực tiếp trong văn bản áp dụng.

Tách rõ:

- `self_score`: dữ liệu tự chấm/ý kiến của người dùng, chỉ là dữ liệu đầu vào hoặc tham khảo theo workflow;
- `accepted_quantity`: số lượng được nghiệm thu;
- `assigned_converted`: số lượng giao đã quy đổi;
- `completed_converted`: số lượng hoàn thành đạt điều kiện đã quy đổi;
- `quality_accepted_converted`: số lượng đạt chất lượng đã quy đổi;
- `on_time_converted`: số lượng hoàn thành đúng tiến độ đã quy đổi;
- `a`, `b`, `c`: các tỷ lệ phần trăm theo Nghị định;
- điểm kết quả nhiệm vụ: kết quả của công thức được xác định trong văn bản/cấu hình đã phê duyệt.

Phải chọn một biểu diễn chuẩn duy nhất trong code, API, database, màn hình và báo cáo. Không để một nơi tính theo tỷ lệ hoàn thành, nơi khác tính theo tổng điểm tự chấm.

### 5.2. Nguyên tắc tính toán

```text
assigned_converted = sum(assigned_quantity × coefficient_snapshot)
completed_converted = sum(accepted_quantity × coefficient_snapshot)
quality_accepted_converted = sum(accepted_quantity đạt chất lượng × coefficient_snapshot)
on_time_converted = sum(accepted_quantity đạt tiến độ × coefficient_snapshot)

a = tỷ lệ completed_converted / assigned_converted
b = tỷ lệ quality_accepted_converted / assigned_converted, áp dụng trừ điểm sai sót theo căn cứ
c = tỷ lệ on_time_converted / assigned_converted, áp dụng trừ điểm chậm theo căn cứ
```

Quy tắc an toàn:

- không chia cho 0;
- mẫu số bằng 0 phải là `INSUFFICIENT_DATA`, không tự đạt tối đa;
- không dùng `self_score` để thay thế số lượng/chất lượng/tiến độ đã nghiệm thu;
- không nhân hệ số/quy đổi hai lần;
- không cộng trùng cùng một sản phẩm ở các nguồn dữ liệu;
- không trừ điểm vì một lần yêu cầu bổ sung nếu chưa được xác định là lỗi chất lượng;
- miễn trừ chỉ khi có lý do, minh chứng, người có thẩm quyền xác nhận và audit log;
- tất cả kết quả trung gian phải trả về trong `auditFormula`.

### 5.3. Truy vết lỗi cũ

Trace toàn bộ đường đi:

```text
task detail → calculation service → save draft → recalculate API
→ database → form detail API → list API → dashboard/report
```

Không chấp nhận fix chỉ ở `EvaluationFormModal.tsx`. Backend là nguồn sự thật duy nhất. Frontend chỉ hiển thị kết quả backend và preview cùng phiên bản công thức.

## 6. Bổ sung dữ liệu nền tảng

### 6.1. Đối tượng đánh giá

Mỗi người phải có:

- mã cán bộ/công chức;
- đơn vị, chức vụ, VTVL đang hiệu lực;
- nhóm đối tượng pháp lý;
- người quản lý trực tiếp;
- thời gian hiệu lực;
- căn cứ phân loại.

Không đưa cán bộ, người hợp đồng hoặc nhóm không thuộc phạm vi NĐ 335 vào bảng xếp loại công chức nếu chưa có căn cứ áp dụng tương ứng. Việc phân loại Chủ tịch/Phó Chủ tịch và chức danh lãnh đạo phải được đối chiếu bản gốc, không tự suy diễn từ tên chức vụ.

### 6.2. Danh mục sản phẩm/công việc

Mỗi dòng phải có:

- mã, tên, mô tả và sản phẩm đầu ra;
- VTVL/đơn vị áp dụng;
- đơn vị tính;
- nhóm phức tạp tối đa N1–N5;
- điểm sản phẩm và sản phẩm chuẩn;
- hệ số quy đổi;
- tiêu chí chất lượng;
- tiêu chí tiến độ;
- yêu cầu minh chứng;
- căn cứ, người phê duyệt, phiên bản và ngày hiệu lực.

Giữ nguyên mã danh mục QĐ 283/danh mục công việc đang có. Không tự đổi mã, không ghi đè phiên bản đã dùng cho kỳ khóa.

### 6.3. Nhiệm vụ phát sinh, chuyển giao, phối hợp

- Việc phát sinh phải có lý do, căn cứ giao, sản phẩm, người duyệt và hệ số chờ phê duyệt.
- Việc nhiều người phải có một người phụ trách chính và tỷ trọng phối hợp tổng bằng 100%.
- Khi chuyển việc, lưu phần việc A đã thực hiện và phần B tiếp nhận; không mặc định đưa điểm A về 0 nếu A đã có phần việc được nghiệm thu.
- Việc kéo dài nhiều kỳ phải phân bổ theo kỳ; tổng phân bổ không vượt 100%.

## 7. Tiêu chí chung, lãnh đạo và xếp loại

- Tiêu chí chung phải lấy từ QĐ 283/bộ tiêu chí có hiệu lực của xã; không tự tạo bảng 8/8/8/6 nếu chưa được phê duyệt.
- Mọi chấm dưới tối đa phải có nhận xét và căn cứ theo quy định áp dụng.
- Người đứng đầu không tự chấm/sửa điểm của chính mình.
- Điểm của lãnh đạo phải tách nhiệm vụ cá nhân, nhiệm vụ chỉ đạo và các thành phần quản lý được quy định; không cho nhập d/đ/e nếu chưa có cấu hình hợp lệ.
- Xếp loại phải lưu ngưỡng, nhóm so sánh, tỷ lệ khống chế, tiêu chí phụ khi bằng điểm, phiên bản cấu hình và audit.
- Không xếp loại chính thức khi phiếu thiếu dữ liệu bắt buộc, thiếu minh chứng hoặc còn `LEGAL_REVIEW_REQUIRED`.

## 8. Workflow, phản hồi và hồ sơ

Trạng thái tối thiểu:

```text
DRAFT → SELF_ASSESSMENT → WAITING_REVIEW → WAITING_APPROVAL → APPROVED → LOCKED
```

Có thể dùng `REJECTED`, `NEEDS_REVISION`, `REOPENED` nếu được cấu hình.

Bắt buộc:

- lưu nháp;
- tự chấm;
- nhận xét/thẩm định;
- phê duyệt/từ chối;
- khóa kỳ;
- mở khóa có thẩm quyền, lý do và audit;
- phản hồi/phúc khảo trong hệ thống;
- xuất phiếu đối chiếu người → VTVL → nhiệm vụ → sản phẩm → hệ số → minh chứng → điểm → người duyệt.

Audit không được ghi đè lịch sử. Reset dữ liệu demo phải có cờ riêng, transaction và log; không chạy migration reset demo trên production.

## 9. Phân quyền backend

Rà soát và test toàn bộ:

- tạo/giao/sửa/xóa/chuyển nhiệm vụ;
- sửa số lượng, hệ số, deadline, minh chứng;
- tự chấm, nhận xét, thẩm định, phê duyệt;
- mở khóa kỳ;
- sửa danh mục, công thức, ngưỡng và căn cứ.

Không tin role/quyền do frontend gửi. Backend phải kiểm tra session, trạng thái tài khoản, quyền và phạm vi đơn vị/object-level authorization. Tài khoản Công chức thường không được giao việc, phê duyệt, sửa công thức hoặc sửa dữ liệu người khác.

## 10. Ma trận pháp lý bắt buộc trước khi code

Tạo/cập nhật `KPI_LEGAL_TRACEABILITY_MATRIX.md` với các cột:

| Nội dung | Văn bản | Điều/khoản/phụ lục/trang | Phân loại | Quy tắc | Model/API/config | Trạng thái |
|---|---|---|---|---|---|---|

Tối thiểu phải có các dòng: đối tượng, VTVL, kỳ, tiêu chí chung, kết quả nhiệm vụ, sản phẩm chuẩn, hệ số, số lượng, chất lượng, tiến độ, lãnh đạo, xếp loại, phản hồi, phê duyệt, khóa kỳ, hồ sơ và audit.

Nếu chưa xác định được điều/khoản/phụ lục/trang: ghi `LEGAL_REVIEW_REQUIRED`, không đánh dấu PASS và không bật phần tính chính thức.

## 11. Kiểm thử nghiệm thu tối thiểu

### Công thức P0

1. Một dòng tự chấm 5, giao 1, hoàn thành 1: Phần II không tự nhảy 70/70 nếu dữ liệu kết quả chưa tạo ra mức đó.
2. Hoàn thành 1 → 0: điểm giảm đúng.
3. Thay đổi hệ số: kết quả quy đổi thay đổi đúng.
4. Thêm/xóa dòng: tổng thay đổi đúng.
5. Sản phẩm chất lượng không đạt: b giảm đúng theo căn cứ.
6. Sản phẩm chậm: c giảm đúng theo căn cứ; có miễn trừ hợp lệ thì không trừ.
7. Mẫu số 0: `INSUFFICIENT_DATA`, không đạt tối đa.
8. Lưu nháp → tải lại → danh sách → dashboard → Excel: cùng kết quả backend.
9. Submit/review/approve/lock: không tự thay đổi điểm.
10. Kỳ khóa: mọi sửa trái phép bị chặn.

### Pháp lý/dữ liệu/quyền

11. Người không thuộc đối tượng NĐ 335 không xuất hiện trong bảng xếp loại công chức chính thức nếu chưa có căn cứ.
12. Công chức thường gọi API giao việc/phê duyệt/mở khóa: HTTP 403.
13. Nhiệm vụ phát sinh thiếu phê duyệt: không tính điểm chính thức.
14. Hệ số hết hiệu lực: không áp dụng hồi tố, cảnh báo phiên bản.
15. Điểm dưới tối đa thiếu nhận xét: HTTP 400 tiếng Việt.
16. Sửa sau khóa: phải có quyền mở khóa, lý do và audit log.
17. Không có minh chứng/không nghiệm thu: không tự coi là hoàn thành.
18. Dữ liệu dashboard và Excel lấy cùng kết quả đã tính từ backend.

Chạy tối thiểu:

```text
npm run build
npm run build:server
npm run build:client
test hiện có của module KPI và regression suite
```

## 12. Hồ sơ bàn giao

Cập nhật:

- `KPI_LEGAL_TRACEABILITY_MATRIX.md`;
- `KPI_MODULE_DEEP_SPEC.md`;
- tài liệu calculation engine và công thức phiên bản;
- `IMPLEMENTATION_NOTES.md`;
- test evidence/UAT report;
- danh sách `LEGAL_REVIEW_REQUIRED`;
- báo cáo dữ liệu bất nhất nếu hồ sơ nhân sự, VTVL, danh mục hoặc QĐ 283 có mâu thuẫn.

Không ghi “đã tuân thủ NĐ 335” nếu chưa có ma trận điều/khoản/phụ lục chứng minh. Kết thúc bằng báo cáo rõ: đã sửa, chưa sửa, cần xin ý kiến Sở Nội vụ/cấp có thẩm quyền, test nào đã chạy và commit/branch nào đã tạo.

## 13. Tài liệu chính thức tham chiếu khi kiểm tra

- [Nghị định 335/2025/NĐ-CP — Cổng Thông tin điện tử Chính phủ](https://vanban.chinhphu.vn/?docid=216292&pageid=27160)
- [Báo Điện tử Chính phủ: quy định đánh giá tiêu chí kết quả thực hiện nhiệm vụ từ 01/01/2026](https://xaydungchinhsach.chinhphu.vn/quy-dinh-danh-gia-tieu-chi-ket-qua-thuc-hien-nhiem-vu-voi-cong-chuc-ap-dung-tu-1-1-2026-119251225180250697.htm)

