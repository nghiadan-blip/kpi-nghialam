# REOPEN P0 — LỖI TỔNG HỢP ĐIỂM PHẦN II KPI CHƯA ĐƯỢC FIX

## Trạng thái

Mở lại ticket ở mức **P0 — chưa được nghiệm thu**. Bản fix trước chưa tác động vào hàm/API tổng hợp điểm Phần II.

Không được đóng ticket chỉ vì giao diện đã thay đổi hoặc điểm từng dòng đã tính đúng.

## Bằng chứng tái hiện bắt buộc

Đối tượng kiểm tra: phiếu đánh giá của “Quản trị hệ thống”, tháng `08/2026`.

1. Dòng sản phẩm có `Tự chấm = 5`.
2. Khối “Điểm nhiệm vụ quy đổi” vẫn hiển thị `70/70`.
3. Bấm “Lưu Nháp”. Tổng tự chấm ngoài danh sách vẫn là `95` (`25` điểm phần I + `70` điểm phần II).
4. Sửa `Số lượng` của dòng từ `1` thành `5`.
5. Điểm dòng tự tính đúng từ `5` thành `25`.
6. Nhưng điểm tổng hợp Phần II vẫn giữ `70/70` và tổng vẫn `95`.

Kết luận: logic tính từng dòng đang chạy, nhưng logic tổng hợp Phần II vẫn gán cứng mức tối đa hoặc đang đọc sai trường dữ liệu.

## Yêu cầu bắt buộc đối với đội phát triển

### 1. Truy đúng nguồn gây lỗi

Không đoán và không chỉ sửa JSX. Phải trace đầy đủ:

- hàm tính điểm từng dòng;
- hàm tính `task_score_self`/điểm Phần II;
- hàm tính `self_score` tổng;
- API lưu nháp;
- API lấy chi tiết phiếu;
- API lấy danh sách đánh giá;
- model/schema `evaluations` và `evaluation_details`;
- các giá trị trả về trong Network tab;
- nơi đang gán mặc định `70`, `MAX_TASK_SCORE`, `sectionMax` hoặc giá trị tương đương.

Tìm toàn repository các chuỗi/tên:

```text
task_score_self
task_score
self_score
total_score
70
MAX_TASK_SCORE
sectionMax
evaluation_details
```

Phải chỉ ra trong báo cáo: file, hàm, dòng logic sai và nguyên nhân vì sao dữ liệu dòng không đi vào tổng Phần II.

### 2. Sửa một nguồn tính điểm duy nhất

Backend phải là nguồn sự thật. Frontend chỉ hiển thị kết quả backend và có thể preview tạm thời.

Khi lưu nháp, phải tính lại từ toàn bộ chi tiết phiếu, không nhận `task_score_self` hoặc `self_score` do client tự gửi làm giá trị cuối cùng.

Logic tổng quát:

```text
row_score_i = calculateRowScore(detail_i, configuration)
task_score_self = min(sum(row_score_i), task_section_max)
self_score = common_score_self + task_score_self
```

Nếu hệ thống quy định điểm dòng dựa trên `Tự chấm × Hệ số K × Số lượng`, phải sử dụng đúng trường dữ liệu và tránh nhân hai lần nếu điểm dòng đã bao gồm số lượng/hệ số. Đội phát triển phải ghi rõ công thức thực tế trong `IMPLEMENTATION_NOTES.md`.

Không được lấy tổng tối đa `70` khi chưa có dòng hợp lệ. Không được lấy `COUNT(details) > 0` làm điều kiện để gán `70`.

### 3. Đồng bộ cả ba nơi

Sau khi lưu nháp, ba nơi sau phải trả cùng một giá trị:

1. Điểm Phần II trong phiếu chi tiết.
2. Tổng tự chấm trong danh sách đánh giá.
3. Giá trị lưu trong API/database.

Không được để frontend tự cộng `25 + 70` nếu backend trả điểm thực tế khác.

## Kịch bản nghiệm thu bắt buộc

Dùng test độc lập, không dùng dữ liệu công dân thật:

| Kịch bản | Kết quả bắt buộc |
|---|---|
| 1 dòng, số lượng 1, tự chấm 5 | Phần II phản ánh đúng 5 hoặc giá trị quy đổi theo cấu hình, không phải 70 |
| Đổi số lượng 1 → 5 | Điểm dòng và Phần II thay đổi theo công thức |
| Lưu nháp sau khi đổi số lượng | Tổng tự chấm thay đổi tương ứng |
| Tải lại trang | Điểm không quay lại 70 |
| Mở danh sách đánh giá | Điểm bằng đúng phiếu chi tiết |
| Thêm dòng thứ 2 tự chấm 5 | Tổng tăng đúng, không tự nhảy cứng về 70 |
| Xóa dòng thứ 2 | Tổng giảm đúng theo dòng bị xóa |
| Không có dòng | Phần II bằng 0, trừ khi quy định cấu hình có trường hợp khác |
| Tổng vượt 70 | Chặn ở 70 và ghi rõ lý do giới hạn |
| Nộp/phê duyệt/khóa kỳ | Điểm không tự thay đổi sau chuyển trạng thái |

## Kiểm tra dữ liệu demo tháng 8/2026

- Chụp/ghi nhận giá trị trước sửa của phiếu “Quản trị hệ thống”.
- Không sửa trực tiếp SQLite production.
- Nếu là bản ghi demo/test, tạo script reset có backup, transaction và audit log.
- Tính lại phiếu từ các dòng chi tiết sau khi sửa.
- Xác nhận điểm `95` sai được thay bằng điểm đúng theo dữ liệu thực tế.
- Báo cáo ID bản ghi, giá trị trước/sau và khả năng rollback.

## Điều kiện chưa được đóng ticket

Ticket chỉ được coi là hoàn thành khi:

- Có test chứng minh đổi số lượng `1 → 5` làm thay đổi tổng Phần II.
- Không còn giá trị `70/70` gán cứng khi dòng chỉ đạt `5` hoặc `25`.
- Backend, frontend, danh sách và database thống nhất.
- Có root cause cụ thể, không báo cáo chung chung “đã sửa công thức”.
- `npm run build`, `npm run build:server`, `npm run build:client` và toàn bộ test đều đạt.
- Cập nhật `IMPLEMENTATION_NOTES.md`.

## Lỗi phụ sau khi P0 đạt

- Trang chủ: dùng `điểm`, không dùng `đ` cho điểm KPI.
- Bảng điều hành AI: hiển thị cảnh báo nổi bật: “Nội dung do AI dự thảo; lãnh đạo phải rà soát, chỉnh sửa và phê duyệt trước khi ban hành.”

Tạo branch:

```text
fix/reopen-p0-kpi-task-score
```

Commit:

```text
Reopen P0 KPI task score aggregation fix
```

Push branch và tạo Draft PR. Không merge, không deploy production nếu chưa có phê duyệt thủ công.
