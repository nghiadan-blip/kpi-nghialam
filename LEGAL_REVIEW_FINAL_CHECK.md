# BIÊN BẢN RÀ SOÁT PHÁP LÝ CUỐI CÙNG TRƯỚC KHI MERGE
## (LEGAL REVIEW FINAL CHECK - MODULE QUẢN LÝ DỰ ÁN ĐẦU TƯ CÔNG XÃ NGHĨA LÂM)

**Hệ thống:** Phần mềm Quản lý nhiệm vụ và đánh giá CBCC xã Nghĩa Lâm  
**Module:** Quản lý Dự án đầu tư công (`/projects`) liên kết `/public-investment`  
**Nhánh:** `feat/project-legal-compliance-2026`  
**Ngày rà soát:** 17/08/2026  
**Người thực hiện:** Antigravity AI & Nhóm Kỹ thuật xã Nghĩa Lâm  

---

## 1. Nội Dung Đã Xác Minh (Verified Content)

1. **Luật Đầu tư công số 58/2024/QH15** (Ban hành ngày 29/11/2024, có hiệu lực từ ngày **01/01/2025**):
   - Đã xác minh có hiệu lực thi hành và thay thế Luật Đầu tư công 2019 số 39/2019/QH14.
   - Thẩm quyền chủ trương đầu tư thuộc HĐND xã (Điều 18); thẩm quyền phê duyệt dự án / BCKTKT thuộc Chủ tịch UBND xã (Điều 35, 41); kế hoạch vốn trung hạn và hằng năm (Điều 55, 64).

2. **Nghị định số 175/2024/NĐ-CP** (Ban hành ngày 30/12/2024):
   - Đã xác minh thay thế hoàn toàn Nghị định 15/2021/NĐ-CP về quản lý dự án đầu tư xây dựng.
   - Áp dụng chuẩn xác cho các Bước 5, 6, 7, 8, 9 (Nhiệm vụ khảo sát, phương án khảo sát, lập BCKTKT, thẩm định dự toán và phê duyệt BCKTKT).

3. **Nghị định số 193/2026/NĐ-CP & Thông tư số 73/2026/TT-BTC**:
   - Đã xác minh có hiệu lực từ ngày **01/7/2026** và chỉ điều chỉnh chuyên sâu phân hệ **Quyết toán vốn đầu tư dự án hoàn thành** (Bước 15, Bước 16).
   - Biểu mẫu quyết toán từ 01/7/2026 áp dụng theo Thông tư 73/2026/TT-BTC (Mẫu 01/QTDA, 02/QTDA, 03/QTDA).

4. **Nghị định số 254/2025/NĐ-CP & Công văn số 10836/BTC-PTHT**:
   - Đã xác minh Nghị định số 254/2025/NĐ-CP điều chỉnh khâu **Quản lý, tạm ứng và thanh toán vốn đầu tư công** (Bước 12) và bãi bỏ Điều 6 Nghị định 125/2025/NĐ-CP.
   - Công văn 10836/BTC-PTHT (ngày 23/7/2026) hướng dẫn trích xuất báo cáo nhanh phân bổ và giải ngân.

5. **Thời hạn bảo hành công trình (Điều 28 Nghị định 06/2021/NĐ-CP)**:
   - Xác minh thời hạn bảo hành tối thiểu theo cấp công trình và hợp đồng cụ thể (`project.warranty_end_date`), không hard-code 12 tháng.

---

## 2. Nội Dung Đã Sửa & Chuẩn Hóa (Modified Content)

1. **Tách biệt rõ ràng phạm vi Nghị định 254/2025/NĐ-CP và Nghị định 193/2026/NĐ-CP**:
   - *Đã sửa*: Không dùng Nghị định 193/2026/NĐ-CP làm căn cứ chung cho khâu quản lý, tạm ứng và thanh toán vốn tại Bước 12 (Bước 12 gắn liền với Nghị định 254/2025/NĐ-CP và CV 10836/BTC-PTHT).
   - *Đã sửa*: Nghị định 193/2026/NĐ-CP chỉ áp dụng cho khâu quyết toán dự án hoàn thành (Bước 15, 16) từ ngày 01/7/2026.

2. **Xử lý điều khoản chuyển tiếp quyết toán trước và sau ngày 01/7/2026**:
   - *Đã sửa*: Loại bỏ việc mặc nhiên kết luận hồ sơ quyết toán trước ngày 01/7/2026 áp dụng Nghị định 254/2025/NĐ-CP khi chưa có điều khoản trực tiếp.
   - *Đã sửa*: Hệ thống gắn cờ `LEGAL_REVIEW_REQUIRED` đối với hồ sơ nộp trước ngày 01/7/2026 để người dùng/cán bộ thẩm tra chủ động đối chiếu văn bản chuyển tiếp của địa phương.

3. **Sửa mâu thuẫn căn cứ tại Bước 10 (và Bước 4/11)**:
   - *Đã sửa*: Xác lập rõ văn bản có hiệu lực chung là **Luật Đấu thầu số 22/2023/QH15 & Nghị định số 24/2024/NĐ-CP**.
   - *Đã sửa*: Bổ sung dẫn chiếu **Nghị định số 214/2025/NĐ-CP** là văn bản quy định chi tiết về đấu thầu qua mạng và chỉ định thầu quy mô nhỏ cấp xã một cách thống nhất, không mâu thuẫn.

4. **Biểu mẫu Thông tư 73/2026/TT-BTC (Mẫu 01, 02, 03/QTDA)**:
   - *Đã sửa*: Giữ cấu trúc đính kèm tài liệu điện tử động theo loại tài liệu (`settlement_form_01_tt73`, `settlement_form_02_tt73`), không hard-code các cột biểu mẫu cố định, sẵn sàng mở rộng khi có hướng dẫn chi tiết của Sở Tài chính Nghệ An.

5. **Làm rõ bản chất pháp lý của Progress Gap (15% / 30%)**:
   - *Đã sửa*: Ghi chú rõ ràng trong toàn bộ tài liệu đặc tả, code controller, hằng số và giao diện người dùng: Ngưỡng 15% (vàng) và 30% (đỏ) là **chỉ số cảnh báo quản trị rủi ro nội bộ**, không phải chế tài xử phạt theo quy định pháp luật.

---

## 3. Nội Dung Còn Đánh Dấu `LEGAL_REVIEW_REQUIRED` (Cần Rà Soát Định Kỳ)

| Mã | Hạng mục | Cơ quan / Văn bản cần đối chiếu |
| :--- | :--- | :--- |
| `LEGAL_REV_01` | Hạn mức phân cấp dự án A/B/C cấp xã | Quyết định phân cấp của UBND tỉnh Nghệ An / UBND huyện Nghĩa Đàn |
| `LEGAL_REV_02` | Quy định chuyển tiếp theo Nghị định 40/2020/NĐ-CP | Nghị định mới thay thế NĐ 40/2020 hướng dẫn thi hành Luật 58/2024/QH15 |
| `LEGAL_REV_03` | Quy chế BQLDA & Ban Giám sát đầu tư cộng đồng | Quyết định kiện toàn nhân sự hằng năm của UBND xã Nghĩa Lâm |
| `LEGAL_REV_04` | Điều khoản chuyển tiếp hồ sơ quyết toán nộp trước 01/7/2026 | Văn bản hướng dẫn quyết toán của UBND tỉnh Nghệ An / Sở Tài chính |
| `LEGAL_REV_05` | Phụ lục chi tiết mẫu biểu Thông tư 73/2026/TT-BTC | Mẫu biểu hướng dẫn thực hiện của Phòng Tài chính - Kế hoạch huyện Nghĩa Đàn |

---

## 4. Đề Xuất Đủ Điều Kiện Merge Hay Chưa

### Kết Quả Kiểm Tra Kỹ Thuật & Pháp Lý
- ✅ **Test 2026 Legal Compliance & Transition Rules**: `test_project_legal_compliance_2026.ts` $\rightarrow$ **100% PASS**.
- ✅ **Test Final UAT Acceptance**: `test_project_uat_acceptance.ts` $\rightarrow$ **100% PASS**.
- ✅ **Test 5 Phases Master Spec**: `test_project_master_spec.ts` $\rightarrow$ **100% PASS**.
- ✅ **Build Kiểm Thử Toàn Bộ Hệ Thống**:
  - `npm run build:server` $\rightarrow$ **0 lỗi**.
  - `npm run build:client` $\rightarrow$ **0 lỗi (Vite bundle ready)**.
  - `npm run build` $\rightarrow$ **0 lỗi**.

### Đề Xuất Nghiệm Thu
1. **Đủ điều kiện tạo và duy trì Draft Pull Request**: Nhánh `feat/project-legal-compliance-2026` đã hoàn thiện toàn diện cả về mặt kỹ thuật, logic điều hành, phân quyền RBAC và đối chiếu căn cứ pháp lý.
2. **Kỷ luật triển khai bắt buộc**:
   - **KHÔNG** tự ý merge vào branch `main`.
   - **KHÔNG** tự ý deploy lên máy chủ production.
   - **KHÔNG** sửa đổi cơ sở dữ liệu production.
   - Chờ Lãnh đạo UBND xã Nghĩa Lâm thẩm định, phê duyệt và ký duyệt biên bản nghiệm thu trước khi thực hiện merge chính thức.
