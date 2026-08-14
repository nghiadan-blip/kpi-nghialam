# Lenh thuc thi cho Antigravity - Cap nhat he thong KPI Nghia Lam

## 1. Boi canh va muc tieu

Du an: `kpi.nghialam.com`

Repo hien tai la he thong web noi bo quan ly can bo, giao viec, theo doi tien do va danh gia KPI cua UBND xa Nghia Lam theo Nghi dinh so 335/2025/ND-CP va tai lieu huong dan cua Bo Noi vu.

Muc tieu lan cap nhat nay:

- Phat trien he thong theo kien truc module, khong lam lai tu dau.
- Giu on dinh cac tinh nang da co: dang nhap, RBAC, quan ly nguoi dung, phong ban, danh muc cong viec, giao viec, danh gia KPI thang, danh gia co quan, dashboard, xuat bao cao.
- Bo sung cac module dieu hanh uu tien cua Chu tich UBND xa:
  - Quan ly tai chinh ngan sach: thu va chi.
  - Giai ngan dau tu cong theo tung cong trinh.
  - Tien do cap GCN QSDD va Ke hoach 965.
  - Quan ly van phong: tiep khach, giay di duong/cong tac, lich xe, phong hop, hau can, van phong pham.
  - Dashboard tong hop, canh bao, bao cao phuc vu giao ban.

Nguyen tac bat buoc:

- Bam sat Nghi dinh 335/2025/ND-CP va tai lieu huong dan tieu chi danh gia cong chuc cua Bo Noi vu.
- Moi nghiep vu phai gan voi nguyen tac "6 ro": ro nguoi, ro viec, ro thoi gian, ro trach nhiem, ro san pham, ro tham quyen.
- Khong xoa/sua mat du lieu cu neu khong co migration va backup ro rang.
- Khong sua diem KPI truc tiep neu khong co ly do va audit log.
- Moi module phai co API, giao dien, phan quyen, bao cao toi thieu va test/build pass.

## 2. Hien trang repo can giu

Kiem tra repo truoc khi lam:

```bash
git status
npm install
npm run build
```

Neu build hien tai loi, phai ghi ro loi vao file `IMPLEMENTATION_NOTES.md` truoc khi sua.

Cau truc dang co:

- `server/src/controllers`: controller API.
- `server/src/routes`: route API.
- `server/src/models/index.ts`: model/database layer hien tai.
- `server/src/utils/decree335.ts`: logic tinh diem theo Nghi dinh 335.
- `client/src/pages`: cac man hinh chinh.
- `client/src/components`: modal, widget, thanh dieu huong, bang bieu.
- `client/src/services/api.ts`: client API.
- `client/src/types/index.ts`: kieu du lieu frontend.

Khong pha vo cac route va man hinh dang co:

- Auth/Login/Register.
- Dashboard.
- Tasks.
- Evaluations.
- AgencyEvaluations.
- Admin.

## 3. Yeu cau kien truc chung

Moi module moi phai di theo cung mot pattern:

- Backend:
  - Tao bang du lieu/migration neu he thong dang dung migration.
  - Tao controller rieng.
  - Tao route rieng.
  - Gan middleware auth/RBAC.
  - Co API list/detail/create/update/change-status/export neu phu hop.
- Frontend:
  - Tao page hoac tab module.
  - Co danh sach, bo loc, form them/sua, trang thai, canh bao.
  - Hien thi duoc tren desktop; khong de tran bang, vo layout.
- Dashboard:
  - Module nao co so lieu dieu hanh phai co chi so tong hop.
  - Cac viec qua han, sap han, rui ro cao phai hien thi noi bat.
- Bao cao:
  - Uu tien xuat Excel.
  - Noi dung bao cao dung duoc cho giao ban ngay/tuan/thang.
- Audit:
  - Tao audit log cho thao tac them/sua/xoa, phe duyet, khoa/mo khoa ky, sua trang thai quan trong.

## 4. Phan quyen bat buoc

Vai tro hien co can tiep tuc dung:

- `ADMIN`: cau hinh he thong, danh muc, nguoi dung, migration/seed demo, xem audit.
- `LEADERSHIP`: xem toan xa, giao viec, phe duyet, xem dashboard va bao cao tat ca module.
- `DEPARTMENT_HEAD`: xem/sua du lieu thuoc phong phu trach, giao viec cho nhan su phong, thuc hien tham dinh.
- `EMPLOYEE`: xem viec cua minh, cap nhat tien do, nop minh chung, de xuat/kien nghi.

Neu can them quyen theo module, them bang/field `permissions` hoac cau hinh trong role hien co, nhung khong lam hong RBAC cu.

## 5. Module 1 - Tai chinh ngan sach

Muc tieu: Chu tich nam duoc du toan, thu, chi, so con phai thu, khoan da chi, khoan thieu ho so va rui ro vuot du toan.

Bang du lieu de xuat:

- `budget_revenue_items`
  - `id`
  - `year`
  - `category`
  - `source_name`
  - `payer_or_unit`
  - `planned_amount`
  - `collected_amount`
  - `remaining_amount`
  - `due_date`
  - `responsible_department_id`
  - `responsible_user_id`
  - `status`: `planned`, `partial`, `completed`, `overdue`, `cancelled`
  - `note`
  - `evidence_url` hoac `evidence_ref`
  - `created_at`, `updated_at`

- `budget_expenditure_items`
  - `id`
  - `year`
  - `category`
  - `expense_name`
  - `funding_source`
  - `estimated_amount`
  - `approved_amount`
  - `paid_amount`
  - `remaining_amount`
  - `request_user_id`
  - `approve_user_id`
  - `status`: `draft`, `submitted`, `approved`, `paid`, `rejected`, `missing_document`
  - `document_status`
  - `payment_date`
  - `note`
  - `created_at`, `updated_at`

Chuc nang:

- Quan ly danh muc khoan thu: dat cong ich, hoa loi cong san, phi/le phi, thu khac theo phan cap.
- Quan ly khoan chi: de nghi chi, ho so thanh toan, chung tu, nguoi de xuat, nguoi duyet.
- Canh bao:
  - Khoan thu qua han.
  - Khoan thu con phai thu lon.
  - Khoan chi thieu ho so.
  - Khoan chi vuot du toan hoac chua ro nguon.
- Bao cao:
  - Tong thu/chi theo ngay, tuan, thang, nam.
  - Danh sach khoan con phai thu.
  - Danh sach khoan chi dang cho duyet/thieu chung tu.

Tieu chi nghiem thu:

- Chu tich xem duoc tong so phai thu, da thu, con phai thu, tong da chi, khoan chi cho duyet.
- Loc duoc theo nam, nguon thu/chi, phong phu trach, trang thai.
- Xuat Excel duoc bao cao thu/chi.

## 6. Module 2 - Giai ngan dau tu cong theo cong trinh

Muc tieu: Theo doi tung cong trinh/dau muc du an, ke hoach von, khoi luong, nghiem thu, giai ngan va vuong mac.

Bang du lieu de xuat:

- `public_investment_projects`
  - `id`
  - `project_code`
  - `project_name`
  - `investor_name`
  - `funding_source`
  - `planned_capital`
  - `allocated_capital`
  - `disbursed_amount`
  - `disbursement_rate`
  - `contractor`
  - `start_date`
  - `end_date`
  - `actual_progress_percent`
  - `acceptance_value`
  - `payment_document_status`
  - `obstacle_type`: `gpmb`, `procedure`, `payment_document`, `contractor`, `weather`, `funding`, `other`
  - `obstacle_note`
  - `responsible_user_id`
  - `status`: `preparing`, `executing`, `delayed`, `completed`, `settled`
  - `created_at`, `updated_at`

Chuc nang:

- Quan ly danh muc cong trinh.
- Cap nhat ke hoach von, von da phan bo, von da giai ngan, ty le giai ngan.
- Cap nhat khoi luong hoan thanh, gia tri nghiem thu, ho so thanh toan.
- Ghi nhan vuong mac theo nhom: GPMB, thu tuc dau tu, ho so thanh toan, nha thau, thoi tiet, nguon von.
- Canh bao cong trinh:
  - Ty le giai ngan thap.
  - Cham nghiem thu.
  - Thieu ho so thanh toan.
  - Co nguy co khong hoan thanh ke hoach.
- Bao cao theo cong trinh, nguon von, thang, nhom vuong mac.

Tieu chi nghiem thu:

- Dashboard hien thi danh sach cong trinh rui ro cao.
- Moi cong trinh co ty le giai ngan, nguyen nhan cham va viec can xu ly tiep theo.
- Xuat Excel bao cao giai ngan.

## 7. Module 3 - Cap GCN QSDD va Ke hoach 965

Muc tieu: Theo doi toan bo tien do cap GCN QSDD, ho so ton dong va chien dich xu ly theo Ke hoach 965.

Bang du lieu de xuat:

- `land_certificate_cases`
  - `id`
  - `case_code`
  - `citizen_name`
  - `village`
  - `land_plot_ref`
  - `case_group`
  - `legal_basis_group`: `article_137`, `article_138`, `article_139`, `article_140`, `other`
  - `current_step`
  - `status`: `received`, `checking`, `public_notice`, `financial_obligation`, `submitted`, `issued`, `returned`, `delayed`, `paused`
  - `deadline`
  - `responsible_user_id`
  - `responsible_department_id`
  - `delay_reason`
  - `evidence_ref`
  - `created_at`, `updated_at`

- `kh965_progress`
  - `id`
  - `village`
  - `total_plots`
  - `reviewed_plots`
  - `classified_plots`
  - `eligible_cases`
  - `need_supplement_cases`
  - `complex_cases`
  - `green_count`
  - `yellow_count`
  - `red_count`
  - `responsible_user_id`
  - `report_date`
  - `note`

Chuc nang:

- Quan ly ho so theo xom, nhom ho so, can bo phu trach, buoc xu ly.
- Phan luong:
  - Xanh: du dieu kien, co the xu ly nhanh.
  - Vang: can bo sung/kiem tra them.
  - Do: phuc tap, can xin y kien/ho so phap ly sau.
- Theo doi KH965 theo xom:
  - So thua can xu ly.
  - So da ra soat.
  - So da phan loai.
  - So du dieu kien.
  - So can bo sung.
  - So phuc tap.
- Canh bao:
  - Ho so ton lau.
  - Ho so tre han.
  - Ho so thieu minh chung.
  - Ho so sai buoc quy trinh.
- Gan nhiem vu xu ly ho so cho can bo/phong.
- Bao cao ngay/tuan ve tien do KH965 va bieu do so sanh giua cac xom.

Tieu chi nghiem thu:

- Chu tich xem duoc tien do cap GCN theo xom, theo can bo, theo trang thai.
- Biet ro ho so nao dang tac o buoc nao va ai chiu trach nhiem.
- Co bao cao KH965 xuat Excel.

## 8. Module 4 - Quan ly van phong va hau can hanh chinh

Muc tieu: Chuan hoa cac viec van phong thuong xuyen va kiem soat quy trinh xin - duyet - thuc hien - quyet toan.

Bang du lieu de xuat:

- `office_requests`
  - `id`
  - `request_type`: `guest_reception`, `travel_paper`, `business_trip`, `vehicle`, `meeting_room`, `stationery`, `equipment`, `conference_logistics`, `other`
  - `title`
  - `description`
  - `request_user_id`
  - `responsible_user_id`
  - `approve_user_id`
  - `start_time`
  - `end_time`
  - `estimated_cost`
  - `approved_cost`
  - `funding_source`
  - `document_ref`
  - `settlement_status`
  - `status`: `draft`, `submitted`, `approved`, `in_progress`, `completed`, `settled`, `rejected`
  - `created_at`, `updated_at`

Chuc nang:

- Quan ly dang ky tiep khach: noi dung, thanh phan, du kien kinh phi, nguon chi, phe duyet, chung tu sau tiep khach.
- Quan ly giay di duong/cong tac: nguoi di, dia diem, thoi gian, nhiem vu, phuong tien, du toan, ket qua cong tac.
- Quan ly lich xe, phong hop, hoi nghi, van phong pham, thiet bi dung chung.
- Tu dong tao nhiem vu cho van phong chuan bi hau can va cap nhat minh chung sau khi hoan thanh.
- Bao cao chi hanh chinh thuong xuyen theo nhom viec.

Tieu chi nghiem thu:

- Moi viec van phong co trang thai ro.
- Cac de nghi tiep khach, cong tac, hau can co nguoi xin, nguoi duyet, nguoi thuc hien.
- Han che xu ly mieng va that lac chung tu.

## 9. Module 5 - Dashboard dieu hanh Chu tich

Muc tieu: Man hinh dau tien sau dang nhap phai giup Chu tich nam viec trong ngay/tuan.

Chi so bat buoc:

- Tong so viec qua han, sap han, hoan thanh trong ngay/tuan.
- Ho so TTHC qua han/sap han.
- So khoan thu con phai thu, khoan thu qua han.
- Tong chi da duyet, khoan chi thieu chung tu.
- Ty le giai ngan dau tu cong, cong trinh rui ro cao.
- Tien do cap GCN/KH965 theo xom.
- Viec van phong dang cho duyet.
- Danh sach can bo/phong co nhieu viec cham.

Canh bao mau:

- Do: qua han, rui ro cao, vuot du toan, ho so tac nghiem trong.
- Vang: sap han, can bo sung, thieu minh chung.
- Xanh: hoan thanh/dung tien do.

Tieu chi nghiem thu:

- Chu tich khong can vao tung module van nhin duoc viec can xu ly ngay.
- Click vao moi chi so phai mo duoc danh sach chi tiet.

## 10. Module 6 - Bao cao va nhac viec

Chuc nang:

- Bao cao ngay: viec qua han, viec sap han, ho so dat dai, thu/chi, dau tu cong.
- Bao cao tuan: tong hop ket qua theo phong, xom, can bo, module.
- Xuat Excel cac bao cao chinh.
- Tao mau du lieu phuc vu sao chep nhanh vao thong bao ket luan/giao ban.
- Neu da co cau hinh Zalo/Telegram thi chuan bi endpoint/hook gui nhac viec; neu chua co thi chi tao cau truc va man hinh cau hinh, khong hard-code token.

Tieu chi nghiem thu:

- Xuat duoc bao cao tuan tu du lieu he thong trong duoi 1 phut.
- Khong tong hop thu cong bang copy/paste tu nhieu man hinh.

## 11. Yeu cau ve tinh diem KPI

Khong thay doi tuy tien cong thuc Nghi dinh 335 dang co.

Viec mo rong module chi duoc anh huong den KPI theo co che:

- Moi dau viec phat sinh tu module co the tao `task`.
- Task co nguoi phu trach, han, san pham dau ra, minh chung.
- Neu task gan voi danh muc cong viec/san pham chuan thi moi tinh vao diem KPI.
- Viec qua han, bi tra lai, thieu minh chung phai co co che tac dong diem theo quy dinh dang co.

Neu can bo sung cong thuc, phai de trong file `IMPLEMENTATION_NOTES.md`, khong tu y thay doi scoring core.

## 12. Cac buoc thuc thi de nghi

### Buoc 0 - Bao ve hien trang

- Chay `git status`.
- Tao branch moi:

```bash
git checkout -b feature/ubnd-executive-modules
```

- Chay build/test hien co.
- Ghi nhan ket qua ban dau vao `IMPLEMENTATION_NOTES.md`.

### Buoc 1 - Database va type dung chung

- Them schema/bang cho 4 module moi.
- Them type frontend/backend.
- Them seed demo toi thieu cho tung module.
- Dam bao migration khong mat du lieu cu.

### Buoc 2 - Backend API

- Them routes/controllers cho:
  - `/api/budget`
  - `/api/public-investment`
  - `/api/land-certificates`
  - `/api/kh965`
  - `/api/office`
  - `/api/executive-dashboard`
- Tat ca route phai qua auth.
- Gan RBAC theo muc tai Muc 4.

### Buoc 3 - Frontend pages

- Them menu/module tren Navbar.
- Tao cac trang:
  - `Budget.tsx`
  - `PublicInvestment.tsx`
  - `LandCertificates.tsx`
  - `OfficeManagement.tsx`
  - Cap nhat `Dashboard.tsx`
- Moi trang co:
  - Bang danh sach.
  - Bo loc.
  - Form them/sua.
  - Trang thai/canh bao.
  - Nut xuat bao cao neu co.

### Buoc 4 - Bao cao va dashboard

- Them API tong hop dashboard.
- Them card canh bao va danh sach viec can xu ly.
- Them export Excel cho it nhat:
  - Thu/chi ngan sach.
  - Giai ngan dau tu cong.
  - Tien do GCN/KH965.
  - Viec van phong.

### Buoc 5 - Test va nghiem thu

Bat buoc chay:

```bash
npm run build
npm run build:server
npm run build:client
```

Neu co test hien co:

```bash
npx tsx server/test_e2e_full.ts
```

Them test toi thieu neu phu hop:

- Tao/sua/loc/xuat bao cao ngan sach.
- Tao/sua/loc cong trinh dau tu cong.
- Tao/sua/loc ho so GCN/KH965.
- Tao/sua/duyet viec van phong.
- Kiem tra RBAC: employee khong xem du lieu ngoai pham vi.

## 13. Tieu chi hoan thanh cuoi cung

Chi coi la hoan thanh khi:

- Build frontend/backend pass.
- Khong lam mat tinh nang cu.
- Dang nhap bang tai khoan mau van vao duoc.
- Dashboard co chi so cua cac module moi.
- Moi module moi tao/sua/loc/xem chi tiet duoc.
- Bao cao Excel xuat duoc toi thieu 4 nhom moi.
- RBAC khong bi mo rong qua muc.
- Co audit log cho thao tac quan trong.
- Co file `IMPLEMENTATION_NOTES.md` tong hop:
  - Cac file da sua.
  - Migration da them.
  - Cach chay.
  - Test da chay va ket qua.
  - Viec con ton neu chua lam het.

## 14. Gioi han khong duoc vuot

- Khong doi framework.
- Khong thay database engine neu khong co yeu cau rieng.
- Khong xoa du lieu seed/tai khoan mau dang co.
- Khong hard-code token Zalo/Telegram/OpenAI/DeepSeek.
- Khong dua mat khau that vao code.
- Khong thay doi cong thuc KPI core neu chua ghi ro ly do va duoc chap thuan.
- Khong lam giao dien marketing/landing page; day la he thong dieu hanh noi bo.

## 15. Uu tien trien khai neu thoi gian han che

Thu tu uu tien:

1. Dashboard Chu tich va canh bao viec trong ngay.
2. Tai chinh ngan sach thu/chi.
3. Giai ngan dau tu cong.
4. GCN QSDD va KH965.
5. Quan ly van phong.
6. Nhac viec Zalo/Telegram va AI tong hop.

Neu khong kip lam tat ca, phai hoan thanh tron ven theo module, khong de tinh nang nua voi.

## 16. BO SUNG BAT BUOC - KPI THEO VTVL, KHUNG NANG LUC VA PHAN CONG

Truoc khi sua code KPI, bat buoc doc theo thu tu:

1. `KPI_LEGAL_BASIS.md` - ma tran can cu, trang thai hieu luc va diem can xac minh.
2. `KPI_MODULE_DEEP_SPEC.md` - dac ta chuyen sau da bo sung lop VTVL, khung nang luc, phan cong va snapshot cong thuc.
3. Ho so goc trong thu muc `Phap_ly` va cac file tai lieu duoc cung cap:
   - Phu luc 1A, 1B, 1C ve ban mo ta VTVL.
   - Phu luc 2A, 2B ve khung nang luc cap 1-5.
   - Danh muc cong viec kem QD 15.6/QD 283.
   - QD ban hanh tieu chi 283/QD-UBND cua xa.
   - QD 224/QD-UBND ve phan cong cong tac.
   - Nghi dinh 335/2025/NĐ-CP va So tay Bo Noi vu.

Yeu cau ky thuat:

- Khong tao ket qua KPI neu khong truy duoc chuoi: can cu -> VTVL -> nhiem vu -> san pham -> giao viec -> minh chung -> nghiem thu -> thanh phan diem.
- Import dung ma danh muc, nhom N1-N5, diem cham, san pham chuan va he so; khong tu y doi ma.
- Moi nguoi dung phai co VTVL dang co hieu luc; moi viec phai co mot nguoi phu trach chinh va mot don vi dau moi.
- Tach rieng 30 diem tieu chi chung va phan ket qua nhiem vu; khong cong trung diem nang luc voi diem san pham neu chua co can cu.
- Luu snapshot diem, he so, nhom, can cu va phien ban cong thuc tai thoi diem giao viec; khong tinh hoi to sau khi khoa ky.
- Khong hard-code muc phat tien do/chat luong, nguong xep loai hoac bien quan ly khi chua co can cu da phe duyet; dua vao `kpi_formula_versions`.
- Kiem soat giao viec sai VTVL, sai tham quyen, thieu nguoi phu trach, thieu san pham, thieu deadline va viec co rui ro tai chinh/duat dai/dau tu cong.
- Nhiem vu chuyen giao, nhiem vu nhom va nhiem vu keo dai phai co ty trong, lich su, nguoi duyet va cach tinh rieng.
- Phan tich va ghi ro trong `IMPLEMENTATION_NOTES.md` nhung tai lieu dang du thao, chua duoc xac minh hieu luc hoac can bo sung ban goc.

Bo sung dau ra bat buoc:

- Cap nhat `KPI_LEGAL_BASIS.md` neu phat hien xung dot hoac van ban moi.
- Cap nhat `KPI_MODULE_DEEP_SPEC.md` neu codebase hien co khac ten bang/API nhung phai lap bang mapping, khong tao bang trung lap.
- Them test cho VTVL, import danh muc, he so snapshot, 30/70 diem, khoa ky, chuyen giao, nhiem vu nhom va audit log.
