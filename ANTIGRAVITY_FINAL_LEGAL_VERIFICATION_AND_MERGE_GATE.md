# LỆNH CUỐI CÙNG GIAO ANTIGRAVITY

## Rà soát pháp lý cuối cùng và hoàn tất điều kiện merge module Quản lý dự án đầu tư công

### Thông tin làm việc

- Repository: `D:\Dropbox\Văn bản\UBND xa Nghia Lam\CBCC\cbcc-app`
- Kho pháp lý: `D:\Dropbox\Văn bản\UBND xa Nghia Lam\CBCC\Phap_ly`
- Branch: `feat/project-legal-compliance-2026`
- Commit hiện tại cần rà soát: `a967679`
- Không merge vào `main` và không deploy production trong nhiệm vụ này.

## 1. Đọc bắt buộc

Đọc toàn bộ các file sau trong repository:

- `PROJECT_MANAGEMENT_MODULE_FINAL_SPEC.md`
- `PROJECT_LEGAL_TRACEABILITY_MATRIX.md`
- `LEGAL_REVIEW_FINAL_CHECK.md`
- `LEGAL_REVIEW_REPORT.md`
- `PHAP_LY_INDEX.md`
- `PHAP_LY_GAP_REPORT.md`
- `PROJECT_LEGAL_FINAL_ACCEPTANCE.md`
- `PROJECT_UI_UAT_REPORT.md`
- `PROJECT_DATA_QUALITY_REPORT.md`
- `PROJECT_MODULE_FIX_REPORT.md`
- `IMPLEMENTATION_NOTES.md`

Đọc toàn bộ tài liệu tại:

`D:\Dropbox\Văn bản\UBND xa Nghia Lam\CBCC\Phap_ly`

## 2. Mục tiêu

Kiểm tra lại kết luận “đạt 100% pháp lý” của module `/projects`. Chỉ được đề xuất đủ điều kiện merge khi mỗi căn cứ pháp lý, thẩm quyền, ngưỡng, biểu mẫu và quy tắc chuyển tiếp đều có nguồn xác minh rõ ràng.

## 3. Bốn nội dung bắt buộc phải xác minh lại

### 3.1. Nghị định 214/2025/NĐ-CP

- Đọc bản PDF chính thức, không dùng bài phân tích hoặc dự thảo thay thế.
- Kiểm tra chính xác các điều khoản về kế hoạch lựa chọn nhà thầu, lựa chọn nhà thầu, chỉ định thầu, đấu thầu qua mạng và hợp đồng.
- Kiểm tra lại các nhận định về ngưỡng “dưới 1 tỷ đồng” và “dưới 5 tỷ đồng đối với chương trình mục tiêu quốc gia”.
- Không được giữ các ngưỡng này trong code/configuration nếu chưa xác định đúng điều, khoản và phạm vi áp dụng.
- Không được mô tả Nghị định 214 chỉ là văn bản về “đấu thầu qua mạng và chỉ định thầu quy mô nhỏ cấp xã” nếu nội dung chính thức không ghi như vậy.

### 3.2. Quan hệ giữa Nghị định 24/2024/NĐ-CP và Nghị định 214/2025/NĐ-CP

- Xác định Nghị định 214 có thay thế, bãi bỏ hoặc quy định chuyển tiếp đối với Nghị định 24 ở nội dung nào.
- Không ghi chung chung rằng hai nghị định “áp dụng hài hòa”.
- Ghi rõ văn bản áp dụng cho hồ sơ phát sinh trước và sau ngày có hiệu lực.
- Nếu chưa xác định được quy tắc chuyển tiếp thì đánh dấu `LEGAL_REVIEW_REQUIRED` và không hard-code.

### 3.3. Văn bản của tỉnh Nghệ An và xã Nghĩa Lâm

Kiểm tra bản gốc có số, ngày, cơ quan ban hành, chữ ký/con dấu và nguồn xác thực đối với:

- `QĐ 13/2026/QĐ-UBND`;
- `NQ 05/2026/NQ-HĐND`;
- `NQ 69/NQ-HĐND`;
- `CV 3651/UBND-KT`;
- `QĐ 115/QĐ-UBND`;
- `QĐ 88/QĐ-UBND`;
- `NQ 02/NQ-HĐND xã Nghĩa Lâm`.

Nếu chỉ có tên file, bản tóm tắt hoặc bản chưa xác minh thì không coi là căn cứ chính thức.

### 3.4. Phân loại và phạm vi tài liệu

- Luật Xây dựng số 135/2025/QH15 có hiệu lực từ ngày 01/7/2026 phải được đưa vào căn cứ chính thức.
- Nghị định 335/2025/NĐ-CP phải thuộc kho pháp lý của module KPI, không dùng làm căn cứ chính của module đầu tư công.
- “Sổ tay hoạt động quản lý đầu tư công năm 2026” chỉ ghi là tài liệu tham khảo/hướng dẫn, không ghi là văn bản quy phạm pháp luật.
- Rà soát Nghị định 104/2026, Nghị định 210/2026, Thông tư 36/2026 và Thông tư 40/2026. Chỉ giữ trong căn cứ chính nếu xác định được nội dung tác động trực tiếp đến module; nếu không, đánh dấu `LEGAL_REVIEW_REQUIRED` hoặc chuyển sang tài liệu tham khảo.

## 4. Cập nhật tài liệu

Cập nhật các file:

- `PHAP_LY_INDEX.md`
- `PROJECT_LEGAL_TRACEABILITY_MATRIX.md`
- `PHAP_LY_GAP_REPORT.md`
- `PROJECT_LEGAL_FINAL_ACCEPTANCE.md`
- `LEGAL_REVIEW_FINAL_CHECK.md`
- `IMPLEMENTATION_NOTES.md`

Trong ma trận pháp lý phải ghi rõ:

- Văn bản;
- Điều, khoản, điểm/phụ lục/trang;
- Ngày hiệu lực;
- Quan hệ thay thế/sửa đổi/bãi bỏ;
- Quy tắc chuyển tiếp;
- Quy tắc triển khai;
- File/API/model/configuration liên quan;
- Trạng thái xác minh.

## 5. Kiểm tra code và configuration

Rà soát các nội dung có thể đang hard-code:

- Ngưỡng chỉ định thầu;
- Thẩm quyền cấp xã;
- Thẩm quyền phê duyệt;
- Mẫu quyết toán;
- Thời hạn bảo hành;
- Điều kiện chuyển bước;
- Ngưỡng Progress Gap 15%/30%.

Các giá trị chưa có căn cứ trực tiếp phải chuyển sang configuration và gắn căn cứ pháp lý/version. Progress Gap 15%/30% phải ghi rõ là cảnh báo quản trị nội bộ, không phải kết luận vi phạm pháp luật.

## 6. Kiểm thử bắt buộc

Chạy:

```bash
npm run build
npm run build:server
npm run build:client
npx ts-node server/test_project_comprehensive_v2.ts
```

Đồng thời chạy toàn bộ test hiện có về:

- workflow 16 bước;
- chuyển tiếp trước/sau ngày 01/7/2026;
- Nghị định 193/2026 và Thông tư 73/2026;
- Nghị định 214/2025;
- RBAC;
- Gate Rules;
- không nhân bản số liệu vốn;
- audit log;
- export Excel.

## 7. Điều kiện kết thúc

Chỉ kết luận đủ điều kiện merge khi:

- Không còn nhận định pháp lý chưa có nguồn xác minh nhưng đang ghi là `ACTIVE`;
- Các ngưỡng đấu thầu đã được đối chiếu đúng điều khoản;
- Quan hệ Nghị định 24 và Nghị định 214 đã được xác định;
- Văn bản Nghệ An và xã Nghĩa Lâm có bản gốc xác thực;
- Build và test đạt;
- Không phát sinh lỗi RBAC, dữ liệu, workflow hoặc audit.

Nếu còn nội dung chưa xác minh, kết luận bắt buộc là:

> Đạt kỹ thuật; đạt pháp lý có điều kiện; chưa đủ điều kiện merge đối với phần còn `LEGAL_REVIEW_REQUIRED`.

## 8. Kỷ luật repository

- Không merge vào `main`.
- Không deploy production.
- Không sửa database production.
- Không xóa dữ liệu thật.
- Chỉ tạo commit bổ sung trên branch `feat/project-legal-compliance-2026`.
- Báo cáo rõ danh sách file thay đổi, test đã chạy và nội dung còn `LEGAL_REVIEW_REQUIRED`.

Khi hệ thống hỏi quyền thao tác repository hoặc thư mục pháp lý, chọn:

`Yes, and always allow …`
