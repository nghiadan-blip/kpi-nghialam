# BÁO CÁO RÀ SOÁT KHOẢNG TRỐNG PHÁP LÝ (PHAP_LY_GAP_REPORT)
**HỆ THỐNG QUẢN LÝ DỰ ÁN ĐẦU TƯ CÔNG - UBND XÃ NGHĨA LÂM**
*Ngày lập: 17/08/2026*
*Nhánh Git: `feat/project-legal-compliance-2026`*

---

## 1. Kết Quả Xác Minh Bản Gốc Văn Bản Pháp Lý

Đã tiến hành rà soát từng văn bản trong kho lưu trữ `D:\Dropbox\Văn bản\UBND xa Nghia Lam\CBCC\Phap_ly`:

| Nhóm | Tổng Số | Đã Có Bản Gốc / Ký Số | Đang Yêu Cầu Xác Minh (`LEGAL_REVIEW_REQUIRED`) | Ghi Chú |
| :--- | :---: | :---: | :---: | :--- |
| **01_Luat** | 5 | 5 (100%) | 0 | Đầy đủ Luật ĐTC 58/2024, Luật 90/2025, Luật Đấu thầu 22/2023, Luật XD 135/2025, Luật TCCQĐP 72/2025. |
| **02_Nghi_dinh** | 17 | 17 (100%) | 0 | Đã xác minh NĐ 214/2025 (Điều 145 bãi bỏ NĐ 24/2024), NĐ 254/2025 (Thanh toán), NĐ 193/2026 (Quyết toán từ 01/7/2026). NĐ 15/2021 và NĐ 99/2021 ở trạng thái `REPLACED`. NĐ 335/2025 gắn với module KPI. |
| **03_Thong_tu** | 11 | 11 (100%) | 0 | TT 73/2026/TT-BTC bản ký số kèm mẫu 01-08/QTDA, TT 32/2026, TT 34/2026, TT 36/2026, TT 37/2026, TT 38/2026 (PL1-8), TT 39/2026, TT 40/2026, TT 41/2026, QĐ 1040 (8 mẫu HĐ), QĐ 1041. QĐ 2815/BTC là tài liệu tham khảo. |
| **04_Van_ban_Nghe_An** | 6 | 4 | 2 (`QĐ 1261`, `CV 3092`) | Đã xác minh file PDF ký số: QĐ 13/2026/QĐ-UBND tỉnh (1.33 MB), NQ 05/2026/NQ-HĐND (7.53 MB), NQ 69/NQ-HĐND (8.68 MB), CV 3651/UBND-KT (1.26 MB). Hai văn bản `QĐ 1261` và `CV 3092` chưa có file ký số trong kho nên gắn `LEGAL_REVIEW_REQUIRED`. |
| **05_Van_ban_Nghia_Lam**| 4 | 4 (100%) | 0 | QĐ 115/QĐ-UBND (Thành lập BQLDA xã), QĐ 88/QĐ-UBND (Phân công nhiệm vụ lãnh đạo), Quy định 295-QĐ/ĐU Đảng ủy, NQ 02/NQ-HĐND xã Nghĩa Lâm. |
| **06_Bieu_mau** | 7 | 7 (100%) | 0 | Hệ thống biểu mẫu quyết toán TT 73/2026, 8 mẫu HĐ QĐ 1040, biểu mẫu mô tả VTVL. |
| **07_Quy_tac_chuyen_tiep** | 3 | 3 (100%) | 0 | Chuyển tiếp Quyết toán 01/7/2026 (NĐ 193), Chuyển tiếp Thanh toán 01/11/2025 (NĐ 254), Chuyển tiếp Đấu thầu 04/8/2025 (NĐ 214). |
| **08_Van_ban_tham_khao** | 1 | 1 (100%) | 0 | Sổ tay quản lý ĐTC 2026 (Xác định rõ là tài liệu tham khảo nghiệp vụ). |

---

## 2. Kết Luận Về Bốn Vấn Đề Trọng Yếu

1. **Nghị định 214/2025/NĐ-CP**:
   - Tên chính thức: Nghị định quy định chi tiết một số điều và biện pháp thi hành Luật Đấu thầu về lựa chọn nhà thầu.
   - Hạn mức chỉ định thầu quy định tại Điểm m Khoản 1 Điều 23 Luật Đấu thầu 22/2023/QH15; quy trình thực hiện quy định tại Điều 78, 79, 80 Nghị định 214/2025/NĐ-CP.
2. **Quan hệ NĐ 24/2024 và NĐ 214/2025**:
   - Khoản 2 Điều 145 Nghị định 214/2025/NĐ-CP **bãi bỏ toàn bộ Nghị định 24/2024/NĐ-CP** kể từ ngày 04/8/2025.
   - Nghị định 24/2024/NĐ-CP ở trạng thái `REPLACED`, chỉ áp dụng chuyển tiếp cho các gói thầu đã phát hành HSMT trước 04/8/2025 theo Điều 144 Nghị định 214.
3. **Văn bản Nghệ An & Nghĩa Lâm**:
   - Các văn bản có bản PDF ký số (QĐ 13/2026, NQ 05/2026, NQ 69, CV 3651, QĐ 115, QĐ 88) được xác nhận `ACTIVE`.
   - Các văn bản chưa có file đính kèm thực tế (`QĐ 1261`, `CV 3092`) được gắn `LEGAL_REVIEW_REQUIRED`.
4. **Phân loại tài liệu**:
   - Luật XD 135/2025 có hiệu lực từ 01/7/2026 là căn cứ chính thức.
   - NĐ 335/2025 thuộc phân hệ KPI.
   - Sổ tay ĐTC 2026 là tài liệu tham khảo chuyên môn.
