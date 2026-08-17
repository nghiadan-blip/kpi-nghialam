# YÊU CẦU RÀ SOÁT PHÁP LÝ CUỐI TRƯỚC KHI MERGE

## Kết luận hiện tại

Kết quả kỹ thuật của branch `feat/complete-project-lifecycle-management` đạt tốt: RBAC, linking, workflow, migration, test UAT và build đều đã có kết quả PASS.

Tuy nhiên, chỉ được kết luận **nghiệm thu kỹ thuật có điều kiện** cho đến khi hoàn tất rà soát pháp lý sau.

## Nội dung phải sửa/xác minh

1. Báo cáo đang ghi “Luật Đầu tư công 2019”. Phải rà soát và cập nhật theo Luật Đầu tư công số `58/2024/QH15`, ban hành ngày 29/11/2024, có hiệu lực từ 01/01/2025.
2. Kiểm tra Nghị định `40/2020/NĐ-CP` còn áp dụng ở nội dung nào, có điều khoản chuyển tiếp/sửa đổi/thay thế nào sau Luật 58/2024/QH15.
3. Kiểm tra Nghị định `99/2021/NĐ-CP` và các văn bản sửa đổi/hướng dẫn hiện hành về quản lý, thanh toán, quyết toán vốn đầu tư công.
4. Rà soát căn cứ Luật Xây dựng, Nghị định 15/2021/NĐ-CP, Nghị định 99/2021/NĐ-CP, Thông tư 23/2023 và các văn bản liên quan theo đúng phạm vi từng bước; không đưa văn bản vào chung chung.
5. Xác minh lại thẩm quyền ký của HĐND, UBND xã, Chủ tịch UBND xã, Hội đồng thẩm định và Chủ đầu tư/BQLDA. Không tự suy ra thẩm quyền ký chỉ từ role phần mềm.
6. Xác minh nhóm dự án A/B/C, phân cấp quyết định chủ trương/quyết định đầu tư, kế hoạch vốn, lựa chọn nhà thầu và quyết toán tại Nghệ An/xã Nghĩa Lâm.
7. Xác minh thời hạn bảo hành theo hợp đồng và loại công trình; không hard-code 12 tháng.
8. Xác minh ngưỡng cảnh báo Progress Gap 15%/30% là cấu hình quản trị, không phải kết luận pháp lý hay mặc định bắt buộc.

## Tài liệu phải tạo/cập nhật

Cập nhật `KPI_LEGAL_TRACEABILITY_MATRIX.md` hoặc tạo `PROJECT_LEGAL_TRACEABILITY_MATRIX.md` với các cột:

| Bước | Nội dung | Văn bản | Điều/khoản/phụ lục | Hiệu lực/chuyển tiếp | Thẩm quyền | Sản phẩm/hồ sơ | Rule/code |
|---:|---|---|---|---|---|---|---|

Mỗi bước trong 16 bước phải có căn cứ riêng. Không chấp nhận một danh sách văn bản chung mà không chỉ ra điều khoản áp dụng.

Nếu chưa xác minh được thì ghi `LEGAL_REVIEW_REQUIRED` và không cho hệ thống tự động phát hành văn bản hoặc chuyển bước chính thức.

## Kiểm thử hồi quy sau rà soát

- Build server/client và toàn bộ test hiện có phải vẫn đạt.
- Test lại 16 gate sau khi cập nhật căn cứ.
- Test RBAC Công chức, Trưởng bộ phận, Lãnh đạo và Admin.
- Test dữ liệu cũ và migration không bị thay đổi sai.
- Test báo cáo tổng vốn/giải ngân không bị nhân bản.
- Test không chuyển nghiệm thu/quyết toán khi thiếu hồ sơ.

## Điều kiện merge

Chỉ merge Draft PR khi:

- căn cứ pháp lý đã cập nhật theo văn bản hiện hành;
- có bảng truy xuất điều/khoản/phụ lục;
- các điểm chưa chắc chắn đã đánh dấu `LEGAL_REVIEW_REQUIRED`;
- `IMPLEMENTATION_NOTES.md` ghi rõ đây là nghiệm thu kỹ thuật hay nghiệm thu pháp lý;
- không còn viện dẫn Luật Đầu tư công 2019 như căn cứ hiện hành cho quy trình năm 2026 nếu không có lý do chuyển tiếp cụ thể.

Không deploy production database trước khi hoàn tất bước trên và có phê duyệt thủ công.
