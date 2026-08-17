# LỆNH ANTIGRAVITY — FIX KHẨN CẤP CÔNG THỨC ĐIỂM KPI

## Chế độ thực thi

Thực thi trên repository hiện tại `cbcc-app`.

Khi IDE hỏi quyền đối với thao tác đọc, sửa file, chạy test hoặc build trong repository, chọn **Yes, and always allow ...**.

Không cấp quyền tự động cho SSH, VPS, production database, PM2, Nginx, deploy hoặc xóa dữ liệu thật. Không tự merge và không tự deploy production.

Tạo branch mới: `fix/critical-kpi-task-score-calculation`.

Đọc trước `MASTER_SPEC.md`, `CLAUDE.md`, `AGENTS.md`, `IMPLEMENTATION_NOTES.md`, đặc tả KPI, model `Evaluation`, controller/service tính điểm, migration, trang phiếu đánh giá và test hiện có.

## Lỗi phải xử lý ngay

Trong phiếu đánh giá KPI, phần II “Điểm nhiệm vụ quy đổi” luôn hiển thị và lưu đúng mức tối đa `70/70`, không phụ thuộc vào điểm tự chấm từng sản phẩm.

Ví dụ tái hiện:

- Cán bộ “Quản trị hệ thống” có một sản phẩm, tự chấm `5` điểm.
- Phiếu vẫn hiển thị “Điểm nhiệm vụ quy đổi: 70/70”.
- Bấm “Lưu Nháp”, tổng tự chấm nhảy từ `5` lên `95` (`25` phần I + `70` phần II).
- Thêm hoặc xóa sản phẩm không làm thay đổi điểm phần II.

Đây là lỗi P0 ảnh hưởng trực tiếp đến công bằng, xếp loại và kết quả đánh giá công chức. Không được chỉ sửa phần hiển thị; phải sửa toàn bộ luồng dữ liệu từ chi tiết phiếu đến API lưu và API danh sách.

## Nguyên tắc sửa công thức

1. Không hard-code phần II bằng `70` khi chưa có dữ liệu tính toán.
2. Điểm phần II phải được tính từ các dòng sản phẩm/nhiệm vụ thực tế của phiếu.
3. Mỗi dòng phải truy xuất được: mã nhiệm vụ/sản phẩm, số lượng giao, số lượng hoàn thành, hệ số K, điểm tự chấm, điểm quản lý/thẩm định nếu có, chất lượng, tiến độ, minh chứng và trạng thái nghiệm thu.
4. Điểm tự chấm từng dòng phải không âm và không vượt trần của dòng hoặc nhóm công việc.
5. Tổng điểm phần II phải lấy từ dữ liệu chi tiết và được giới hạn theo mức tối đa của phần II là `70` điểm.
6. Nếu hệ thống dùng công thức quy đổi theo sản lượng, hệ số K và điểm sản phẩm chuẩn, phải dùng đúng cấu hình hiện có; không tự ý thay đổi căn cứ pháp lý.
7. Nếu có cách tính khác nhau theo loại vị trí công chức, phải dùng strategy/configuration cho chuyên môn nghiệp vụ, hỗ trợ phục vụ, lãnh đạo quản lý.
8. Không tính một sản phẩm chỉ vì sản phẩm tồn tại; phải tính theo điểm/khối lượng thực tế và điều kiện nghiệm thu của dòng.

## Yêu cầu kỹ thuật bắt buộc

### Backend

- Tìm toàn bộ nơi tính `task_score_self`, `task_score_mgr`, `task_score`, `common_score`, `total_score`, `self_score`, `manager_score`.
- Xác định một hàm/service tính điểm duy nhất làm nguồn sự thật.
- Không để frontend gửi tổng điểm cuối cùng để backend tin tưởng trực tiếp.
- Khi lưu nháp, backend phải tính lại:

```text
task_score_self = calculateTaskSection(details, configuration)
self_score = common_score_self + task_score_self
```

- Khi tải danh sách và khi mở phiếu, dùng cùng kết quả tính toán.
- Ghi audit log khi điểm chi tiết hoặc tổng điểm thay đổi.

### Frontend

- Ô “Điểm nhiệm vụ quy đổi” hiển thị giá trị thực tế, ví dụ `5/70`, không tự hiển thị `70/70`.
- Khi sửa, thêm hoặc xóa dòng sản phẩm, phần II và tổng điểm cập nhật ngay.
- Sau “Lưu Nháp”, tải lại trang vẫn giữ đúng điểm.
- Danh sách đánh giá phải hiển thị cùng giá trị với chi tiết phiếu.
- Đổi đơn vị trên trang chủ từ `95 đ` thành `95 điểm`.

## Kiểm thử bắt buộc

Tạo test đơn vị, API và E2E cho các trường hợp:

1. Một sản phẩm tự chấm `5`: điểm phần II là `5` hoặc giá trị quy đổi đúng theo cấu hình, không phải `70`.
2. Một sản phẩm tự chấm `0`: điểm phần II là `0`.
3. Hai sản phẩm cùng tự chấm `5`: tổng phần II tăng đúng theo công thức, không giữ cố định ở `70`.
4. Xóa một dòng: tổng điểm giảm đúng theo dòng bị xóa.
5. Nhiều sản phẩm có hệ số K và số lượng khác nhau: kiểm tra tổng có trọng số.
6. Tổng tính được lớn hơn `70`: giới hạn ở `70` theo cấu hình phần II.
7. Giá trị âm, NaN, Infinity hoặc vượt trần dòng: trả lỗi tiếng Việt và không lưu.
8. Lưu nháp, tải lại phiếu, mở danh sách: tất cả cùng một điểm.
9. Nộp phiếu, thẩm định, phê duyệt, khóa kỳ: điểm không tự thay đổi.
10. Kiểm tra riêng tài khoản demo “Quản trị hệ thống” tháng `08/2026`.

## Xử lý dữ liệu demo bị sai

Sau khi xác định schema và bằng chứng audit:

- Kiểm tra phiếu tháng `08/2026` của tài khoản “Quản trị hệ thống” đang có `self_score = 95`.
- Không xóa dữ liệu thật hoặc dữ liệu đã phê duyệt nếu chưa có quy trình phù hợp.
- Nếu đây là dữ liệu demo/test, reset bằng migration hoặc script có tên rõ ràng, có backup và audit log.
- Đưa phiếu về trạng thái nháp và tính lại từ chi tiết thực tế; với một sản phẩm tự chấm `5`, tổng phải phản ánh đúng công thức mới.
- Báo cáo trước/sau, ID bản ghi, lý do reset và cách phục hồi. Không sửa trực tiếp SQLite production.

## Lỗi phụ phải xử lý cùng branch

1. Trang chủ: đổi hậu tố điểm từ `đ` thành `điểm`, không ảnh hưởng định dạng tiền tệ ở module ngân sách.
2. Bảng điều hành AI: hiển thị nổi bật gần tiêu đề:

> NỘI DUNG DO AI DỰ THẢO — CHỈ SỬ DỤNG THAM KHẢO; LÃNH ĐẠO PHẢI RÀ SOÁT, CHỈNH SỬA VÀ PHÊ DUYỆT TRƯỚC KHI BAN HÀNH.

AI không được tự phê duyệt, tự ban hành, tự thay đổi dữ liệu chính thức hoặc đưa ra quyết định hành chính.

## Kiểm tra hoàn tất

Chạy đủ:

```text
npm run build
npm run build:server
npm run build:client
```

Chạy toàn bộ test hiện có và test mới. Kiểm tra TypeScript, lint, migration/schema, audit log và không có dữ liệu công dân thật trong test.

Cập nhật `IMPLEMENTATION_NOTES.md`, ghi rõ nguyên nhân gốc, file/hàm đã sửa, công thức trước và sau, kết quả kiểm thử, dữ liệu demo đã reset và giới hạn còn lại.

Commit: `Fix critical KPI task score calculation`.

Push branch và tạo Draft Pull Request. Chưa merge, chưa migrate production, chưa restart dịch vụ và chưa deploy nếu chưa được Chủ tịch phê duyệt thủ công.

Cuối cùng trả về branch, commit SHA, danh sách file thay đổi, kết quả từng test/build và các nội dung cần phê duyệt.
