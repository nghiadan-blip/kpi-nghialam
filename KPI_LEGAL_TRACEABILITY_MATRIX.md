# MA TRẬN TRUY XUẤT PHÁP LÝ ĐÁNH GIÁ CBCC KPI (KPI LEGAL TRACEABILITY MATRIX)

Hệ thống Quản lý nhiệm vụ và đánh giá CBCC — UBND xã Nghĩa Lâm (`kpi.nghialam.com`)

---

## 1. Căn Cứ Pháp Lý & Văn Bản Áp Dụng

1. **Nghị định số 335/2025/NĐ-CP** ngày 31/12/2025 của Chính phủ về đánh giá, xếp loại chất lượng cán bộ, công chức, viên chức.
2. **Sổ tay Hướng dẫn của Bộ Nội vụ** (kèm Quyết định ban hành bộ tiêu chí và danh mục công việc/sản phẩm chuẩn).
3. **Kế hoạch số 51-KH/TU** ngày 07/5/2026 của Ban Thường vụ Tỉnh ủy Nghệ An về nâng cao hiệu quả đánh giá cán bộ, công chức.
4. **Hướng dẫn của Sở Nội vụ tỉnh Nghệ An** về xây dựng danh mục vị trí việc làm, hệ số phức tạp công việc $K$ và quy đổi sản phẩm.
5. **Quy định số 295-QĐ/ĐU** ngày 09/4/2026 của Ban Thường vụ Đảng ủy xã Nghĩa Lâm về tiêu chuẩn, quy trình đánh giá, xếp loại cán bộ, công chức và đảng viên.

---

## 2. Ma Trận Truy Xuất Chi Tiết

| Nội dung nghiệp vụ | Văn bản căn cứ | Điều/khoản/phụ lục/trang | Quy tắc phải triển khai | File/API/model/configuration liên quan | Trạng thái |
|---|---|---|---|---|---|
| **Đối tượng đánh giá** | NĐ 335/2025/NĐ-CP; Quy định 295-QĐ/ĐU | Điều 2 NĐ 335; Điều 3 QĐ 295 | Phân loại rõ 3 nhóm đối tượng: (1) Lãnh đạo UBND xã (Chủ tịch, Phó Chủ tịch); (2) Trưởng/Phó bộ phận chuyên môn; (3) Công chức chuyên môn/nghiệp vụ. | `server/src/controllers/authController.ts`, `server/src/models/User.ts`, `users` table | **HOÀN THÀNH** |
| **Kỳ đánh giá & Khóa kỳ** | NĐ 335/2025/NĐ-CP; Kế hoạch 51-KH/TU | Điều 15 NĐ 335; Mục II.2 KH 51 | Đánh giá định kỳ hàng tháng theo định dạng `YYYY-MM`. Khi khóa kỳ, chặn mọi hành vi thêm/sửa/xóa phiếu và nhiệm vụ thuộc kỳ (chỉ mở khóa bởi Lãnh đạo có audit log). | `server/src/controllers/evaluationController.ts` (`isPeriodLocked`, `lockEvaluationPeriod`), `evaluation_periods` table | **HOÀN THÀNH** |
| **Tiêu chí chung (Phần I)** | NĐ 335/2025/NĐ-CP; Quy định 295-QĐ/ĐU | Điều 3, Điều 4 NĐ 335; Phụ lục I QĐ 295 | Tối đa 30.0 điểm, gồm 3 tiêu chí: Chính trị tư tưởng & đạo đức (10đ), Tác phong công tác & chuyên môn (10đ), Ý thức tổ chức kỷ luật & sáng kiến (10đ). | `server/src/services/kpiCalculationEngine.ts`, `evaluations` table (`criteria_politics_*`, `criteria_expertise_*`, `criteria_innovation_*`) | **HOÀN THÀNH** |
| **Kết quả nhiệm vụ (Phần II)** | NĐ 335/2025/NĐ-CP; Sổ tay BNV | Điều 5 NĐ 335; Chương III Sổ tay BNV | Tối đa 70.0 điểm. Tính trực tiếp từ tổng điểm các sản phẩm/công việc chuẩn có trọng số (`WEIGHTED_DETAIL_SCORE`), nhân hệ số trừ điểm chậm hạn/sai sót. Tuyệt đối không gán cứng 70đ. | `server/src/services/kpiCalculationEngine.ts`, `server/src/controllers/evaluationController.ts` | **HOÀN THÀNH** |
| **Sản phẩm/công việc chuẩn** | Danh mục QĐ kèm NĐ 335; Sổ tay BNV | Danh mục công việc chuẩn cấp xã; QĐ 15.6 BNV | Danh mục sản phẩm chuẩn có mã, tên, đơn vị tính, điểm cơ sở (baseline 5.0đ) và gắn trực tiếp với vị trí việc làm. | `server/src/controllers/catalogController.ts`, `product_catalog` table | **HOÀN THÀNH** |
| **Hệ số quy đổi ($K$)** | Hướng dẫn Sở Nội vụ Nghệ An | Mục 3 Hướng dẫn SNV; Bảng hệ số K | Hệ số phức tạp $K$ từ 0.8 đến 2.0 tùy theo tính chất công việc (đơn giản: 0.8, chuẩn: 1.0, phức tạp/đột xuất: 1.2–2.0). | `product_catalog.coefficient`, `tasks.weight` | **HOÀN THÀNH** |
| **Số lượng / Chất lượng / Tiến độ** | NĐ 335/2025/NĐ-CP; Sổ tay BNV | Điều 6 NĐ 335; Mục 4 Sổ tay BNV | Điểm dòng = $Qty \times Baseline \times K$. Trừ điểm tiến độ khi có chậm hạn (`delay_count`), trừ điểm chất lượng khi có sai sót làm lại (`rework_count`). | `server/src/services/kpiCalculationEngine.ts`, `evaluation_details` table | **HOÀN THÀNH** |
| **Quy trình 3 bước (Tự chấm / Thẩm định / Phê duyệt)** | NĐ 335/2025/NĐ-CP; Quy định 295-QĐ/ĐU | Điều 18, 19, 20 NĐ 335; Điều 6 QĐ 295 | (1) Công chức tự chấm và nộp phiếu; (2) Trưởng phòng/Bộ phận thẩm định, cho ý kiến nhận xét tập thể; (3) Lãnh đạo UBND xã phê duyệt kết luận và thông báo kết quả. | `server/src/controllers/evaluationController.ts` (`saveDraftEvaluation`, `reviewByManager`, `approveByLeadership`) | **HOÀN THÀNH** |
| **Phân quyền giao việc (RBAC)** | Quy định 295-QĐ/ĐU; Luật Cán bộ, công chức | Điều 9 QĐ 295; Điều 10 Luật CBCC | Chỉ ADMIN, Lãnh đạo UBND xã và Trưởng bộ phận (trong phạm vi phòng) mới có quyền tạo/giao nhiệm vụ. Công chức không được tự giao việc qua API. | `server/src/controllers/taskController.ts` (`createTask`), `server/test_rbac_task_assignment.ts` | **HOÀN THÀNH** |
| **Xếp loại chất lượng** | NĐ 335/2025/NĐ-CP | Điều 22 NĐ 335 | Xuất sắc: $\ge 90$đ (khống chế $\le 20\%$ tổng số hoàn thành tốt trở lên); Tốt: $70 - 89.9$đ; Hoàn thành: $50 - 69.9$đ; Không hoàn thành: $< 50$đ hoặc bị kỷ luật. | `calculateClassification` in `evaluationController.ts`, `kpiCalculationEngine.ts` | **HOÀN THÀNH** |
| **Hồ sơ, Audit & Lưu trữ** | NĐ 335/2025/NĐ-CP; Luật Lưu trữ | Điều 25 NĐ 335 | Lưu trữ toàn bộ lịch sử thao tác, điểm trước/sau, công thức tính (`auditFormula`), ý kiến nhận xét và thông báo kết quả qua email tự động. | `audit_logs` table, `emailService.ts`, `GET /api/evaluations/forms/:id` | **HOÀN THÀNH** |

---

## 3. Ghi Chú Căn Cứ & Xử Lý Ngoại Lệ

1. **Trường hợp ngoại lệ hạn ngạch 20% Xuất sắc**: Khi số cán bộ đạt mức Xuất sắc vượt quá 20% trong tháng, hệ thống bắt buộc Người phê duyệt phải bật cờ `is_special_quota_case` và nhập lý do giải trình thành tích đặc biệt xuất sắc/đột xuất (`special_quota_justification`).
2. **Chiến lược tính điểm duy nhất**: Hệ thống sử dụng chiến lược `WEIGHTED_DETAIL_SCORE` (Version `2026.08.1`) làm chuẩn duy nhất toàn hệ thống, đảm bảo tính minh bạch, nhất quán và có thể kiểm toán.
