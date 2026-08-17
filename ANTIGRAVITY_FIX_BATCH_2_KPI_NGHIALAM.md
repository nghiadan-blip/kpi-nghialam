# LỆNH THỰC THI ANTIGRAVITY — FIX BATCH 2 KPI.NGHIALAM.COM

## Chế độ thực thi

Thực thi trực tiếp trên repository hiện tại của KPI Nghĩa Lâm. Khi IDE hỏi cấp quyền cho thao tác trong phạm vi repository, chọn: **Yes, and always allow ...**. Không tự động cấp quyền cho thao tác ngoài repository, production database, secrets, SSH, Nginx, PM2 hoặc deploy.

Tạo branch mới: `fix/batch-2-validation-data-safety`.

Không sửa lan man, không đổi kiến trúc hiện có. Đọc trước `MASTER_SPEC.md`, `CLAUDE.md`, `AGENTS.md`, `IMPLEMENTATION_NOTES.md`, đặc tả KPI và các migration/controller/page liên quan. Nghĩa Lâm là tenant cấu hình, không hard-code tên xã, phòng ban hay số lượng đơn vị.

## Mục tiêu ưu tiên P0

### 1. Khóa dữ liệu tài chính và đầu tư

Backend là lớp kiểm tra bắt buộc; frontend chỉ là lớp hỗ trợ.

- Ngân sách thu: `planned_amount >= 0`, `collected_amount >= 0`, số hữu hạn.
- Ngân sách chi: `estimated_amount >= 0`, `approved_amount >= 0`, `paid_amount >= 0`.
- Không cho `collected_amount > planned_amount` nếu chưa có trạng thái/ghi chú điều chỉnh được phê duyệt.
- Không cho `approved_amount > estimated_amount` nếu chưa có cơ chế bổ sung dự toán được cấu hình.
- Không cho `paid_amount > approved_amount`.
- Đầu tư công: vốn kế hoạch, vốn phân bổ, đã giải ngân, giá trị nghiệm thu đều `>= 0`.
- Không cho `disbursed_amount > allocated_capital`; không cho tỷ lệ giải ngân vượt 100%.
- Nếu nghiệp vụ cho phép điều chỉnh/bổ sung, phải có trường trạng thái, căn cứ, người duyệt, thời gian duyệt và audit log; tuyệt đối không vượt ngầm.
- Từ chối `NaN`, `Infinity`, chuỗi rỗng hoặc kiểu số không hợp lệ bằng HTTP 400 và thông báo tiếng Việt.

### 2. Sửa lỗi ngày giờ và trạng thái

- Văn phòng: `end_time > start_time`; cùng ngày vẫn phải kết thúc sau bắt đầu.
- Rà soát toàn bộ form ngày của Đất đai, Đầu tư công, Văn phòng, Nhiệm vụ. Giữ đúng giá trị người dùng nhập, không tự thay bằng ngày hiện tại.
- Đất đai: hồ sơ mới không được tự gán “Chậm giải quyết”. Chỉ gán quá hạn khi `now > deadline` và hồ sơ chưa hoàn thành/đóng.
- Kiểm tra timezone và chuẩn hóa ISO date/datetime giữa React, API và SQLite.

### 3. An toàn thao tác xóa

- Tất cả nút xóa trong Nhiệm vụ, KPI, Ngân sách, Đầu tư công, Đất đai, Văn phòng, Quản trị phải có hộp thoại xác nhận tiếng Việt:
  “Bạn có chắc chắn muốn xóa? Hành động này không thể hoàn tác.”
- Hủy xác nhận thì không gọi API.
- API xóa phải kiểm tra quyền, ghi audit log gồm người thực hiện, đối tượng, mã bản ghi, thời gian, lý do nếu có.
- Không xóa dữ liệu đã khóa kỳ KPI, hồ sơ đã phê duyệt hoặc chứng từ tài chính nếu chưa có quy trình hủy/thu hồi hợp lệ.

## Mục tiêu P1

### 4. Đồng bộ hiển thị và xuất báo cáo

- Sửa danh sách Đầu tư công để “Kế hoạch/Phân bổ” và dòng phụ dùng cùng một trường dữ liệu, cùng quy tắc định dạng.
- Tỷ lệ giải ngân hiển thị tối đa 100%, có cảnh báo dữ liệu bất thường.
- Rà soát nút Xuất Excel/PDF ở Ngân sách, Đầu tư công, Đất đai, Văn phòng: hiển thị trạng thái đang xuất, tải file thành công hoặc thông báo lỗi rõ ràng.
- Không dùng `window.open` gây mất phản hồi; dùng download/blob hoặc cơ chế hiện có của dự án.

### 5. Validate giao diện và Việt hóa

- Bổ sung `min`, `max`, `step` cho toàn bộ trường tiền, số lượng, tỷ lệ, thời gian.
- Không phụ thuộc vào thông báo HTML5 tiếng Anh “Please fill out this field”. Dùng validate tiếng Việt thống nhất.
- Các thông báo lỗi phải nêu đúng trường và điều kiện, ví dụ: “Số tiền duyệt chi không được lớn hơn số tiền đề xuất”.

## Kiểm thử bắt buộc

Viết hoặc bổ sung test backend và E2E cho:

1. Số âm ở tất cả trường tiền/số bị trả HTTP 400.
2. Duyệt chi vượt đề xuất bị từ chối.
3. Đã giải ngân vượt vốn phân bổ bị từ chối.
4. Thời gian kết thúc trước bắt đầu bị từ chối.
5. Ngày hạn đất đai được lưu và đọc đúng ngày đã nhập.
6. Hồ sơ mới không bị gán quá hạn.
7. Xóa luôn yêu cầu xác nhận ở UI và ghi audit log ở API.
8. Xuất Excel/PDF trả đúng content-type, file hợp lệ và UI có phản hồi.
9. Dữ liệu hiển thị kế hoạch/phân bổ nhất quán.

Chỉ dùng dữ liệu test có tiền tố `TEST-CODEX-`; sau test phải xóa sạch và kiểm tra không còn bản ghi test. Không dùng dữ liệu công dân thật.

## Kiểm tra KPI không được bỏ qua

Không thay đổi công thức KPI ngoài phạm vi lỗi. Tuy nhiên phải chạy regression cho:

- tự chấm, thẩm định, phê duyệt, khóa kỳ;
- điểm tiêu chí chung 30 điểm và kết quả nhiệm vụ 70 điểm;
- điểm danh sách phải khớp chi tiết phiếu;
- audit log khi sửa điểm/trạng thái;
- không sửa điểm sau khóa kỳ nếu không có quyền và lý do.

## Quy trình bàn giao

1. Chạy `npm run build`.
2. Chạy `npm run build:server`.
3. Chạy `npm run build:client`.
4. Chạy toàn bộ test hiện có và test mới.
5. Kiểm tra TypeScript, lint, migration/schema và không có secret/PII trong test.
6. Cập nhật `IMPLEMENTATION_NOTES.md` bằng danh sách file, lỗi đã sửa, test đã chạy, giới hạn còn lại.
7. Commit với message: `Fix batch 2 validation and data safety`.
8. Push branch và tạo PR/draft PR để review; không merge, không migrate production, không restart dịch vụ và không deploy nếu chưa được phê duyệt thủ công.

## Tiêu chí hoàn thành

- Tất cả lỗi P0 đã có test chứng minh không tái diễn.
- Không còn HTTP 500 do dữ liệu enum/đầu vào không hợp lệ; trả HTTP 400 tiếng Việt.
- Không còn số âm hoặc quan hệ tài chính bất hợp lệ được lưu.
- Không còn lỗi tự thay ngày nhập bằng ngày hiện tại.
- Không còn xóa trực tiếp không xác nhận.
- Build và test đạt; working tree sạch sau commit; báo cáo rõ file nào đã thay đổi.

Sau khi hoàn tất, trả về: branch, commit SHA, danh sách file thay đổi, kết quả từng lệnh build/test, và các điểm cần Chủ tịch duyệt thủ công.
