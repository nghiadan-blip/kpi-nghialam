# MA TRẬN TRUY XUẤT CĂN CỨ PHÁP LÝ ĐÁNH GIÁ CBCC KPI (KPI_LEGAL_TRACEABILITY_MATRIX)
**HỆ THỐNG QUẢN LÝ NHIỆM VỤ VÀ ĐÁNH GIÁ CÁN BỘ, CÔNG CHỨC — UBND XÃ NGHĨA LÂM**
*Phiên bản: 2026.08.1 — Tích hợp Nghị định 335/2025/NĐ-CP & Báo cáo nghiên cứu KPI cấp xã*
*Nhánh Git: `feat/kpi-nd335-research-integration`*

---

## I. NGUYÊN TẮC PHÂN LOẠI CĂN CỨ PHÁP LÝ

Mọi quy tắc nghiệp vụ trong hệ thống `kpi.nghialam.com` bắt buộc phải được phân loại rõ ràng thành một trong bốn nhóm căn cứ:
1. **`LEGAL_MANDATORY`**: Các văn bản quy phạm pháp luật bắt buộc của Trung ương đang có hiệu lực thi hành:
   - Nghị định số 335/2025/NĐ-CP ngày 21/12/2025 của Chính phủ;
   - Quy định số 366-QĐ/TW ngày 30/8/2024 của Bộ Chính trị;
   - Luật Cán bộ, công chức số 80/2025/QH15.
2. **`OFFICIAL_GUIDANCE`**: Hướng dẫn nghiệp vụ chuyên môn chính thức của cơ quan có thẩm quyền cấp trên:
   - Sổ tay hướng dẫn theo dõi, đánh giá công chức của Bộ Nội vụ;
   - Văn bản hướng dẫn chuyên môn của Sở Nội vụ tỉnh Nghệ An.
3. **`LOCAL_INTERNAL_BASIS`**: Các quyết định, quy định nội bộ đã được cấp ủy, chính quyền xã Nghĩa Lâm ban hành chính thức:
   - Quyết định số 283/QĐ-UBND ngày 28/3/2026 của UBND xã Nghĩa Lâm;
   - Quy định số 295-QĐ/ĐU ngày 15/4/2026 của Đảng ủy xã Nghĩa Lâm.
4. **`LOCAL_POLICY_PROPOSAL`** / **`LEGAL_REVIEW_REQUIRED`**: Các đề xuất cụ thể hóa nội bộ trong Báo cáo nghiên cứu chưa được ban hành thành văn bản pháp lý chính thức. Các nội dung này hiển thị kèm cờ `LEGAL_REVIEW_REQUIRED`, bị vô hiệu hóa đối với xếp loại chính thức (`DISABLED_FOR_OFFICIAL_RATING`), và chỉ kích hoạt khi có Quyết định/Quy chế do Chủ tịch UBND xã phê duyệt.

---

## II. MA TRẬN TRUY XUẤT PHÁP LÝ CHI TIẾT ĐỐI CHIẾU BẢN GỐC NGHỊ ĐỊNH 335/2025/NĐ-CP

| STT | Nội dung nghiệp vụ | Văn bản căn cứ | Điều/khoản/điểm/phụ lục cụ thể | Phân loại | Quy tắc triển khai trong mã nguồn | Model / Controller / Service | Trạng thái |
|:---:|---|---|---|:---:|---|---|:---:|
| **1** | **Phạm vi & Đối tượng áp dụng** | Nghị định 335/2025/NĐ-CP; Luật Cán bộ, công chức | Điều 1, Điều 2 Khoản 1b, Khoản 2 NĐ 335; Điều 10 Luật CBCC | `LEGAL_MANDATORY` | Áp dụng cho CBCC xã Nghĩa Lâm. Tách bạch 3 nhóm: Cán bộ bầu cử (Chủ tịch/PCT); Công chức lãnh đạo/quản lý (Trưởng/Phó bộ phận); Công chức chuyên môn nghiệp vụ. | `server/src/models/User.ts`, `users.role` | **PASS** |
| **2** | **Vị trí việc làm & Danh mục VTVL** | QĐ 88/QĐ-UBND; Đề án VTVL xã Nghĩa Lâm | Phụ lục danh mục 33 VTVL xã Nghĩa Lâm | `LOCAL_INTERNAL_BASIS` | Quản lý định mức biên chế, mô tả công việc và khung năng lực chuẩn cấp xã. Mỗi công chức gắn liền 1 VTVL chính và tỷ trọng kiêm nhiệm (nếu có). | `job_positions` table, `jobPositionController.ts` | **PASS** |
| **3** | **Chu kỳ đánh giá & Khóa kỳ** | Nghị định 335/2025/NĐ-CP; Kế hoạch 51-KH/TU | Điều 3 Khoản 4, Điều 17 Khoản 3, Điều 19 NĐ 335 | `LEGAL_MANDATORY` | Đánh giá định kỳ hàng tháng theo mã `YYYY-MM`. Khi khóa kỳ, chặn sửa đổi; mở khóa yêu cầu quyền Lãnh đạo kèm lý do giải trình và lưu vết `audit_logs`. | `evaluation_periods`, `isPeriodLocked`, `lockPeriod` | **PASS** |
| **4** | **Thang điểm đánh giá (30/70)** | Nghị định 335/2025/NĐ-CP | Điều 12 Khoản 2, Khoản 3 NĐ 335 | `LEGAL_MANDATORY` | Tổng điểm tối đa 100 điểm: Tiêu chí chung tối đa 30.0 điểm; Tiêu chí kết quả thực hiện nhiệm vụ tối đa 70.0 điểm. Mã căn cứ: `ND335_2025_NDCP_ART12`. | `kpiCalculationEngine.ts` (`KPI_CONSTANTS.MAX_GENERAL_SCORE: 30`, `MAX_TASK_SCORE: 70`) | **PASS** |
| **5** | **Tiêu chí chung (Phần I - 30đ)** | Nghị định 335/2025/NĐ-CP; QĐ 283/QĐ-UBND; QĐ 295-QĐ/ĐU | Điều 12 Khoản 2 (Điểm a, b, c) NĐ 335; Phụ lục I QĐ 295 | `LOCAL_INTERNAL_BASIS` | Tối đa 30.0 điểm, gồm 3 nhóm: Chính trị tư tưởng (10đ); Chuyên môn nghiệp vụ (10đ); Đổi mới sáng tạo (10đ). Chấm dưới tối đa bắt buộc có nhận xét giải trình. | `evaluations.criteria_politics_*`, `criteria_expertise_*`, `criteria_innovation_*` | **PASS** |
| **6** | **Đề xuất phân rã tiêu chí chung 8/8/8/6** | Báo cáo nghiên cứu KPI cấp xã | Mục 3.3 Báo cáo nghiên cứu (Trang 8) | `LOCAL_POLICY_PROPOSAL` | Đề xuất chia 30 điểm thành 4 nhóm tiêu chí con (8/8/8/6). Chưa được ban hành quyết định sửa đổi $\rightarrow$ Giữ nguyên cấu hình 10/10/10 đã ban hành. | `LEGAL_REVIEW_REQUIRED` (Giữ chuẩn 10/10/10 của QĐ 283) | **LEGAL_REVIEW_REQUIRED** |
| **7** | **Danh mục sản phẩm & Hệ số quy đổi (K)** | Nghị định 335/2025/NĐ-CP; QĐ 283/QĐ-UBND | Điều 13 Khoản 1, 2 NĐ 335; Danh mục kèm QĐ 283 | `LEGAL_MANDATORY` | Mỗi sản phẩm có mã chuẩn hóa, tên, ĐVT, điểm chuẩn baseline ($5.0$đ) và hệ số quy đổi $K$ ($0.8 - 2.0$). Mã căn cứ: `ND335_2025_NDCP_ART13`. | `product_catalog` table, `catalogController.ts` | **PASS** |
| **8** | **Khối lượng giao & nghiệm thu quy đổi** | Nghị định 335/2025/NĐ-CP; Sổ tay Bộ Nội vụ | Điều 13 Khoản 1c, Điều 14 Khoản 1 NĐ 335 | `LEGAL_MANDATORY` | Giao quy đổi = $\sum(\text{assigned\_qty} \times K)$; Nghiệm thu quy đổi = $\sum(\text{accepted\_qty} \times K)$. Tuyệt đối không nhân trùng hệ số. | `tasks.weight`, `evaluation_details`, `kpiCalculationEngine.ts` | **PASS** |
| **9** | **Thành tố a: Tỷ lệ số lượng** | Nghị định 335/2025/NĐ-CP | Điều 14 Khoản 2 Điểm a NĐ 335 | `LEGAL_MANDATORY` | $a = \min(1.0, \frac{\text{completed\_converted}}{\text{assigned\_converted}})$. Mẫu số bằng 0 trả về `insufficientData: true`, không tự đạt tối đa. Mã căn cứ: `ND335_2025_NDCP_ART14`. | `kpiCalculationEngine.ts` (`a_quantity_ratio`) | **PASS** |
| **10** | **Thành tố b: Tỷ lệ chất lượng** | Nghị định 335/2025/NĐ-CP | Điều 14 Khoản 2 Điểm b NĐ 335 | `LEGAL_MANDATORY` | $b = \max(0, \min(1.0, \frac{\text{quality\_converted}}{\text{assigned\_converted}}))$, trừ 25% mỗi lần làm lại do lỗi chủ quan. Miễn trừ khi có cờ `is_exempted_rework`. | `kpiCalculationEngine.ts` (`b_quality_ratio`), `rework_count` | **PASS** |
| **11** | **Thành tố c: Tỷ lệ tiến độ** | Nghị định 335/2025/NĐ-CP | Điều 14 Khoản 2 Điểm c NĐ 335 | `LEGAL_MANDATORY` | $c = \max(0, \min(1.0, \frac{\text{on\_time\_converted}}{\text{assigned\_converted}}))$, trừ 25% mỗi lần chậm tiến độ chủ quan. Miễn trừ khi có cờ `is_exempted_delay`. | `kpiCalculationEngine.ts` (`c_progress_ratio`), `delay_count` | **PASS** |
| **12** | **Công thức Phần II cho Công chức chuyên môn** | Nghị định 335/2025/NĐ-CP | Điều 16 Khoản 1 NĐ 335 | `LEGAL_MANDATORY` | Điểm Phần II $= \frac{a + b + c}{3} \times 70.0$đ. Giao 1 hoàn thành 1 đúng hạn $\implies 70/70$đ; Giao 5 hoàn thành 1 $\implies 14/70$đ. Mã: `ND335_2025_NDCP_ART16`. | `kpiCalculationEngine.ts` (`taskScore`, `ND335_OFFICIAL_ABC`) | **PASS** |
| **13** | **Đánh giá Công chức Lãnh đạo (6 thành tố)** | Nghị định 335/2025/NĐ-CP | Điều 15 Khoản 1, 2, 3; Điều 16 Khoản 2 NĐ 335 | `LEGAL_MANDATORY` | Điểm Phần II $= \frac{a + b + c + d + đ + e}{6} \times 70.0$đ. $d$ (kết quả đơn vị), $đ$ (tổ chức), $e$ (đoàn kết). Mã: `ND335_2025_NDCP_ART15`. | `kpiCalculationEngine.ts` (`is_leadership_role`, $d, đ, e$) | **PASS** |
| **14** | **Đề xuất tự động $d = 50\%$ khi có công chức yếu** | Báo cáo nghiên cứu KPI cấp xã | Mục 3.4.b Báo cáo nghiên cứu (Trang 10) | `LOCAL_POLICY_PROPOSAL` | Tự động hạ $d = 50\%$ khi có công chức cấp dưới dưới 50 điểm $\rightarrow$ Cần phê duyệt trong Quy chế xã kèm cơ chế giải trình miễn trừ. | `LEGAL_REVIEW_REQUIRED` (Hỗ trợ cấu hình kèm audit log) | **LEGAL_REVIEW_REQUIRED** |
| **15** | **Tổng hợp điểm kết quả đánh giá** | Nghị định 335/2025/NĐ-CP | Điều 17 Khoản 1 NĐ 335 | `LEGAL_MANDATORY` | Tổng điểm $= \text{Tiêu chí chung (Max 30)} + (\text{Điểm kết quả nhiệm vụ} \times 70)$. Mã: `ND335_2025_NDCP_ART17`. | `kpiCalculationEngine.ts` (`totalScore`) | **PASS** |
| **16** | **Quy trình 3 bước (Tự chấm / Thẩm định / Phê duyệt)** | Nghị định 335/2025/NĐ-CP; Quy định 295-QĐ/ĐU | Điều 18 Khoản 2, Điều 21 NĐ 335; Điều 6 QĐ 295 | `LEGAL_MANDATORY` | Bước 1: Công chức tự chấm (`DRAFT` $\rightarrow$ `SUBMITTED`, Mẫu 01 Phụ lục II); Bước 2: Trưởng phòng thẩm định (`MANAGER_REVIEWED`); Bước 3: Chủ tịch phê duyệt (`APPROVED`, Mẫu 02 Phụ lục II). | `POST /api/evaluations/draft`, `submit`, `review`, `approve` | **PASS** |
| **17** | **Bốn mức xếp loại chất lượng công chức** | Nghị định 335/2025/NĐ-CP; Quy định 366-QĐ/TW | Điều 20 Khoản 1, 2, 3, 4 NĐ 335 | `LEGAL_MANDATORY` | (1) Xuất sắc: $\ge 90$đ; (2) Tốt: $70 - <90$đ; (3) Hoàn thành: $50 - <70$đ; (4) Không hoàn thành: $< 50$đ hoặc bị kỷ luật. Mã: `ND335_2025_NDCP_ART20`. | `calculateClassification` in `evaluationController.ts` | **PASS** |
| **18** | **Tỷ lệ khống chế Xuất sắc $\le 20\%$** | Nghị định 335/2025/NĐ-CP | Điều 20 Khoản 5 Điểm a, b NĐ 335 | `LEGAL_MANDATORY` | Xuất sắc không vượt quá 20% số công chức Hoàn thành tốt trở lên (tối đa 25% với tập thể xuất sắc nổi trội). Vượt trần phải có cờ `is_special_quota_case`. | `GET /api/evaluations/quota-stats`, `approveByLeadership` | **PASS** |
| **19** | **Quyền kiến nghị & Thời hạn phúc khảo (7 ngày)** | Nghị định 335/2025/NĐ-CP; Báo cáo nghiên cứu | Điều 24 NĐ 335; Mục 8.1 Báo cáo nghiên cứu | `LOCAL_POLICY_PROPOSAL` | Công chức có quyền kiến nghị đánh giá (Điều 24 NĐ 335 - `ND335_2025_NDCP_ART24`). Mốc thời hạn 07 ngày làm việc là đề xuất quy chế xã $\rightarrow$ Cần phê duyệt ban hành trong Quy chế. | `evaluation_appeals`, `POST /api/evaluations/:id/appeal` | **LEGAL_REVIEW_REQUIRED** |
| **20** | **Chiến lược tích lũy điểm `WEIGHTED_DETAIL_SCORE`** | Đề xuất mô hình tích lũy điểm cũ | Đề xuất kỹ thuật nội bộ | `LOCAL_POLICY_PROPOSAL` | Tích lũy điểm trực tiếp theo từng sản phẩm. **Bị vô hiệu hóa đối với xếp loại chính thức (`DISABLED_FOR_OFFICIAL_RATING`)**; chỉ kích hoạt khi có Quy chế phê duyệt. | `strategyStatus = DISABLED_FOR_OFFICIAL_RATING`, `rating = null` | **LEGAL_REVIEW_REQUIRED** |

---

## III. TỔNG HỢP CÁC NỘI DUNG `LEGAL_REVIEW_REQUIRED` CẦN LÃNH ĐẠO XÃ PHÊ DUYỆT

1. **Phân rã tiêu chí chung 8/8/8/6**: Hiện hệ thống giữ chuẩn 10/10/10 theo QĐ 283/QĐ-UBND và QĐ 295-QĐ/ĐU. Cần Quyết định sửa đổi của Chủ tịch UBND xã nếu muốn chuyển sang 8/8/8/6.
2. **Quy tắc tự động $d = 50\%$ đối với Trưởng phòng khi có công chức yếu**: Cần quy định rõ trong Quy chế đánh giá CBCC của xã kèm cơ chế giải trình miễn trừ.
3. **Thời hạn kiến nghị phúc khảo 07 ngày làm việc**: Cần quy định cụ thể thời hạn trong Quy chế đánh giá CBCC của xã (theo Điều 24 NĐ 335).
4. **Giới hạn nhập nhật ký lùi 07 ngày và tối đa 03 nhiệm vụ đột xuất/tháng**: Cần quy định trong văn bản nội bộ về quy chế vận hành phần mềm.
5. **Tiêu chí phụ xếp hạng khi bằng điểm ở mức 90đ**: Cần Hội đồng đánh giá xã thông qua thứ tự ưu tiên (Hệ số quy đổi, số lần chậm trễ, sáng kiến, biểu quyết).
6. **Phương thức tích lũy điểm `WEIGHTED_DETAIL_SCORE`**: Ở trạng thái `DISABLED_FOR_OFFICIAL_RATING`. Chỉ được sử dụng làm công thức xếp loại chính thức khi có văn bản quy chế địa phương phê duyệt.
