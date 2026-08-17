# LỆNH ANTIGRAVITY — SỬA LOGIC DASHBOARD KPI VÀ NÂNG CẤP ĐIỀU HÀNH

## Phạm vi và thứ tự ưu tiên

Repository hệ thống `kpi.nghialam.com`, ứng dụng quản lý nhiệm vụ và đánh giá CBCC.

Tạo branch riêng:

```text
fix/dashboard-kpi-period-logic
```

Thực hiện theo thứ tự:

1. P0: Sửa nguồn số liệu dashboard KPI và trạng thái nhiệm vụ.
2. P1: Chuẩn hóa 0/0 và kiểm tra bộ lọc tháng/năm.
3. P2: Nâng cấp dashboard chuyên đề, drill-down, cảnh báo và audit log.

Không tự deploy, không sửa trực tiếp database production, không thay đổi công thức KPI pháp lý ngoài phạm vi được mô tả.

## P0 — Chuẩn hóa dashboard KPI theo kỳ

### 1. Xác định rõ phạm vi dữ liệu

Mọi số liệu dashboard tháng phải dùng cùng một bộ lọc kỳ:

- tháng;
- năm;
- đơn vị/phòng ban nếu có;
- trạng thái tài khoản đang hoạt động;
- múi giờ thống nhất của hệ thống.

Không được để ô tổng số cán bộ dùng dữ liệu toàn năm/toàn hệ thống trong khi các ô đã chấm/phê duyệt dùng dữ liệu tháng.

### 2. Thống nhất các chỉ số cán bộ

Định nghĩa và trả về rõ ràng:

- `totalActiveStaff`: tổng CBCC đang hoạt động thuộc phạm vi kỳ báo cáo;
- `assignedStaff`: số CBCC có nhiệm vụ hoặc phiếu đánh giá trong kỳ;
- `selfSubmittedStaff`: số CBCC đã hoàn tất/nộp tự đánh giá;
- `reviewedStaff`: số CBCC đã được lãnh đạo/thẩm định xem xét;
- `approvedStaff`: số CBCC đã được phê duyệt;
- `classifiedStaff`: số CBCC đã được xếp loại;
- `notStartedStaff`: số CBCC chưa có dữ liệu hoặc chưa bắt đầu.

Các nhóm trạng thái phải có quan hệ hợp lý:

```text
classifiedStaff <= approvedStaff <= reviewedStaff <= selfSubmittedStaff <= assignedStaff <= totalActiveStaff
```

Nếu workflow thực tế cho phép trạng thái khác, phải ghi rõ trong model và không đếm cùng một cán bộ vào hai nhóm loại trừ nhau.

Dashboard phải hiển thị cả số tuyệt đối và tỷ lệ phần trăm, ví dụ `25/58` và `43,10%`.

### 3. Một nguồn tính toán duy nhất

- Tạo hoặc xác định service/backend query duy nhất để tính dashboard.
- Frontend không tự cộng các ô số liệu.
- Các API dashboard, báo cáo và drill-down phải dùng cùng bộ lọc và cùng định nghĩa.
- Trả về metadata của kỳ báo cáo: tháng, năm, thời điểm cập nhật cuối, phạm vi đơn vị và số bản ghi nguồn.

## P0 — Sửa logic nhiệm vụ và quá hạn

### 1. Phân nhóm loại trừ lẫn nhau

Mỗi nhiệm vụ chỉ thuộc đúng một nhóm dashboard tại một thời điểm. Áp dụng thứ tự ưu tiên:

1. `cancelled`: đã hủy/thu hồi hợp lệ;
2. `completed`: đã hoàn thành/nghiệm thu hợp lệ;
3. `overdue`: chưa hoàn thành và đã quá deadline;
4. `in_progress`: đang xử lý, chưa quá deadline;
5. `pending`: chưa bắt đầu, deadline chưa qua;
6. `unknown`: dữ liệu thiếu hoặc trạng thái không hợp lệ, phải cảnh báo.

Không được vừa đếm một nhiệm vụ vào `overdue` vừa đếm vào `in_progress` hoặc `pending`.

### 2. Công thức kiểm tra

```text
activeTaskTotal = completed + overdue + in_progress + pending + unknown
```

Nếu báo cáo loại trừ `cancelled`, phải hiển thị riêng `cancelled` và ghi rõ mẫu số.

Quá hạn chỉ khi:

```text
deadline < currentTime
AND status NOT IN (completed, approved, cancelled)
```

Chuẩn hóa `deadline`, `completed_at`, `status` và timezone trước khi tính. Không dùng phép so sánh chuỗi ngày không chuẩn hóa.

### 3. Test bắt buộc

- Nhiệm vụ hoàn thành sau deadline không được vừa tính hoàn thành vừa tính quá hạn nếu dashboard dùng nhóm loại trừ; phải có chỉ số phụ “hoàn thành trễ” nếu cần.
- Nhiệm vụ chưa hoàn thành, deadline đã qua: chỉ tính quá hạn.
- Nhiệm vụ đang xử lý, deadline tương lai: chỉ tính đang xử lý.
- Nhiệm vụ chưa bắt đầu, deadline tương lai: chỉ tính chờ xử lý.
- Nhiệm vụ bị hủy: không tính vào tổng nhiệm vụ đang thực hiện.
- Deadline đúng thời điểm hiện tại phải có quy tắc rõ ràng và test ổn định.

## P1 — Chuẩn hóa hiển thị 0/0

Không hiển thị `0/0` một cách mơ hồ. Dùng ba trường hợp:

| Tình trạng | Hiển thị |
|---|---|
| Không có bản ghi nguồn/chưa cập nhật dữ liệu | `Chưa cập nhật dữ liệu` |
| Có dữ liệu nhưng chỉ tiêu không phát sinh | `Không phát sinh` |
| Có mẫu số nhưng chưa có kết quả | `0/N` và cảnh báo `Chưa thực hiện` |

Backend trả thêm trạng thái máy tính được, ví dụ:

```text
dataStatus: NO_DATA | NOT_APPLICABLE | PENDING | AVAILABLE
```

Frontend dùng `dataStatus`, không tự suy luận chỉ từ số 0.

## P1 — Kiểm tra bộ lọc tháng/năm

- Tháng bắt buộc là số nguyên từ `1` đến `12`.
- Năm bắt buộc là số nguyên trong khoảng cấu hình hợp lệ của hệ thống.
- Không chấp nhận chuỗi rỗng, số âm, số thập phân, `NaN`, `Infinity` hoặc tháng/năm không tồn tại.
- Backend phải kiểm tra lại dù frontend đã có validation.
- Khi nhập sai, trả HTTP 400 và thông báo tiếng Việt.
- Không tự động chuyển tháng sai thành tháng hiện tại.
- Khi đổi kỳ, phải xóa/refresh toàn bộ dữ liệu dashboard để tránh giữ số liệu kỳ trước.

## P2 — Dashboard chuyên đề

Sau khi P0/P1 đạt test, triển khai các dashboard riêng:

### Ngân sách

- kế hoạch thu, đã thu, tỷ lệ thu;
- dự toán chi, đã duyệt, đã chi;
- khoản quá hạn/chưa đủ chứng từ;
- cảnh báo âm, vượt dự toán hoặc số liệu thiếu.

### Đầu tư công

- số công trình;
- vốn kế hoạch/phân bổ;
- đã giải ngân;
- tỷ lệ giải ngân;
- công trình chậm tiến độ/vướng mắc.

### Đất đai/KH965

- hồ sơ xanh/vàng/đỏ;
- hồ sơ quá hạn;
- số thửa đã rà soát/phân loại;
- hồ sơ cần bổ sung và hồ sơ phức tạp.

### Văn phòng

- yêu cầu xe, phòng họp, tiếp khách;
- yêu cầu chờ duyệt;
- yêu cầu sắp đến hạn;
- chi phí dự kiến/đã duyệt/quyết toán nếu có.

Các dashboard chuyên đề phải có trạng thái `NO_DATA`, không hiển thị số 0 gây hiểu nhầm.

## P2 — Bộ lọc liên thông và drill-down

Bộ lọc chung:

- tháng/năm;
- phòng ban/đơn vị;
- cán bộ phụ trách;
- trạng thái;
- lĩnh vực/module.

Drill-down:

- từ chỉ số tổng → danh sách cán bộ;
- từ cán bộ → danh sách phiếu/nhiệm vụ;
- từ nhiệm vụ → chi tiết sản phẩm, deadline, minh chứng và lịch sử trạng thái;
- từ cảnh báo → bản ghi cần xử lý.

Mỗi màn hình drill-down phải giữ nguyên bộ lọc kỳ và có nút quay lại dashboard.

## P2 — Cảnh báo, nhắc việc và audit log

- Cảnh báo nhiệm vụ sắp đến hạn và quá hạn.
- Nhắc người tự đánh giá chưa nộp.
- Nhắc lãnh đạo chưa thẩm định/phê duyệt.
- Ghi audit log khi thay đổi trạng thái, deadline, điểm, kết quả phê duyệt và dữ liệu dashboard cấu hình.
- Cảnh báo phải phân biệt thông tin, nhắc việc và cảnh báo nghiêm trọng.

## Kiểm thử và bàn giao

Viết test backend, frontend/E2E cho toàn bộ P0/P1 trước khi làm P2. Tối thiểu phải kiểm tra:

- tổng CBCC, đã chấm, đã duyệt, đã xếp loại không đếm chồng;
- tổng nhóm trạng thái nhiệm vụ khớp số nguồn;
- quá hạn không trùng với hoàn thành/đang xử lý;
- các trạng thái `NO_DATA`, `NOT_APPLICABLE`, `PENDING` hiển thị đúng;
- tháng/năm sai bị từ chối;
- đổi bộ lọc không giữ dữ liệu cũ;
- drill-down giữ đúng kỳ và bộ lọc;
- cảnh báo và audit log ghi đúng vai trò.

Chạy:

```text
npm run build
npm run build:server
npm run build:client
```

Cập nhật `IMPLEMENTATION_NOTES.md` gồm định nghĩa chỉ số, công thức, query/service nguồn, test, ảnh hưởng dữ liệu và giới hạn còn lại.

Commit P0/P1:

```text
Fix KPI dashboard period and task status aggregation
```

Chỉ sau khi P0/P1 được review và nghiệm thu mới tiếp tục commit P2:

```text
Add executive module dashboards and drill-down reporting
```

Push branch và tạo Draft Pull Request. Không tự merge, không deploy production.
