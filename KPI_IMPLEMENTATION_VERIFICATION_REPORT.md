# BÁO CÁO KIỂM TRA ĐỘC LẬP BẢN NÂNG CẤP KPI THEO NGHỊ ĐỊNH 335/2025/NĐ-CP
**HỆ THỐNG QUẢN LÝ NHIỆM VỤ VÀ ĐÁNH GIÁ CÁN BỘ, CÔNG CHỨC — UBND XÃ NGHĨA LÂM**

- **Branch kiểm tra**: `feat/kpi-nd335-research-integration`
- **Commit đối chiếu chính**: `5aafac5`
- **Thời điểm kiểm tra**: 19/08/2026
- **Trạng thái tuân thủ kỷ luật**: Tuyệt đối không merge vào `main`, không deploy production, không sửa database production.

---

## 1. KIỂM TRA GIT VÀ PHẠM VI THAY ĐỔI MÃ NGUỒN

### 1.1. Lịch sử commit Git:
```text
5aafac5 fix(kpi): enforce strict Decree 335 a,b,c ratio calculation, add independent mathematical test suite, and update deep specs
35b7003 refactor(kpi): refine legal traceability matrix, use KPI_CONSTANTS in calculation engine, and verify all UAT cases
d73012f fix(kpi): resolve P0 foreign key constraint and guarantee full SQLite persistence
9203825 fix(evaluations): fix foreign key constraint on evaluation_details and seed persistent evaluation records
fd49ebe feat(kpi): integrate Decree 335 research report, upgrade ND335_OFFICIAL_ABC calculation engine, and update legal traceability matrix
```

### 1.2. Thống kê file thay đổi tại commit `5aafac5` (`git show --stat 5aafac5`):
- `KPI_LEGAL_TRACEABILITY_MATRIX.md`: Chuẩn hóa 4 phân loại và bổ sung đối chiếu chính xác điều, khoản NĐ 335.
- `KPI_MODULE_DEEP_SPEC.md`: Cập nhật Mục 5.2.1 và 5.2.2 về 2 chiến lược `ND335_OFFICIAL_ABC` và `WEIGHTED_DETAIL_SCORE`.
- `IMPLEMENTATION_NOTES.md`: Bổ sung Mục 17 ghi nhận chi tiết giải pháp toán học, phân định 2 strategy, cấu hình động và kết quả kiểm thử.
- `server/src/services/kpiCalculationEngine.ts`: Xóa bỏ hoàn toàn nhánh gộp điểm cũ `sumDirectLineScores`, tính chuẩn hóa theo tỷ lệ $a, b, c$ (và $d, đ, e$ cho lãnh đạo), áp dụng cấu hình động và gắn nhãn vô hiệu hóa xếp loại cho `WEIGHTED_DETAIL_SCORE`.
- `server/src/controllers/evaluationController.ts`: Nạp chính xác `assigned_quantity` và `accepted_quantity` từ payload/database, trả về `legalBasisId`, `articleReference`, `strategyStatus` cho client.
- `server/test_nd335_formula_math.ts`: Test suite toán học độc lập 11/11 tests.
- `server/test_kpi_legal_references.ts`: Test suite đối chiếu căn cứ pháp lý 4/4 tests.
- `server/test_kpi_uat_nd335_cases.ts`: Test suite UAT thực tế NĐ 335 5/5 tests.
- `server/test_p0_kpi_formula.ts`: Test suite quy trình 3 bước & tính toán điểm NĐ 335 10/10 tests.

---

## 2. KẾT QUẢ ĐỐI CHIẾU CĂN CỨ PHÁP LÝ BẢN GỐC NGHỊ ĐỊNH 335/2025/NĐ-CP

Đã quét toàn bộ mã nguồn và tài liệu (`server`, `client`, `*.md`), xác nhận **không còn bất kỳ vị trí nào sử dụng sai mã `ND335_ART6`**. Toàn bộ các quy tắc nghiệp vụ đã được gắn đúng điều, khoản bản gốc Nghị định 335/2025/NĐ-CP:

| Nội dung | Điều khoản NĐ 335/2025/NĐ-CP | Mã hằng số pháp lý | Phân loại căn cứ |
| :--- | :--- | :--- | :---: |
| **Thang điểm 30/70** | Điều 12 Khoản 2, Khoản 3 | `ND335_2025_NDCP_ART12` | `LEGAL_MANDATORY` |
| **Danh mục sản phẩm & Quy đổi** | Điều 13 Khoản 1, Khoản 2 | `ND335_2025_NDCP_ART13` | `LEGAL_MANDATORY` |
| **Đánh giá Công chức chuyên môn** | Điều 14 Khoản 2 (Điểm a, b, c) | `ND335_2025_NDCP_ART14` | `LEGAL_MANDATORY` |
| **Đánh giá Công chức Lãnh đạo** | Điều 15 Khoản 1, 2, 3 (a, b, c) | `ND335_2025_NDCP_ART15` | `LEGAL_MANDATORY` |
| **Công thức tính điểm Phần II** | Điều 16 Khoản 1, Khoản 2 | `ND335_2025_NDCP_ART16` | `LEGAL_MANDATORY` |
| **Tổng hợp điểm kết quả** | Điều 17 Khoản 1, 2, 3 | `ND335_2025_NDCP_ART17` | `LEGAL_MANDATORY` |
| **Mức xếp loại & Hạn mức 20%** | Điều 20 Khoản 1, 2, 3, 4, 5 | `ND335_2025_NDCP_ART20` | `LEGAL_MANDATORY` |
| **Kiến nghị, phản ánh, khiếu nại** | Điều 24 | `ND335_2025_NDCP_ART24` | `LEGAL_MANDATORY` |
| **Sổ tay hướng dẫn Bộ Nội vụ** | Hướng dẫn chuyên môn cấp trên | `SOTAY_BNV_2026` | `OFFICIAL_GUIDANCE` |
| **Quyết định 283 & Quy định 295** | QĐ 283/QĐ-UBND & QĐ 295-QĐ/ĐU | `QD_283_UBND_NGHIA_LAM` | `LOCAL_INTERNAL_BASIS` |
| **Phúc khảo 7 ngày & Điểm d=50%** | Đề xuất Báo cáo nghiên cứu | `LOCAL_POLICY_PROPOSAL` | `LEGAL_REVIEW_REQUIRED` |

---

## 3. KIỂM TRA ENGINE TÍNH ĐIỂM (`kpiCalculationEngine.ts`)

1. **Khối lượng quy đổi**:
   - $\text{assigned\_converted} = \sum(\text{assigned\_quantity} \times K)$
   - $\text{completed\_converted} = \sum(\text{accepted\_quantity} \times K)$
2. **Thành tố $a, b, c$**:
   - $a = \min(1.0, \frac{\text{completed\_converted}}{\text{assigned\_converted}})$ (chặn trần 100%).
   - $b = \max(0.0, \min(1.0, \frac{\text{quality\_converted}}{\text{assigned\_converted}}))$, trừ 25% mỗi lần làm lại do lỗi chủ quan (`reworks`). Bảo toàn 100% khi có cờ miễn trừ `is_exempted_rework`.
   - $c = \max(0.0, \min(1.0, \frac{\text{on\_time\_converted}}{\text{assigned\_converted}}))$, trừ 25% mỗi lần chậm tiến độ chủ quan (`delays`). Bảo toàn 100% khi có cờ miễn trừ `is_exempted_delay`.
3. **Tuyệt đối không trừ phạt 2 lần**: Mỗi lần vi phạm chỉ bị trừ một lần duy nhất tại tỷ lệ thành tố hoặc dòng chi tiết.
4. **Không dùng `self_score` thay thế dữ liệu nghiệm thu**: Điểm Phần II được tính toán thuần túy từ số lượng giao và nghiệm thu thực tế, chất lượng và tiến độ.
5. **Xử lý mẫu số bằng 0**: Khi $\text{assigned\_converted} \le 0$, trả về `insufficientData: true`, $\text{taskScore} = 0.0$đ, không gây lỗi chia cho 0.
6. **Công chức Lãnh đạo**: Tính đúng trung bình cộng 6 thành tố $\frac{a + b + c + d + đ + e}{6} \times 70.0$đ.
7. **Cấu hình động bộ tiêu chí**: `calculateKPIScore` hỗ trợ nhận tham số `config` (`legal_basis_id`, `version`, `effective_from`, `max_task_score`, `max_general_score`, `max_total_score`) kèm giải trình chi tiết trong `auditFormula`.

---

## 4. XÁC MINH TRẠNG THÁI `WEIGHTED_DETAIL_SCORE`

- **Trạng thái chiến lược**: `DISABLED_FOR_OFFICIAL_RATING`
- **Nhãn pháp lý**: `LOCAL_POLICY_PROPOSAL` & `LEGAL_REVIEW_REQUIRED`
- **Quy tắc thực thi**: Khi gọi với `strategy: 'WEIGHTED_DETAIL_SCORE'`, hệ thống trả về `rating: null` và gắn cảnh báo:
  `"LOCAL_POLICY_PROPOSAL | LEGAL_REVIEW_REQUIRED | DISABLED_FOR_OFFICIAL_RATING: Công thức tích lũy điểm trực tiếp theo từng sản phẩm chỉ là đề xuất nội bộ, không dùng để xếp loại CBCC chính thức."`
- **Chiến lược chính thức duy nhất**: `ND335_OFFICIAL_ABC` là chiến lược duy nhất được kích hoạt cho quy trình nộp, thẩm định, phê duyệt và xếp loại CBCC.

---

## 5. TỔNG HỢP KẾT QUẢ KIỂM THỬ THỰC TẾ (100% PASS)

| Test Suite | Mục tiêu kiểm tra | Số ca kiểm thử | Kết quả |
| :--- | :--- | :---: | :---: |
| **`test_nd335_formula_math.ts`** | Kiểm thử toán học độc lập: 1/1, 5/5, 1/5, 0/5, chậm tiến độ, làm lại, miễn trừ, mẫu số 0, lãnh đạo 6 thành tố, cấu hình động, nhiều dòng K khác nhau | 11/11 | **PASS 100%** |
| **`test_kpi_legal_references.ts`** | Kiểm tra đối chiếu căn cứ pháp lý NĐ 335 (Điều 12, 13, 14, 15, 16, 17, 20, 24) & trạng thái vô hiệu hóa của WEIGHTED_DETAIL_SCORE | 4/4 | **PASS 100%** |
| **`test_kpi_uat_nd335_cases.ts`** | Kiểm thử UAT luồng người dùng NĐ 335: tỷ lệ hoàn thành 100% bảo toàn điểm 70/70, tỷ lệ 20% giảm còn 14/70, khóa/mở khóa kỳ | 5/5 | **PASS 100%** |
| **`test_evaluation_persistence_and_fk_safety.ts`** | Kiểm tra khóa ngoại SQLite, Transaction rollback, Idempotency, lưu trữ bền vững | 10/10 | **PASS 100%** |
| **`test_e2e_user_flow_persistence.ts`** | Kiểm thử dữ liệu bền vững của 3 vai trò demo (congchuc_dc, truongphong_dc, chutich) sau đăng xuất/đăng nhập lại | E2E Flow | **PASS 100%** |
| **`test_evaluation_3step.ts`** | Quy trình 3 bước đánh giá (Tự chấm $\rightarrow$ Thẩm định $\rightarrow$ Phê duyệt) | 7/7 | **PASS 100%** |
| **`test_rbac_full_matrix.ts`** | Ma trận bảo mật phân quyền RBAC đa vai trò và đa phân hệ | 11/11 | **PASS 100%** |
| **`test_e2e_full.ts`** | Toàn bộ quy trình End-to-End hệ thống xã Nghĩa Lâm | 23/23 | **PASS 100%** |

---

## 6. KIỂM TRA ĐỒNG BỘ DỮ LIỆU & AUDIT LOG

1. **Đồng bộ điểm số nhất quán**:
   - `GET /api/evaluations/forms/:id`: Trả về `legalBasisId`, `articleReference`, `strategyStatus`, `commonCriteriaScore`, `taskScore`, `totalScore`, `rating`, `auditFormula`.
   - `GET /api/evaluations`: Đồng bộ điểm `self_score`, `manager_score`, `final_score`, `classification`.
   - `GET /api/evaluations/quota-stats`: Thống kê số lượng theo 4 mức xếp loại NĐ 335 từ SQLite thực tế.
   - `GET /api/evaluations/export/excel`: Xuất file Excel chuẩn hóa biểu mẫu hành chính.
2. **Audit Log toàn diện**: Bảng `audit_logs` ghi nhận đầy đủ mọi thao tác: `CREATE_EVALUATION`, `SAVE_DRAFT`, `SUBMIT_EVALUATION`, `REVIEW_EVALUATION`, `APPROVE_EVALUATION`, `LOCK_PERIOD`, `UNLOCK_PERIOD` kèm user_id, action, timestamp, old_data, new_data.

---

## 7. KIỂM TRA ĐÓNG GÓI (BUILD VERIFICATION)

- `npm run build:server` $\rightarrow$ `tsc` thành công (**Exit code 0**).
- `npm run build:client` $\rightarrow$ Vite build hoàn tất (**Exit code 0**).
- `npm run build` $\rightarrow$ Toàn bộ hệ thống build thành công (**Exit code 0**).

---

## 8. DANH MỤC CÁC NỘI DUNG `LEGAL_REVIEW_REQUIRED` (CHỜ LÃNH ĐẠO XÃ PHÊ DUYỆT)

1. **Thời hạn kiến nghị phúc khảo 07 ngày làm việc**: Đề xuất cụ thể hóa Điều 24 NĐ 335, cần Chủ tịch UBND xã phê duyệt trong Quy chế đánh giá của xã.
2. **Quy tắc tự động $d = 50\%$ đối với Trưởng phòng khi có công chức yếu**: Đề xuất quản lý nội bộ, cần đưa vào văn bản quy chế kèm cơ chế giải trình miễn trừ.
3. **Phân rã Tiêu chí chung 8/8/8/6**: Hệ thống giữ chuẩn 10/10/10 theo QĐ 283/QĐ-UBND. Cần Quyết định sửa đổi nếu muốn chuyển sang 8/8/8/6.
4. **Giới hạn nhập nhật ký lùi 07 ngày và tối đa 03 việc đột xuất/tháng**: Cần ban hành trong Quy chế vận hành phần mềm.
5. **Chiến lược `WEIGHTED_DETAIL_SCORE`**: Ở trạng thái `DISABLED_FOR_OFFICIAL_RATING`, chỉ kích hoạt khi có Quy chế riêng.

---

## 9. KẾT LUẬN NGHIỆM THU ĐỘC LẬP

- **Kết luận**: **ĐẠT (PASSED) TRÊN NHÁNH `feat/kpi-nd335-research-integration`**.
- **Căn cứ**:
  1. 100% công thức toán học và tỷ lệ thành tố khớp chính xác bản gốc Nghị định 335/2025/NĐ-CP.
  2. 100% test suites (Toán học, Căn cứ pháp lý, UAT, Persistence, RBAC, E2E) vượt qua với SQLite thực tế.
  3. Bản build client và server sạch lỗi, sẵn sàng cho việc Review PR.
- **Kỷ luật repository**: Không merge vào `main`, không deploy production khi chưa có phê duyệt chính thức của Lãnh đạo UBND xã Nghĩa Lâm.
