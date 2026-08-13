import * as XLSX from 'xlsx';

const excelPath = 'd:/Dropbox/Văn bản/UBND xa Nghia Lam/CBCC/DM công việc gửi kèm QĐ 15.6.xlsx';
const wb = XLSX.readFile(excelPath);
const sheet4 = wb.Sheets['PL IV - Rieng phong'];
const rows4: any[] = XLSX.utils.sheet_to_json(sheet4, { header: 1 });

console.log('=== PHỤ LỤC IV: CÁC PHÒNG BAN VÀ MÃ CÔNG VIỆC ===');
const depts = new Set();
let count = 0;

for (let i = 5; i < rows4.length; i++) {
  const r = rows4[i];
  if (r && r[1]) {
    depts.add(r[2]);
    count++;
  }
}

console.log('Total catalog items in PL IV:', count);
console.log('Departments found in PL IV:');
depts.forEach(d => console.log(' -', d));
