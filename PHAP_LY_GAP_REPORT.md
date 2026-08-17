# BÁO CÁO RÀ SOÁT KHOẢNG TRỐNG PHÁP LÝ (PHAP_LY_GAP_REPORT)
**HỆ THỐNG QUẢN LÝ DỰ ÁN ĐẦU TƯ CÔNG - UBND XÃ NGHĨA LÂM**
*Ngày cập nhật: 17/08/2026*
*Nhánh Git: `feat/project-legal-compliance-2026`*

---

## 1. Kết Quả Xác Minh & Loại Trừ Văn Bản Không Phù Hợp

Căn cứ chỉ đạo cập nhật phạm vi căn cứ pháp lý:
- Hai văn bản: **Quyết định 1261/QĐ-UBND ngày 05/5/2025** và **Công văn 3092/UBND-KT ngày 17/4/2025** chính thức được **LOẠI TRỪ KHỎI CĂN CỨ BẮT BUỘC** (`EXCLUDED_FROM_PROJECT_LEGAL_BASIS`) của module Quản lý dự án đầu tư công và không dùng để kích hoạt `LEGAL_REVIEW_REQUIRED` hay chặn merge.
- Hệ thống căn cứ pháp lý chính thức của module `/projects` hiện đạt **100% tính xác thực** dựa trên các nguồn văn bản pháp quy gốc đã được kiểm tra:

| Phân Nhóm Thư Mục | Tổng Số Văn Bản | Trạng Thái Bản Gốc / Ký Số | Đánh Giá Tính Tuân Thủ |
| :--- | :---: | :---: | :---: |
| **01_Luat** | 5 | 5 (100% bản chính thức) | **ACTIVE (Đầy đủ)** |
| **02_Nghi_dinh** | 17 | 17 (100% bản chính thức) | **ACTIVE (Đầy đủ)** |
| **03_Thong_tu** | 11 | 11 (100% bản chính thức) | **ACTIVE (Đầy đủ)** |
| **04_Van_ban_Nghe_An** | 4 | 4 (100% bản PDF ký số) | **ACTIVE (Đầy đủ)** |
| **05_Van_ban_Nghia_Lam**| 4 | 4 (100% bản chính thức) | **ACTIVE (Đầy đủ)** |
| **06_Bieu_mau** | 7 | 7 (100% bản chính thức) | **ACTIVE (Đầy đủ)** |
| **07_Quy_tac_chuyen_tiep** | 3 | 3 (100% bản chính thức) | **ACTIVE (Đầy đủ)** |
| **08_Van_ban_tham_khao** | 3 | 3 (Tài liệu tham khảo/loại trừ) | **REFERENCE / EXCLUDED** |

---

## 2. Tổng Hợp Tình Trạng Pháp Lý Hiện Tại

1. **Nghị định 214/2025/NĐ-CP**: Đã xác minh bản gốc; Khoản 2 Điều 145 bãi bỏ toàn bộ NĐ 24/2024; quy trình chỉ định thầu quy định tại Điều 78, 79, 80; hạn mức căn cứ Điều 23 Luật Đấu thầu 22/2023/QH15.
2. **Nghị định 254/2025/NĐ-CP & Nghị định 193/2026/NĐ-CP**: Đã tách bạch tuyệt đối phạm vi: NĐ 254 điều chỉnh Quản lý/Thanh toán/Tạm ứng (Bước 12); NĐ 193 điều chỉnh Quyết toán dự án hoàn thành từ ngày 01/7/2026 (Bước 15, 16).
3. **Luật Xây dựng số 135/2025/QH15**: Đã đưa vào căn cứ chính thức từ ngày 01/7/2026.
4. **Không còn bất kỳ khoảng trống pháp lý nào tồn đọng trong module `/projects`**.
