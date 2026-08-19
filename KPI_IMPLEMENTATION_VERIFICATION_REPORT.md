# BÁO CÁO KIỂM TRA ĐỘC LẬP BẢN NÂNG CẤP KPI THEO NGHỊ ĐỊNH 335/2025/NĐ-CP
**HỆ THỐNG QUẢN LÝ NHIỆM VỤ VÀ ĐÁNH GIÁ CÁN BỘ, CÔNG CHỨC — UBND XÃ NGHĨA LÂM**

- **Branch kiểm tra**: `feat/kpi-nd335-research-integration`
- **Commit đối chiếu**: `2010ed8` và các bản vá metadata pháp lý tiếp theo
- **Thời điểm kiểm tra**: 19/08/2026
- **Trạng thái tuân thủ kỷ luật**: Tuyệt đối không merge vào `main`, không deploy production, không sửa database production.

---

## 1. RÀ SOÁT VÀ XỬ LÝ TRIỆT ĐỂ METADATA PHÁP LÝ

Đã quét toàn bộ repository (mã nguồn TypeScript, JSX, CSDL SQLite, tài liệu Markdown, test fixtures), xác nhận **hoàn toàn không còn bất kỳ tham chiếu lỗi nào đến `ND335_ART6` hay `ART6`**.

Toàn bộ các quy tắc nghiệp vụ đã được chuẩn hóa thống nhất theo 8 điều khoản bản gốc Nghị định số 335/2025/NĐ-CP ngày 21/12/2025 của Chính phủ:

| Điều khoản NĐ 335 | Mã định danh pháp lý (`legal_basis_id`) | Nội dung quy định chuẩn hóa | Phân loại căn cứ |
| :--- | :--- | :--- | :---: |
| **Điều 12** | `ND335_2025_NDCP_ART12` | Thang điểm chuẩn: Tiêu chí chung tối đa 30đ; Tiêu chí kết quả nhiệm vụ tối đa 70đ. | `LEGAL_MANDATORY` |
| **Điều 13** | `ND335_2025_NDCP_ART13` | Phương pháp xác định tiêu chí, Danh mục sản phẩm/công việc chuẩn, đơn vị chuẩn và hệ số quy đổi ($K$). | `LEGAL_MANDATORY` |
| **Điều 14** | `ND335_2025_NDCP_ART14` | Đánh giá công chức không giữ chức vụ lãnh đạo: Tỷ lệ số lượng ($a$), chất lượng ($b$ trừ 25%/lỗi chủ quan), tiến độ ($c$ trừ 25%/lỗi chủ quan). Miễn trừ khi có căn cứ khách quan. | `LEGAL_MANDATORY` |
| **Điều 15** | `ND335_2025_NDCP_ART15` | Đánh giá công chức lãnh đạo, quản lý: 6 thành tố ($a, b, c$ nhiệm vụ trực tiếp; $d$ kết quả đơn vị; $đ$ khả năng tổ chức; $e$ năng lực đoàn kết nội bộ). | `LEGAL_MANDATORY` |
| **Điều 16** | `ND335_2025_NDCP_ART16` | Công thức tính điểm Phần II: $\frac{a+b+c}{3} \times 70.0$đ (Chuyên môn) và $\frac{a+b+c+d+đ+e}{6} \times 70.0$đ (Lãnh đạo). | `LEGAL_MANDATORY` |
| **Điều 17** | `ND335_2025_NDCP_ART17` | Tổng hợp điểm tháng/quý/năm: $\text{Tổng điểm} = \text{Tiêu chí chung (Max 30)} + (\text{Điểm kết quả nhiệm vụ} \times 70)$. | `LEGAL_MANDATORY` |
| **Điều 20** | `ND335_2025_NDCP_ART20` | Bốn mức xếp loại chất lượng (Xuất sắc $\ge 90$đ; Tốt $70 - <90$đ; Hoàn thành $50 - <70$đ; Không hoàn thành $< 50$đ) và tỷ lệ khống chế Xuất sắc $\le 20\%$. | `LEGAL_MANDATORY` |
| **Điều 24** | `ND335_2025_NDCP_ART24` | Quyền khiếu nại, kiến nghị, giải quyết phản ánh về kết quả đánh giá CBCC. | `LEGAL_MANDATORY` |

---

## 2. KIỂM TRA ENGINE TÍNH ĐIỂM (`kpiCalculationEngine.ts`)

1. **Khối lượng quy đổi chuẩn xác**:
   - $\text{assigned\_converted} = \sum(\text{assigned\_quantity} \times K)$
   - $\text{completed\_converted} = \sum(\text{accepted\_quantity} \times K)$
2. **Thành tố $a, b, c$**:
   - $a = \min(1.0, \frac{\text{completed\_converted}}{\text{assigned\_converted}})$ (chặn trần 100%).
   - $b = \max(0.0, \min(1.0, \frac{\text{quality\_converted}}{\text{assigned\_converted}}))$, trừ 25% mỗi lần làm lại do lỗi chủ quan (`reworks`). Miễn trừ khi có cờ `is_exempted_rework`.
   - $c = \max(0.0, \min(1.0, \frac{\text{on\_time\_converted}}{\text{assigned\_converted}}))$, trừ 25% mỗi lần chậm tiến độ chủ quan (`delays`). Miễn trừ khi có cờ `is_exempted_delay`.
3. **Phạt vi phạm duy nhất**: Tuyệt đối không trừ phạt 25% hai lần.
4. **Không dùng `self_score` thay thế dữ liệu nghiệm thu**: Toàn bộ điểm Phần II được tính toán trung thực từ kết quả giao - nhận - nghiệm thu thực tế.
5. **Xử lý mẫu số bằng 0**: Khi $\text{assigned\_converted} \le 0$, trả về `insufficientData: true`, $\text{taskScore} = 0.0$đ, không gây lỗi chia cho 0.
6. **Công chức Lãnh đạo**: Tính đúng trung bình 6 thành tố $\frac{a + b + c + d + đ + e}{6} \times 70.0$đ.
7. **Cấu hình động bộ tiêu chí**: `calculateKPIScore` hỗ trợ cấu hình kỳ/tiêu chí (`legal_basis_id`, `version`, `effective_from`, `max_task_score`, `max_general_score`, `max_total_score`) kèm giải trình chi tiết trong `auditFormula`.

---

## 3. XÁC MINH TRẠNG THÁI `WEIGHTED_DETAIL_SCORE`

- **Trạng thái chiến lược**: `DISABLED_FOR_OFFICIAL_RATING`
- **Nhãn pháp lý**: `LOCAL_POLICY_PROPOSAL` & `LEGAL_REVIEW_REQUIRED`
- **Quy tắc thực thi**: Trả về `rating: null` và cảnh báo:
  `"LOCAL_POLICY_PROPOSAL | LEGAL_REVIEW_REQUIRED | DISABLED_FOR_OFFICIAL_RATING: Công thức tích lũy điểm trực tiếp theo từng sản phẩm chỉ là đề xuất nội bộ, không dùng để xếp loại CBCC chính thức."`
- **Chiến lược chính thức duy nhất**: `ND335_OFFICIAL_ABC` là chiến lược duy nhất được kích hoạt cho quy trình nộp, thẩm định, phê duyệt và xếp loại CBCC.

---

## 4. TỔNG HỢP KẾT QUẢ KIỂM THỬ THỰC TẾ TRÊN DATABASE SQLITE THẬT (100% PASS)

| STT | Test Suite | Lệnh kiểm thử | Số ca test | Kết quả |
| :---: | :--- | :--- | :---: | :---: |
| 1 | **`test_kpi_legal_references.ts`** | `npx tsx server/test_kpi_legal_references.ts` | 4/4 | **PASS 100%** |
| 2 | **`test_nd335_formula_math.ts`** | `npx tsx server/test_nd335_formula_math.ts` | 11/11 | **PASS 100%** |
| 3 | **`test_kpi_uat_nd335_cases.ts`** | `npx tsx server/test_kpi_uat_nd335_cases.ts` | 5/5 | **PASS 100%** |
| 4 | **`test_evaluation_persistence_and_fk_safety.ts`** | `npx tsx server/test_evaluation_persistence_and_fk_safety.ts` | 10/10 | **PASS 100%** |
| 5 | **`test_e2e_user_flow_persistence.ts`** | `npx tsx server/test_e2e_user_flow_persistence.ts` | E2E Flow | **PASS 100%** |
| 6 | **`test_evaluation_3step.ts`** | `npx tsx server/test_evaluation_3step.ts` | 7/7 | **PASS 100%** |
| 7 | **`test_rbac_full_matrix.ts`** | `npx tsx server/test_rbac_full_matrix.ts` | 11/11 | **PASS 100%** |
| 8 | **`test_e2e_full.ts`** | `npx tsx server/test_e2e_full.ts` | 23/23 | **PASS 100%** |

---

## 5. KẾT QUẢ ĐÓNG GÓI (BUILD)
- `npm run build:server` $\rightarrow$ `tsc` thành công (**Exit code 0**).
- `npm run build:client` $\rightarrow$ Vite bundle thành công (**Exit code 0**).
- `npm run build` $\rightarrow$ Toàn bộ ứng dụng build thành công (**Exit code 0**).

---

## 6. DANH MỤC CÁC NỘI DUNG `LEGAL_REVIEW_REQUIRED` (CẦN LÃNH ĐẠO XÃ PHÊ DUYỆT)
1. **Thời hạn kiến nghị phúc khảo 07 ngày làm việc**: Cần Chủ tịch UBND xã phê duyệt ban hành trong Quy chế đánh giá CBCC của xã (theo Điều 24 NĐ 335).
2. **Quy tắc tự động $d = 50\%$ đối với Trưởng phòng khi có công chức yếu**: Cần đưa vào Quy chế nội bộ kèm cơ chế giải trình miễn trừ.
3. **Phân rã Tiêu chí chung 8/8/8/6**: Hệ thống giữ chuẩn 10/10/10 theo QĐ 283/QĐ-UBND và QĐ 295-QĐ/ĐU. Cần Quyết định sửa đổi nếu muốn chuyển sang 8/8/8/6.
4. **Giới hạn nhập nhật ký lùi 07 ngày và tối đa 03 việc đột xuất/tháng**: Cần ban hành trong Quy chế vận hành phần mềm.
5. **Chiến lược `WEIGHTED_DETAIL_SCORE`**: Ở trạng thái `DISABLED_FOR_OFFICIAL_RATING`, chỉ kích hoạt khi có Quy chế riêng.

---

## 7. KẾT LUẬN NGHIỆM THU
- **Kết luận**: **ĐẠT (PASSED) TRÊN NHÁNH `feat/kpi-nd335-research-integration`**.
- **Kỷ luật repository**: Tuyệt đối **không merge vào `main`**, **không deploy production**, **không sửa database production**.
