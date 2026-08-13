import * as XLSX from 'xlsx';

const excelPath = 'd:/Dropbox/Văn bản/UBND xa Nghia Lam/CBCC/DM công việc gửi kèm QĐ 15.6.xlsx';
const wb = XLSX.readFile(excelPath);
const sheet1 = wb.Sheets['PL I - Tieu chi chung'];
const rows1 = XLSX.utils.sheet_to_json(sheet1, { header: 1 });
console.log('=== PHỤ LỤC I: TIÊU CHÍ CHUNG (TẤT CẢ CÁC DÒNG) ===');
rows1.forEach((r: any, idx: number) => {
  console.log(`[${idx + 1}]`, JSON.stringify(r));
});
