# TÀI LIỆU ĐẶC TẢ CHỨC NĂNG

## MODULE QUẢN LÝ DỰ ÁN ĐẦU TƯ CÔNG
### (PHIÊN BẢN CẬP NHẬT PHÁP LÝ NĂM 2026 - CHUYỂN TIẾP NGHỊ ĐỊNH 193/2026 & THÔNG TƯ 73/2026/TT-BTC)

**Hệ thống:** Hệ thống Quản lý nhiệm vụ và đánh giá CBCC xã Nghĩa Lâm  
**Route:** `/projects`  
**Module liên kết:** Giải ngân vốn đầu tư công tại `/public-investment`  
**Phiên bản:** 2.0 (Legal Compliance 2026 Edition)  
**Ngày cập nhật:** 17/08/2026  
**Trạng thái:** Đặc tả quy trình vòng đời 16 bước, đối chiếu ma trận pháp lý và quy tắc chuyển tiếp từ ngày 01/7/2026

---

## 1. Mục tiêu và phạm vi

### 1.1. Mục tiêu

Nâng cấp module Quản lý Dự án từ bảng theo dõi tổng hợp thành hồ sơ điện tử quản lý toàn bộ vòng đời dự án đầu tư công 16 bước theo đúng quy định pháp luật hiện hành:

```text
Chủ trương đầu tư (HĐND & UBND)
→ Khảo sát & Lập BCKTKT (NĐ 175/2024/NĐ-CP)
→ Thẩm định & Phê duyệt Quyết định đầu tư (Luật ĐTC 58/2024/QH15)
→ Lựa chọn nhà thầu (NĐ 214/2025/NĐ-CP & Luật Đấu thầu 2023)
→ Hợp đồng & Thi công (NĐ 06/2021/NĐ-CP)
→ Bố trí vốn & Giải ngân (NĐ 254/2025/NĐ-CP & CV 10836/BTC-PTHT)
→ Nghiệm thu hoàn thành & Bàn giao tài sản
→ Thẩm tra & Phê duyệt quyết toán (NĐ 193/2026/NĐ-CP & TT 73/2026/TT-BTC từ 01/7/2026)
→ Bảo hành theo hợp đồng & Tất toán tài khoản KBNN
```

Module phải cung cấp dữ liệu phục vụ:

- điều hành hằng ngày của lãnh đạo Thường trực Đảng ủy, HĐND và UBND xã;
- theo dõi kế hoạch vốn và tiến độ thi công thực tế;
- kiểm soát chi, giải ngân theo mẫu báo cáo Công văn 10836/BTC-PTHT;
- quản lý đấu thầu, lựa chọn nhà thầu và hợp đồng kinh tế;
- quản lý nghiệm thu, bàn giao tài sản và quyết toán theo Thông tư 73/2026/TT-BTC;
- báo cáo định kỳ, kiểm toán và truy xuất hồ sơ điện tử.

### 1.2. Phạm vi không thay thế

Module `/projects` không thay thế module `/public-investment`. Module `/public-investment` tiếp tục là nơi quản lý dữ liệu tài chính giải ngân hiện có. Module `/projects` quản lý hồ sơ vòng đời và tham chiếu số liệu tài chính trực tiếp từ nguồn chính (không tạo bản sao gây lệch số liệu).

---

## 1.3. Căn Cứ Pháp Lý Bắt Buộc Áp Dụng (Cập Nhật 2026)

1. **Luật Đầu tư công số 58/2024/QH15** (Ban hành 29/11/2024, hiệu lực từ 01/01/2025).
2. **Luật Xây dựng 2014 & Luật Sửa đổi 2020**; **Nghị định số 175/2024/NĐ-CP** ngày 30/12/2024 về quản lý hoạt động đầu tư xây dựng (**thay thế Nghị định 15/2021/NĐ-CP**).
3. **Luật Đấu thầu số 22/2023/QH15** & **Nghị định số 214/2025/NĐ-CP** về lựa chọn nhà thầu.
4. **Nghị định số 254/2025/NĐ-CP** về quản lý, thanh toán vốn đầu tư công (**thay thế Nghị định 99/2021/NĐ-CP và bãi bỏ Điều 6 Nghị định 125/2025/NĐ-CP**).
5. **Nghị định số 193/2026/NĐ-CP** có hiệu lực từ ngày **01/7/2026** về quyết toán vốn đầu tư dự án hoàn thành.
6. **Thông tư số 73/2026/TT-BTC** của Bộ Tài chính có hiệu lực từ ngày **01/7/2026** về hệ thống biểu mẫu quyết toán vốn đầu tư dự án hoàn thành (Mẫu 01/QTDA, 02/QTDA, 03/QTDA).
7. **Công văn số 10836/BTC-PTHT** ngày 23/7/2026 của Bộ Tài chính về báo cáo nhanh phân bổ và giải ngân vốn ĐTC.
8. **Quyết định số 1261/QĐ-UBND** và **Công văn số 3092/UBND-KT** của UBND tỉnh Nghệ An về phân cấp quản lý đầu tư công.
9. **Nghị định số 06/2021/NĐ-CP** (sửa đổi bởi Nghị định 35/2023/NĐ-CP) về quản lý chất lượng và thời hạn bảo hành công trình xây dựng (Điều 28).
10. **Thông tư số 23/2023/TT-BTC** về quản lý tài sản cố định cấp xã.

---

## 2. Hiện trạng và vấn đề cần xử lý

### 2.1. Hiện trạng

Module hiện có đã có:

- mã dự án;
- tên công trình;
- chủ đầu tư;
- nguồn vốn;
- kế hoạch/phân bổ;
- đã giải ngân và tỷ lệ giải ngân;
- nhà thầu;
- tiến độ thi công;
- vướng mắc;
- trạng thái nghiệm thu/quyết toán;
- bảng danh sách và dashboard tổng hợp.

### 2.2. Lỗi và bất cập

| Mức độ | Nội dung | Tác động |
|---|---|---|
| Cao | Mã dự án không chuẩn như `DA`, không theo mẫu duy nhất | Khó liên kết, tìm kiếm và báo cáo |
| Cao | Nhà thầu và số hợp đồng đang gộp hoặc hiển thị bất thường như `09` | Sai lệch dữ liệu hợp đồng, khó truy vết |
| Cao | Tiến độ/giải ngân 100% nhưng vẫn “chưa nghiệm thu/chưa quyết toán” và giai đoạn hiển thị chưa đúng | Báo cáo điều hành sai trạng thái |
| Cao | Chưa kiểm soát chênh lệch giữa tiến độ và giải ngân | Có nguy cơ giải ngân cao hơn thực hiện nhưng không cảnh báo |
| Trung bình | Thiếu bộ lọc năm vốn, nguồn vốn, địa bàn, chủ đầu tư, cán bộ phụ trách, giai đoạn | Khó tổng hợp chuyên đề |
| Trung bình | Chỉ có chi tiết/xóa, thiếu quy trình chỉnh sửa có kiểm soát | Rủi ro mất dữ liệu, thiếu audit |
| Trung bình | Xuất Excel chưa có kỳ, phạm vi và mẫu báo cáo | Khó dùng làm báo cáo chính thức |
| Thấp | Thiếu tổng mức đầu tư, giá trị hợp đồng, giá trị nghiệm thu, vốn còn lại, nợ đọng | Chưa đủ chỉ số điều hành |

---

## 3. Nguyên tắc dữ liệu và liên kết

### 3.1. Nguồn dữ liệu chính

| Nhóm dữ liệu | Bảng/module nguồn chính |
|---|---|
| Kế hoạch vốn, phân bổ, giải ngân, tỷ lệ giải ngân | `public_investment_projects` và bảng giải ngân chi tiết |
| Chủ trương, quyết định đầu tư | `projects` và `project_documents` |
| Đấu thầu, gói thầu, hợp đồng | `project_procurement_packages`, `project_contracts` |
| WBS, công việc và milestones | `project_work_items`, `project_milestones` |
| Nghiệm thu, bàn giao | `project_acceptance_records` |
| Quyết toán, bảo hành, tất toán | `project_settlement_records` và hồ sơ liên quan |
| Người dùng, đơn vị, quyền | RBAC dùng chung của hệ thống |

Không lưu bản sao các trường tài chính trong `projects` nếu đã có ở `public_investment_projects`.

### 3.2. Khóa liên kết

```text
projects.investment_project_id
    → public_investment_projects.id
```

Quy định:

- một bản ghi giải ngân chỉ liên kết tối đa một hồ sơ dự án;
- `project_code` duy nhất trong phạm vi đơn vị/tenant;
- không đổi mã sau khi phát sinh vốn, hợp đồng hoặc hồ sơ nếu chưa có quy trình đổi mã;
- liên kết/hủy liên kết phải ghi audit log;
- sử dụng transaction và optimistic locking để tránh ghi đè.

### 3.3. Đồng bộ có kiểm soát

Không đồng bộ hai chiều tất cả các trường.

- `/public-investment` là nguồn chính của kế hoạch vốn, phân bổ, giải ngân và tỷ lệ giải ngân.
- `/projects` là nguồn chính của chủ trương, pháp lý, đấu thầu, hợp đồng, milestones, nghiệm thu, bàn giao, quyết toán và bảo hành.
- `/projects` chỉ đọc dữ liệu tài chính bằng join/service backend.
- Khi tạo dự án mới có thể liên kết công trình đã có hoặc tạo đồng thời hai bản ghi trong một transaction.
- Không dùng hai request frontend rời rạc để đồng bộ.
- Xung đột dữ liệu phải xử lý bằng version/transaction và ghi audit log.

---

## 4. Chuẩn hóa và làm sạch dữ liệu hiện có

### 4.1. Mã dự án

- Không chấp nhận mã rỗng, mã `DA`, mã trùng hoặc mã không phù hợp quy tắc cấu hình.
- Mã mới tự sinh theo mẫu cấu hình, ví dụ `DA-2026-01`.
- Không tự sửa mã cũ nếu chưa đối soát.
- Bản ghi bất thường đưa vào `DATA_REVIEW_REQUIRED`, giữ mã legacy và yêu cầu người có thẩm quyền xác nhận mã chuẩn.
- Có unique constraint ở database và validation ở backend.

### 4.2. Nhà thầu và hợp đồng

Không dùng trường gộp “Nhà thầu / Số HĐ” làm dữ liệu gốc. Tách riêng:

- tên nhà thầu;
- số hợp đồng;
- ngày ký;
- giá trị hợp đồng;
- thời gian thực hiện;
- bảo lãnh;
- trạng thái hợp đồng.

Giá trị bất thường như `09` phải đánh dấu `DATA_REVIEW_REQUIRED`, không tự đoán dữ liệu.

### 4.3. Trạng thái vòng đời

Tiến độ 100% hoặc giải ngân 100% không đồng nghĩa đã nghiệm thu, bàn giao hoặc quyết toán.

Ví dụ:

```text
Hoàn thành thi công — chờ nghiệm thu
```

Phải tách riêng:

- tiến độ thi công;
- nghiệm thu;
- bàn giao;
- quyết toán;
- giải ngân.

---

## 5. Mô hình dữ liệu

### 5.1. Bảng `projects`

| Trường | Mô tả |
|---|---|
| `id` | Khóa chính |
| `investment_project_id` | FK tới `public_investment_projects.id`, unique, nullable khi độc lập |
| `project_code` | Mã dự án duy nhất, tự sinh |
| `project_name` | Tên dự án |
| `project_type` | Loại công trình/lĩnh vực |
| `investment_group` | Nhóm A/B/C theo căn cứ áp dụng |
| `location` | Địa điểm |
| `scale` | Quy mô |
| `objective` | Mục tiêu |
| `investor_name` | Chủ đầu tư |
| `management_unit` | Ban quản lý/đơn vị quản lý |
| `beneficiary_unit` | Đơn vị thụ hưởng |
| `project_manager_id` | Cán bộ phụ trách |
| `supervisor_unit` | Đơn vị tư vấn giám sát |
| `approval_decision_no/date` | Quyết định chủ trương/phê duyệt |
| `approving_authority` | Cấp phê duyệt |
| `design_approval_no` | Quyết định thiết kế - dự toán |
| `start_date` | Ngày khởi công |
| `planned_end_date` | Ngày hoàn thành kế hoạch/hợp đồng |
| `actual_end_date` | Ngày hoàn thành thực tế |
| `warranty_end_date` | Thời hạn bảo hành |
| `acceptance_status` | Trạng thái nghiệm thu |
| `acceptance_date` | Ngày nghiệm thu |
| `settlement_status` | Trạng thái quyết toán |
| `settlement_value` | Giá trị quyết toán được duyệt |
| `settlement_date` | Ngày phê duyệt quyết toán |
| `handover_date` | Ngày bàn giao |
| `lifecycle_status` | Giai đoạn vòng đời |
| `version` | Khóa lạc quan |
| `created_at/updated_at` | Thời gian |

Không lưu bản sao `planned_capital`, `allocated_capital`, `disbursed_amount`, `disbursement_rate` hoặc `actual_progress_percent` nếu các trường này đã thuộc bảng nguồn giải ngân.

### 5.2. Bảng `project_milestones`

- `id`;
- `project_id`;
- `milestone_name`;
- `milestone_type`;
- `planned_date`;
- `actual_date`;
- `status`;
- `note`;
- `evidence_document_id`;
- `created_by/updated_by`;
- `created_at/updated_at`.

### 5.3. Bảng `project_work_items`

Quản lý WBS:

- `project_id`, `parent_id`;
- đầu việc;
- đơn vị/người phụ trách;
- ngày bắt đầu/kết thúc kế hoạch;
- ngày thực tế;
- tỷ lệ hoàn thành;
- trạng thái;
- minh chứng;
- vướng mắc;
- ghi chú.

### 5.4. Bảng `project_documents`

Quản lý hồ sơ PDF, Word, Excel, ảnh:

- loại tài liệu;
- số, ngày, cơ quan ban hành;
- file/storage key;
- phiên bản;
- người tải lên;
- checksum nếu có;
- thời gian tạo/cập nhật.

### 5.5. Bảng `project_funding_plans`

Quản lý kế hoạch vốn từng năm:

- năm ngân sách;
- nguồn vốn;
- kế hoạch;
- phân bổ;
- điều chỉnh;
- vốn bị hủy;
- vốn còn lại;
- quyết định/căn cứ.

### 5.6. Bảng `project_disbursements`

Quản lý từng đợt giải ngân:

- số chứng từ;
- ngày thanh toán;
- giá trị;
- nguồn vốn;
- khối lượng tương ứng;
- trạng thái kiểm soát chi;
- minh chứng;
- người phê duyệt.

### 5.7. Bảng `project_procurement_packages`

Quản lý nhiều gói thầu trong một dự án:

- tên gói;
- quyết định kế hoạch lựa chọn nhà thầu;
- hình thức lựa chọn;
- giá gói thầu;
- giá trúng thầu;
- ngày lựa chọn;
- trạng thái;
- tài liệu.

### 5.8. Bảng `project_contracts`

Quản lý nhiều hợp đồng/phụ lục:

- `project_id`, `package_id`;
- nhà thầu;
- số hợp đồng;
- ngày ký;
- giá trị;
- thời gian thực hiện;
- bảo lãnh;
- phụ lục;
- trạng thái;
- tài liệu.

### 5.9. Bảng `project_acceptance_records`

Quản lý nghiệm thu từng phần/hoàn thành:

- loại/đợt nghiệm thu;
- ngày nghiệm thu;
- giá trị khối lượng;
- kết luận;
- thành phần ký;
- trạng thái;
- nguyên nhân không đạt;
- hạn khắc phục;
- kết quả khắc phục;
- biên bản và ảnh hiện trường.

### 5.10. Bảng `project_settlement_records`

Quản lý quyết toán:

- ngày trình;
- cơ quan thẩm tra;
- giá trị đề nghị;
- giá trị được duyệt;
- chênh lệch;
- số/ngày quyết định;
- bàn giao tài sản;
- tình trạng tất toán tài khoản;
- hồ sơ kèm theo.

---

## 6. Quy trình vòng đời

Các trạng thái tối thiểu:

```text
PREPARATION
→ INVESTMENT_APPROVED
→ PROCUREMENT
→ CONTRACT_SIGNED
→ CONSTRUCTION
→ PARTIAL_ACCEPTANCE
→ COMPLETION_ACCEPTANCE
→ HANDOVER
→ SETTLEMENT
→ WARRANTY
→ CLOSED
```

Mỗi lần chuyển trạng thái phải ghi:

- người thực hiện;
- thời gian;
- trạng thái trước/sau;
- văn bản căn cứ;
- ý kiến;
- file minh chứng.

Ràng buộc:

- không `COMPLETION_ACCEPTANCE` nếu thiếu hồ sơ nghiệm thu hoàn thành;
- không `HANDOVER` nếu chưa nghiệm thu hoàn thành;
- không `SETTLEMENT` nếu chưa nghiệm thu hoàn thành;
- không `CLOSED` nếu chưa hoàn tất quyết toán/tất toán theo cấu hình;
- nếu nghiệm thu không đạt, bắt buộc nguyên nhân và kế hoạch khắc phục;
- không tự chuyển trạng thái chỉ vì tiến độ hoặc giải ngân đạt 100%.

### 6.1. Quy trình thực hiện dự án đầu tư công cấp xã — 16 bước kiểm soát

Quy trình dưới đây áp dụng cho phạm vi nội bộ được cung cấp: dự án nhóm C, công trình lập Báo cáo kinh tế - kỹ thuật tại UBND xã Nghĩa Lâm. Khi áp dụng cho loại dự án khác, hệ thống phải dùng cấu hình quy trình tương ứng và đánh dấu `LEGAL_REVIEW_REQUIRED` nếu chưa xác định căn cứ, thẩm quyền hoặc phân cấp.

Mỗi bước là một cổng kiểm soát. Chỉ được chuyển sang bước tiếp theo khi đã có sản phẩm bắt buộc, đúng chủ thể, đúng thời điểm và đủ tài liệu minh chứng.

| Bước | Nội dung | Chủ thể/sản phẩm chính | Điều kiện khóa bắt buộc |
|---:|---|---|---|
| 1 | Đưa dự án vào kế hoạch đầu tư công | HĐND xã ban hành Nghị quyết kế hoạch hoặc điều chỉnh danh mục | Chưa có trong danh mục được thông qua thì không được triển khai bước tiếp theo |
| 2 | Lập và thẩm định Báo cáo đề xuất chủ trương đầu tư | Phòng Kinh tế/BQLDA lập; Hội đồng thẩm định thẩm định; có quyết định thành lập Hội đồng và báo cáo thẩm định | Quyết định thành lập Hội đồng phải có trước báo cáo thẩm định |
| 3 | Quyết định chủ trương đầu tư | UBND xã quyết định theo tập thể; hồ sơ có biên bản họp hoặc phiếu lấy ý kiến thành viên | Chốt sự cần thiết, quy mô sơ bộ, tổng mức dự kiến, từng nguồn vốn và thời gian; chưa phải căn cứ giải ngân |
| 4 | Lựa chọn đơn vị tư vấn khảo sát, lập Báo cáo kinh tế - kỹ thuật | Chủ đầu tư/BQLDA ký hợp đồng tư vấn theo hình thức hợp lệ | Có hồ sơ lựa chọn và hợp đồng tư vấn trước khi triển khai khảo sát |
| 5 | Phê duyệt nhiệm vụ khảo sát xây dựng | Chủ đầu tư; sản phẩm là quyết định/phê duyệt nhiệm vụ khảo sát | Phải có mục đích, phạm vi, tiêu chuẩn, khối lượng và thời gian; phải duyệt trước phương án kỹ thuật |
| 6 | Phê duyệt phương án kỹ thuật khảo sát | Chủ đầu tư; có thể gộp bước 5 và 6 trong một quyết định nhưng phải đủ hai nội dung | Phải duyệt trước khảo sát thực địa; có phương pháp, thiết bị, tiêu chuẩn, tiến độ và kiểm soát chất lượng |
| 7 | Thực hiện khảo sát và lập Báo cáo kinh tế - kỹ thuật | Tư vấn lập thuyết minh, thiết kế bản vẽ thi công, dự toán; chủ đầu tư nghiệm thu kết quả khảo sát | Không dùng hồ sơ chưa nghiệm thu làm căn cứ thẩm định |
| 8 | Thẩm định Báo cáo kinh tế - kỹ thuật, thiết kế và dự toán | Phòng Kinh tế chủ trì; báo cáo thẩm định | Kiểm tra khối lượng, đơn giá, định mức, cơ cấu chi phí; dự toán không vượt tổng mức đã chốt ở bước 3 nếu chưa điều chỉnh chủ trương |
| 9 | Phê duyệt dự án/phê duyệt Báo cáo kinh tế - kỹ thuật | Chủ tịch UBND xã; quyết định phê duyệt Báo cáo kinh tế - kỹ thuật, thiết kế và dự toán | Đây là quyết định đầu tư đối với công trình chỉ lập Báo cáo kinh tế - kỹ thuật; là điều kiện để mở mã dự án và kiểm soát chi |
| 10 | Phê duyệt kế hoạch lựa chọn nhà thầu | Chủ tịch UBND xã theo thẩm quyền; kế hoạch có gói, giá, nguồn, hình thức, phương thức, thời gian, loại và thời hạn hợp đồng | Phải đăng tải theo quy định áp dụng; không tổ chức lựa chọn khi kế hoạch chưa được phê duyệt |
| 11 | Lựa chọn nhà thầu, phê duyệt kết quả và ký hợp đồng | Chủ đầu tư tổ chức; Chủ tịch phê duyệt kết quả theo thẩm quyền; ký hợp đồng | Quản lý tối thiểu gói thi công, tư vấn giám sát và các gói cần thiết; không cho thi công khi chưa có hợp đồng hợp lệ |
| 12 | Bố trí kế hoạch vốn hằng năm và giải ngân | Phòng Kinh tế, kế toán xã, Kho bạc Nhà nước khu vực phối hợp | Dự án phải có quyết định đầu tư trước thời điểm giao kế hoạch vốn; có hồ sơ mở mã và đăng ký kiểm soát chi |
| 13 | Thi công và quản lý chất lượng | Chủ đầu tư/BQLDA, nhà thầu, tư vấn giám sát; Ban Giám sát đầu tư của cộng đồng giám sát | Có nhật ký, giám sát, nghiệm thu công việc/giai đoạn; phát sinh khối lượng phải được chấp thuận trước khi thi công |
| 14 | Nghiệm thu hoàn thành và bàn giao đưa vào sử dụng | Chủ đầu tư và các bên có thẩm quyền; biên bản nghiệm thu hoàn thành, hồ sơ hoàn công và hồ sơ bàn giao | Không chuyển hoàn thành/nghiệm thu/bàn giao khi thiếu biên bản và hồ sơ hoàn công; ngày nghiệm thu là mốc kiểm soát quyết toán |
| 15 | Lập, thẩm tra và phê duyệt quyết toán | Chủ đầu tư lập; đơn vị chức năng thẩm tra; Chủ tịch UBND xã phê duyệt | Phải có hồ sơ quyết toán, giá trị đề nghị/được duyệt, chênh lệch và quyết định phê duyệt |
| 16 | Bàn giao quản lý, khai thác, bảo hành, bảo trì và kết thúc | Đơn vị tiếp nhận quản lý; chủ đầu tư theo dõi bảo hành; hồ sơ bàn giao/tất toán | Chỉ hoàn trả bảo hành khi hết thời hạn và không còn nghĩa vụ khắc phục; hoàn tất tài sản, tài khoản và lưu trữ hồ sơ |

#### 6.1.1. Bảng kiểm soát chủ thể ký

Hệ thống phải lưu chủ thể, thẩm quyền và thể thức ký dự kiến theo cấu hình đã được phê duyệt. Không tự quyết định thẩm quyền chỉ dựa trên role phần mềm.

| Bước/văn bản | Chủ thể theo quy trình nội bộ | Thể thức/ghi chú kiểm soát |
|---|---|---|
| 1. Nghị quyết kế hoạch đầu tư công | HĐND xã | TM. HĐND - CHỦ TỊCH |
| 2. Quyết định thành lập Hội đồng thẩm định | UBND xã | TM. UBND - CHỦ TỊCH |
| 3. Quyết định chủ trương đầu tư | UBND xã theo tập thể | TM. UBND - CHỦ TỊCH; bắt buộc biên bản họp hoặc phiếu lấy ý kiến |
| 5-6. Nhiệm vụ/phương án khảo sát | Chủ đầu tư; Chủ tịch hoặc người được ủy quyền hợp lệ | Phải lưu căn cứ ủy quyền nếu có |
| 9. Phê duyệt Báo cáo kinh tế - kỹ thuật | Chủ tịch UBND xã | CHỦ TỊCH; là quyết định đầu tư trong phạm vi áp dụng |
| 10. Kế hoạch lựa chọn nhà thầu | Chủ tịch UBND xã theo thẩm quyền | Kiểm tra phân cấp và đăng tải |
| 11. Kết quả lựa chọn nhà thầu | Chủ đầu tư tổ chức; Chủ tịch phê duyệt theo thẩm quyền | Lưu quyết định và hợp đồng |
| 15. Quyết toán | Chủ tịch UBND xã | Lưu hồ sơ thẩm tra và quyết định phê duyệt |

Phân biệt bắt buộc: chủ trương đầu tư là quyết định của tập thể UBND xã; từ quyết định đầu tư trở đi phải xác định đúng thẩm quyền cá nhân/tập thể theo pháp luật và phân cấp hiện hành. Nếu chưa xác minh được căn cứ cụ thể, hiển thị `LEGAL_REVIEW_REQUIRED` và không cho phát hành văn bản từ hệ thống.

#### 6.1.2. Các điều kiện khóa không được bỏ qua

- Chưa có Nghị quyết HĐND về danh mục/kế hoạch: không cho tạo bước chủ trương chính thức.
- Chưa có quyết định thành lập Hội đồng: không cho xác nhận báo cáo thẩm định chủ trương.
- Chưa có biên bản họp/phiếu ý kiến tập thể ở bước 3: không cho hoàn tất chủ trương đầu tư.
- Chủ trương đầu tư chỉ là căn cứ cho phép nghiên cứu, không được coi là căn cứ giải ngân.
- Dự toán vượt tổng mức đã chốt: yêu cầu điều chỉnh chủ trương trước khi phê duyệt Báo cáo kinh tế - kỹ thuật.
- Chưa có quyết định phê duyệt Báo cáo kinh tế - kỹ thuật/quyết định đầu tư: cảnh báo chặn bố trí vốn, mở mã và giải ngân.
- Chưa có kế hoạch lựa chọn nhà thầu: không cho chuyển sang lựa chọn nhà thầu.
- Chưa có hợp đồng hợp lệ: không cho chuyển sang thi công.
- Thi công trước quyết định đầu tư hoặc chưa bố trí vốn: cảnh báo nghiêm trọng, khóa chuyển bước và tạo nhiệm vụ xử lý.
- Phát sinh khối lượng phải có văn bản chấp thuận trước khi thi công; không hợp thức hóa sau.

#### 6.1.3. Checklist điện tử trước khi Chủ tịch ký

Hệ thống phải cung cấp checklist theo từng loại văn bản:

- Công trình đã có trong Nghị quyết HĐND xã chưa?
- Văn bản thuộc thẩm quyền tập thể hay cá nhân; thể thức ký đúng chưa?
- Chủ trương đã có biên bản họp/phiếu lấy ý kiến chưa?
- Căn cứ đã bao gồm Luật Đầu tư công và văn bản sửa đổi/bổ sung còn hiệu lực chưa?
- Số hiệu, năm ban hành và hiệu lực văn bản đã được xác minh chưa?
- Nguồn vốn đã tách rõ từng nguồn và số tiền chưa?
- Tổng mức, dự toán, hợp đồng và quyết toán có vượt bước trước không?
- Các bước trước đã hoàn thành và có ngày tháng hợp lý chưa?
- Đơn vị chủ trì, phối hợp, thời hạn và sản phẩm đã rõ chưa?
- Hồ sơ gửi Kho bạc, kế toán - tài chính và các cơ quan liên quan đã đầy đủ chưa?

Mỗi mục phải có trạng thái `Đạt`, `Chưa đạt`, `Không áp dụng` hoặc `LEGAL_REVIEW_REQUIRED`, người xác nhận và thời gian xác nhận.

#### 6.1.4. Nhóm rủi ro phải cảnh báo người đứng đầu

Hệ thống phải cảnh báo nổi bật khi phát hiện:

1. Nhầm thẩm quyền hoặc thể thức ký giữa quyết định tập thể và quyết định cá nhân.
2. Dự toán vượt tổng mức đầu tư/chủ trương đã duyệt.
3. Thiếu hồ sơ ý kiến tập thể UBND tại bước chủ trương.
4. Thi công trước quyết định đầu tư hoặc chưa bố trí vốn, có nguy cơ nợ đọng xây dựng cơ bản.

Các cảnh báo chỉ hỗ trợ kiểm soát, không thay thế thẩm định pháp lý hoặc quyết định của cơ quan có thẩm quyền.

#### 6.1.5. Hồ sơ, trạng thái và audit của từng bước

Mỗi bước trong 16 bước phải có:

- mã bước và phiên bản quy trình;
- trạng thái `NOT_STARTED`, `IN_PROGRESS`, `WAITING_REVIEW`, `APPROVED`, `REJECTED`, `BLOCKED`, `COMPLETED`;
- đơn vị chủ trì/phối hợp;
- người xử lý;
- sản phẩm đầu ra;
- văn bản căn cứ;
- tệp minh chứng;
- ngày bắt đầu/kết thúc;
- ý kiến thẩm định/phê duyệt;
- điều kiện khóa/chuyển bước;
- audit log trước/sau.

Không cho xóa lịch sử bước. Nếu quy trình hoặc phân cấp thay đổi, tạo phiên bản mới, không sửa hồi tố quy trình đã dùng cho dự án cũ.

---

## 7. Kiểm soát vốn và tiến độ

### 7.1. Validation tài chính

- Không cho số âm.
- Không cho giải ngân vượt kế hoạch/phân bổ nếu chưa có quyết định điều chỉnh.
- Không cho giải ngân vượt giá trị hợp đồng nếu chưa có căn cứ hợp lệ.
- Không cho giá trị nghiệm thu vượt quy tắc hợp đồng/điều chỉnh.
- Không cho quyết toán âm.
- Tất cả kiểm tra ở backend, frontend chỉ hỗ trợ.

### 7.2. Cảnh báo chênh lệch

```text
progress_gap = disbursement_rate - actual_progress_percent
```

Cấu hình ngưỡng cảnh báo:

- giải ngân cao hơn tiến độ vượt ngưỡng;
- giải ngân 100% nhưng chưa nghiệm thu;
- tiến độ 100% nhưng chưa nghiệm thu;
- nghiệm thu nhưng chưa bàn giao;
- bàn giao nhưng chưa quyết toán;
- vốn đã bố trí nhưng chưa giải ngân;
- hoàn thành khối lượng nhưng chưa thanh toán.

Cảnh báo không tự kết luận sai phạm; phải yêu cầu nhập nguyên nhân, căn cứ và người xác nhận.

---

## 8. Giao diện

### 8.1. Danh sách dự án

Cột:

```text
Mã DA | Tên công trình | Nhóm DA | Chủ đầu tư | Nhà thầu
Giai đoạn | % Tiến độ | % Giải ngân | Trạng thái | Hành động
```

Bộ lọc:

- năm kế hoạch vốn;
- nguồn vốn;
- địa bàn;
- chủ đầu tư/ban quản lý;
- cán bộ phụ trách;
- nhóm dự án;
- lĩnh vực;
- giai đoạn vòng đời;
- nghiệm thu/quyết toán;
- cảnh báo tiến độ/giải ngân.

### 8.2. Hồ sơ chi tiết dạng tab

1. Tổng quan;
2. Pháp lý/chủ trương;
3. Đấu thầu & hợp đồng;
4. Kế hoạch vốn & giải ngân;
5. WBS/milestones/Gantt;
6. Nghiệm thu & bàn giao;
7. Quyết toán & bảo hành;
8. Kho hồ sơ;
9. Lịch sử/audit log.

### 8.3. Tạo dự án

Wizard:

1. Thông tin chung và liên kết công trình giải ngân có sẵn;
2. Pháp lý và chủ trương;
3. Đấu thầu/hợp đồng;
4. Xác nhận và lưu transaction.

### 8.4. Thao tác xóa

Thay “Xóa dự án” bằng:

- Ngừng theo dõi;
- Lưu trữ;
- Hủy bản nháp.

Chỉ bản nháp chưa phát sinh vốn, hợp đồng hoặc hồ sơ mới được xóa; bắt buộc xác nhận và audit log.

---

## 9. Phân quyền RBAC

### 9.1. Ma trận quyền

| Vai trò | Xem | Tạo/sửa | Trường nhạy cảm | Phê duyệt |
|---|---|---|---|---|
| Công chức thường | Chỉ dự án được gán nếu cấu hình cho phép | Không hoặc chỉ phần việc được cấp | Không | Không |
| Cán bộ chuyên môn | Trong phạm vi được giao | Tạo/cập nhật phần việc | Không tự sửa pháp lý/hợp đồng/quyết toán | Không |
| Kế toán | Dữ liệu tài chính trong phạm vi | Kế hoạch vốn/chứng từ/giải ngân theo quyền | Không sửa hồ sơ pháp lý | Theo thẩm quyền |
| Cán bộ quản lý dự án | Dự án phụ trách | Tiến độ/WBS/vướng mắc | Không tự sửa quyết định/quyết toán | Không |
| Trưởng bộ phận | Trong phạm vi đơn vị | Có theo thẩm quyền | Theo cấu hình | Theo thẩm quyền |
| Lãnh đạo UBND | Toàn xã | Có | Có theo thẩm quyền | Có |
| Văn thư | Hồ sơ được phân công | Tải/quản lý phiên bản tài liệu | Không sửa số liệu nghiệp vụ | Không |
| Quản trị viên | Theo permission kỹ thuật | Không mặc nhiên | Không mặc nhiên | Không |

Permission tập trung tối thiểu:

```text
PROJECT_READ
PROJECT_READ_ASSIGNED
PROJECT_CREATE
PROJECT_UPDATE
PROJECT_DELETE_DRAFT
PROJECT_UPDATE_APPROVAL
PROJECT_UPDATE_CONTRACT
PROJECT_UPDATE_FUNDING
PROJECT_UPDATE_PROGRESS
PROJECT_UPDATE_ACCEPTANCE
PROJECT_UPDATE_SETTLEMENT
PROJECT_MILESTONE_MANAGE
PROJECT_DOCUMENT_MANAGE
PROJECT_EXPORT
PROJECT_APPROVE
```

Backend phải kiểm tra session/JWT, permission và phạm vi đơn vị/dự án. Không tin role/permission do client gửi.

Route `/projects`, API và request trực tiếp qua cURL/Network/Postman đều phải chịu RBAC.

---

## 10. Audit log và hồ sơ điện tử

Ghi log cho:

- tạo/sửa/lưu trữ/liên kết;
- cập nhật vốn/giải ngân;
- cập nhật tiến độ/milestone;
- chuyển trạng thái;
- đấu thầu/hợp đồng;
- nghiệm thu/bàn giao/quyết toán;
- tải/xóa/thay phiên bản tài liệu;
- thay đổi người phụ trách;
- request bị từ chối do thiếu quyền.

Audit phải có:

- người thao tác;
- vai trò;
- thời gian;
- bản ghi;
- giá trị trước/sau;
- lý do;
- file minh chứng;
- request/correlation id nếu có.

Không xóa hoặc ghi đè lịch sử.

---

## 11. API

### Dự án

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
GET    /api/projects/dashboard
GET    /api/projects/export
```

### Milestones/WBS

```text
POST   /api/projects/:id/milestones
PUT    /api/projects/:id/milestones/:milestoneId
PATCH  /api/projects/:id/milestones/:milestoneId
DELETE /api/projects/:id/milestones/:milestoneId
POST   /api/projects/:id/work-items
PUT    /api/projects/:id/work-items/:itemId
DELETE /api/projects/:id/work-items/:itemId
```

### Hồ sơ

```text
GET    /api/projects/:id/documents
POST   /api/projects/:id/documents
PUT    /api/projects/:id/documents/:documentId
DELETE /api/projects/:id/documents/:documentId
GET    /api/projects/:id/audit-log
```

Rà soát API hiện có trước khi tạo route trùng chức năng.

---

## 12. Dashboard và báo cáo

Dashboard tối thiểu:

- số dự án theo A/B/C;
- chuẩn bị/thi công/chậm/hoàn thành/chờ nghiệm thu/chờ quyết toán;
- tổng mức đầu tư;
- kế hoạch/phân bổ/đã giải ngân;
- vốn còn lại;
- vốn hủy/điều chỉnh;
- giá trị hợp đồng;
- giá trị nghiệm thu;
- nợ đọng/chưa thanh toán;
- dự án sắp nghiệm thu/bàn giao/quyết toán/bảo hành hết hạn.

Báo cáo Excel/PDF phải chọn được:

- tháng/quý/năm;
- phạm vi đơn vị/địa bàn;
- nguồn vốn;
- nhóm dự án;
- trạng thái;
- mẫu báo cáo.

Mẫu báo cáo:

- danh mục dự án A/B/C;
- kế hoạch vốn và giải ngân;
- dự án chậm tiến độ/chậm giải ngân;
- chưa nghiệm thu/chưa quyết toán;
- chênh lệch đầu tư/hợp đồng/nghiệm thu/giải ngân;
- hợp đồng/bảo lãnh/bảo hành sắp hết hạn;
- khối lượng hoàn thành chưa thanh toán;
- vốn đã bố trí chưa giải ngân.

Số liệu xuất phải khớp dashboard và ghi rõ thời điểm/phạm vi dữ liệu.

---

## 13. API/data validation

Backend phải kiểm tra:

- mã dự án;
- enum trạng thái;
- số tiền không âm;
- tiến độ từ 0 đến 100;
- quan hệ giải ngân/kế hoạch/hợp đồng;
- thứ tự ngày tháng;
- dữ liệu bắt buộc theo trạng thái;
- file và loại tài liệu;
- quyền thao tác.

Dữ liệu sai trả HTTP 400 tiếng Việt; thiếu quyền trả HTTP 403; xóa bản ghi đã phát sinh nghiệp vụ trả HTTP 409.

---

## 14. Kế hoạch triển khai

### Giai đoạn 1 — P0 dữ liệu và trạng thái

- Chuẩn hóa mã;
- rà soát dữ liệu bất thường;
- tách nhà thầu/hợp đồng;
- sửa state machine;
- cảnh báo tiến độ/giải ngân;
- chặn xóa.

### Giai đoạn 2 — Hồ sơ và kiểm soát

- hồ sơ điện tử;
- kho tài liệu;
- workflow;
- RBAC backend;
- audit log;
- lưu trữ.

### Giai đoạn 3 — Vốn, giải ngân, đấu thầu, hợp đồng

- kế hoạch vốn từng năm;
- chi tiết giải ngân;
- gói thầu;
- hợp đồng/phụ lục;
- kiểm soát giới hạn tài chính.

### Giai đoạn 4 — Tiến độ, nghiệm thu, bàn giao, quyết toán

- WBS/Gantt;
- nghiệm thu;
- bàn giao;
- quyết toán;
- bảo hành/tất toán.

### Giai đoạn 5 — Dashboard và báo cáo

- dashboard điều hành;
- drill-down;
- cảnh báo/nhắc việc;
- Excel/PDF.

Chỉ chuyển giai đoạn sau khi giai đoạn trước được review và test đạt.

---

## 15. Tiêu chí nghiệm thu

### Dữ liệu và liên kết

- mã dự án duy nhất, chuẩn hóa;
- không còn dữ liệu nhà thầu/số hợp đồng gộp mơ hồ;
- số liệu tài chính không bị nhân bản;
- cập nhật ở module nguồn được phản ánh ở module dự án;
- xung đột dữ liệu không ghi đè âm thầm.

### Vòng đời

- không chuyển hoàn thành/nghiệm thu/quyết toán khi thiếu hồ sơ;
- trạng thái dashboard phản ánh đúng giai đoạn;
- có lịch sử chuyển trạng thái.

### Phân quyền

- Công chức không truy cập hoặc sửa ngoài phạm vi;
- không vượt quyền bằng URL/API/cURL;
- Trưởng bộ phận đúng phạm vi;
- Lãnh đạo thao tác toàn xã theo thẩm quyền;
- Admin không mặc nhiên có quyền nghiệp vụ.

### Vận hành

- có hồ sơ, tài liệu, phiên bản và audit;
- có cảnh báo tiến độ/giải ngân;
- không xóa dự án đã phát sinh nghiệp vụ;
- báo cáo khớp dữ liệu màn hình và dữ liệu nguồn.

### Kỹ thuật

Chạy:

```text
npm run build
npm run build:server
npm run build:client
```

Chạy toàn bộ test hiện có và bổ sung test cho từng giai đoạn. Không dùng dữ liệu công dân thật.

---

## 16. Tài liệu bàn giao

Cập nhật `IMPLEMENTATION_NOTES.md` gồm:

- lỗi dữ liệu và cách xử lý;
- schema/migration;
- nguồn dữ liệu và quy tắc liên kết;
- state machine;
- RBAC;
- audit log;
- dashboard/báo cáo;
- test/build;
- nội dung cần `LEGAL_REVIEW_REQUIRED` theo Luật Đầu tư công và phân cấp hiện hành.

Commit theo giai đoạn:

```text
Fix project data integrity and lifecycle state rules
Add project electronic dossier and RBAC workflow
Add project funding procurement and settlement modules
Add project reporting dashboard and alerts
```

Push branch và tạo Draft Pull Request. Không tự merge, không deploy production.
