# LỆNH ANTIGRAVITY — CHUẨN HÓA TÊN HỆ THỐNG VÀ DỌN BRANDING

## Phạm vi

Repository của hệ thống quản lý nhiệm vụ và đánh giá CBCC cho UBND xã.

Môi trường kiểm tra local:

```text
http://localhost:3000/login
```

Dữ liệu hiện tại là dữ liệu test/trắng. Task này chỉ xử lý giao diện, cấu hình tên hệ thống và meta title; không thay đổi dữ liệu nghiệp vụ, tài khoản trải nghiệm, API hoặc trạng thái máy chủ.

Tạo branch riêng:

```text
chore/standardize-system-branding
```

## Tên hệ thống chuẩn

Chỉ sử dụng thống nhất tên sau trong toàn bộ ứng dụng:

```text
Hệ thống Quản lý nhiệm vụ và đánh giá CBCC
```

Quy ước:

- Dùng từ “và”, không dùng ký hiệu `&`.
- Dùng viết tắt `CBCC`.
- Không viết lại thành “Cán bộ, Công chức” ở các vị trí branding.
- `Nghị định 335/2025/NĐ-CP` chỉ là căn cứ pháp lý/phụ đề khi cần, không phải tên sản phẩm.
- Phụ đề chuẩn khi cần dùng:

```text
Theo Nghị định 335/2025/NĐ-CP
```

## Các chuỗi phải thay thế

Tìm và thay toàn bộ các chuỗi cũ:

```text
Hệ thống Quản lý Nhiệm vụ & Đánh giá Cán bộ, Công chức
Hệ Thống Quản Lý & Đánh Giá CBCC (NĐ 335)
Khung Đánh giá Nghị định số 335/2025/NĐ-CP
Khung Đánh giá & Xếp loại Cán bộ Công chức theo NĐ 335/2025/NĐ-CP
```

Thay bằng:

```text
Hệ thống Quản lý nhiệm vụ và đánh giá CBCC
```

Không thay đổi các nội dung pháp lý chuyên môn nếu chúng không phải branding; chỉ chuẩn hóa tên hiển thị sản phẩm và phụ đề.

## Yêu cầu trang `/login`

### Header chính

Giữ lại một khối branding đầy đủ duy nhất gồm:

- Quốc huy/logo;
- `ỦY BAN NHÂN DÂN XÃ NGHĨA LÂM`;
- `Hệ thống Quản lý nhiệm vụ và đánh giá CBCC`;
- phụ đề `Theo Nghị định 335/2025/NĐ-CP` nếu thiết kế hiện tại cần hiển thị.

### Login card

Không lặp lại khối branding đầy đủ. Chỉ hiển thị:

- icon/logo nhỏ;
- tiêu đề: `Đăng nhập hệ thống`;
- phụ đề: `Hệ thống Quản lý nhiệm vụ và đánh giá CBCC`.

Không hiển thị lại:

- `ỦY BAN NHÂN DÂN XÃ NGHĨA LÂM`;
- quốc huy kích thước lớn;
- tên hệ thống theo kiểu cũ;
- dòng “Khung Đánh giá...” hoặc branding NĐ 335 như tên sản phẩm.

## Rà soát toàn bộ codebase

Kiểm tra tối thiểu các khu vực:

- `index.html` và `<title>`;
- `AppHeader`, `Header`, `Navbar`, `Layout`;
- `LoginPage`/`Login.tsx`;
- footer;
- constants/config chứa app name;
- meta title, favicon/alt text nếu có tên cũ;
- Dashboard và các route nghiệp vụ;
- nội dung thông báo, modal, empty state nếu có branding.

Dùng tìm kiếm toàn repository với các từ khóa:

```text
Nghị định 335
NĐ 335
NĐ335
Khung Đánh giá
Khung Đánh Giá
Hệ thống Quản lý
Cán bộ, Công chức
Cán bộ Công chức
CBCC
& Đánh giá
& Xếp loại
```

Phải phân biệt:

- tên hệ thống cần chuẩn hóa;
- nội dung căn cứ pháp lý trong tài liệu nghiệp vụ được phép giữ lại;
- tên tài khoản trải nghiệm không được chỉnh sửa.

## Cách triển khai

1. Ưu tiên dùng một constant duy nhất, ví dụ `APP_NAME`, cho tên hệ thống.
2. Các component dùng constant hoặc cấu hình chung, không lặp chuỗi hard-code.
3. Cập nhật document title thành:

```text
Hệ thống Quản lý nhiệm vụ và đánh giá CBCC
```

4. Không thay đổi route, API, schema, migration hoặc công thức KPI.
5. Không thay đổi danh sách tài khoản trải nghiệm.
6. Không sửa thông tin trạng thái máy chủ/API.

## Kiểm thử bắt buộc

Chạy local và kiểm tra trực tiếp:

```text
npm run build
npm run build:server
npm run build:client
```

Nếu có test frontend/E2E hiện hữu thì chạy toàn bộ.

Kiểm tra trên `/login`:

- chỉ có một khối branding đầy đủ ở header;
- login card chỉ có logo nhỏ, “Đăng nhập hệ thống” và tên chuẩn;
- không bị tràn dòng, lệch card, vỡ responsive desktop/mobile;
- tab trình duyệt hiển thị đúng tên chuẩn.

Kiểm tra ít nhất các route:

```text
/login
/
/tasks
/evaluations
/budget
/public-investment
/land-certificates
/office
/admin
```

Sau khi thay đổi, tìm lại toàn repository các chuỗi cũ và báo cáo các kết quả còn lại. Những chuỗi nằm trong tài liệu pháp lý/lịch sử hoặc test snapshot phải được phân loại rõ, không tự xóa mù quáng.

## Bàn giao

Cập nhật `IMPLEMENTATION_NOTES.md` với:

- constant/tệp dùng làm nguồn tên hệ thống;
- các component đã thay đổi;
- xử lý branding trang login;
- kết quả tìm kiếm chuỗi cũ;
- kết quả build/test;
- ảnh chụp hoặc mô tả kiểm tra layout nếu có.

Commit:

```text
Standardize KPI system branding and login layout
```

Push branch và tạo Draft Pull Request. Không tự merge, không deploy production.

Cuối cùng trả về branch, commit SHA, danh sách file thay đổi và kết quả build/test.
