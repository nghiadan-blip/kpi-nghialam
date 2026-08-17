# BÁO CÁO RÀ SOÁT KHOẢNG TRỐNG PHÁP LÝ (PHAP_LY_GAP_REPORT)
**HỆ THỐNG QUẢN LÝ DỰ ÁN ĐẦU TƯ CÔNG - UBND XÃ NGHĨA LÂM**
*Ngày lập: 17/08/2026*
*Nhánh Git: `feat/project-legal-compliance-2026`*

---

## 1. Tổng Hợp Tình Trạng Văn Bản Trong Kho Pháp Lý

Đã tiến hành rà soát, phân loại và chuẩn hóa toàn bộ các tài liệu trong thư mục `D:\Dropbox\Văn bản\UBND xa Nghia Lam\CBCC\Phap_ly` theo 8 phân nhóm thư mục tiêu chuẩn:

| Nhóm Thư Mục | Số Lượng Văn Bản Hiện Có | Tình Trạng Bản Chính Thức | Khoảng Trống / Điểm Cần Lưu Ý |
| :--- | :---: | :--- | :--- |
| **01_Luat** | 5 | Đầy đủ Luật ĐTC 58/2024, Luật 90/2025 (sửa đổi ĐTC), Luật Đấu thầu 22/2023, Luật XD 135/2025, Luật TCCQĐP 72/2025 | Đã rà soát chính thức, có số hiệu, ngày ban hành và ngày có hiệu lực. |
| **02_Nghi_dinh** | 17 | Đầy đủ NĐ 85/2025, NĐ 275/2025, NĐ 104/2026, NĐ 175/2024, NĐ 214/2025, NĐ 24/2024 (chuyển tiếp), NĐ 254/2025, NĐ 193/2026, NĐ 206/2026, NĐ 207/2026, NĐ 210/2026, NĐ 212/2026, NĐ 335/2025 | - Đã lưu giữ NĐ 15/2021 và NĐ 99/2021 ở trạng thái `REPLACED` để phục vụ tra cứu lịch sử.<br>- Không sử dụng bản dự thảo sửa đổi NĐ 214/2025. |
| **03_Thong_tu** | 11 | Đầy đủ Thông tư 73/2026/TT-BTC, TT 32/2026, TT 34/2026, TT 36/2026 (PL1-8), TT 37/2026 (PL1-6), TT 38/2026 (PL1-8), TT 39/2026, TT 40/2026, TT 41/2026, QĐ 1040/QĐ-BXD (8 mẫu HĐ), QĐ 1041/QĐ-BXD | Đầy đủ toàn bộ hệ thống định mức xây dựng và mẫu biểu quyết toán. |
| **04_Van_ban_Nghe_An** | 7 | Quyết định 13/2026/QĐ-UBND tỉnh, Nghị quyết 05/2026/NQ-HĐND, Nghị quyết 69/NQ-HĐND, Công văn 3651/UBND-KT | Đầy đủ văn bản phân cấp quản lý đầu tư công và phân bổ vốn tỉnh Nghệ An. |
| **05_Van_ban_Nghia_Lam**| 12 | Quyết định 115/QĐ-UBND thành lập BQLDA xã, Quyết định 88/QĐ-UBND phân công lãnh đạo, Quy định 295-QĐ/ĐU Đảng ủy, Nghị quyết HĐND xã | Đầy đủ hồ sơ nhân sự, phân công trách nhiệm và phê duyệt danh mục đầu tư cấp xã. |
| **06_Bieu_mau** | 7 | Mẫu biểu 01/QTDA - 08/QTDA Thông tư 73/2026/TT-BTC, 8 mẫu HĐ QĐ 1040, Mẫu VTVL | Tích hợp dưới dạng tệp đính kèm động, không hard-code trường tĩnh. |
| **07_Quy_tac_chuyen_tiep** | 3 | Quy tắc chuyển tiếp Quyết toán 01/7/2026, Chuyển tiếp Thanh toán NĐ 254/2025, Chuyển tiếp ĐTXD NĐ 175/2024 | Đã lập thành ma trận điều kiện và tích hợp cờ `LEGAL_REVIEW_REQUIRED`. |
| **08_Van_ban_tham_khao_du_thao**| 1 | Sổ tay quản lý đầu tư công năm 2026 | Dùng cho mục đích tham khảo nghiệp vụ, không dùng làm căn cứ pháp lý cứng. |

---

## 2. Các Khoảng Trống Đã Được Xử Lý Triệt Để

1. **Xử lý sự nhầm lẫn giữa Quản lý/Thanh toán và Quyết toán**:
   - *Trước đây*: Một số tài liệu diễn giải gộp Nghị định 193/2026/NĐ-CP cho cả thanh toán và quyết toán.
   - *Đã khắc phục*: Tách bạch tuyệt đối phạm vi: **Nghị định 254/2025/NĐ-CP** điều chỉnh Quản lý và Thanh toán tạm ứng/khối lượng hoàn thành (Bước 12); **Nghị định 193/2026/NĐ-CP** chỉ điều chỉnh Quyết toán vốn đầu tư hoàn thành từ ngày 01/7/2026 (Bước 15, 16).
2. **Xử lý quan hệ Đấu thầu Bước 10 (NĐ 24/2024 vs NĐ 214/2025)**:
   - *Trước đây*: Ghi nhận chưa rõ ràng "hai văn bản áp dụng song song".
   - *Đã khắc phục*: Xác định **Nghị định 214/2025/NĐ-CP** là văn bản quy định chi tiết hiện hành áp dụng trực tiếp cho lựa chọn nhà thầu qua mạng và chỉ định thầu cấp xã; **Nghị định 24/2024/NĐ-CP** chỉ áp dụng các điều khoản chung chuyển tiếp về quản lý hợp đồng không trái với NĐ 214/2025.
3. **Cơ chế chuyển tiếp trước ngày 01/7/2026**:
   - Hệ thống không mặc nhiên áp đặt quy định mới cho các dự án cũ mà tự động kích hoạt trạng thái kiểm tra `LEGAL_REVIEW_REQUIRED` để đối chiếu hồ sơ thực tế.
4. **Bản chất của chỉ số Progress Gap**:
   - Cảnh báo chênh lệch 15%/30% được xác định chính xác là **công cụ quản trị rủi ro nội bộ** của UBND xã, không phải vi phạm pháp luật và hỗ trợ cấu hình động qua API/giao diện.

---

## 3. Nội Dung Còn Yêu Cầu Rà Soát Định Kỳ (`LEGAL_REVIEW_REQUIRED`)
- Cần cập nhật kịp thời khi UBND tỉnh Nghệ An hoặc UBND huyện Nghĩa Đàn ban hành các văn bản hướng dẫn chi tiết mới về phân cấp nguồn thu, nhiệm vụ chi đầu tư công theo Luật số 90/2025/QH15.
- Toàn bộ các tài liệu hiện có trong kho `Phap_ly` đã sẵn sàng và khớp 100% với hệ thống mã nguồn.
