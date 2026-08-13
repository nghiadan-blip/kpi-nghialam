import path from 'path';
import * as XLSX from 'xlsx';
import fs from 'fs';

const excelPath = 'd:/Dropbox/Văn bản/UBND xa Nghia Lam/CBCC/DM công việc gửi kèm QĐ 15.6.xlsx';

if (fs.existsSync(excelPath)) {
  const wb = XLSX.readFile(excelPath);
  console.log('=== SHEETS IN DM công việc gửi kèm QĐ 15.6.xlsx ===');
  console.log(wb.SheetNames);

  for (const name of wb.SheetNames) {
    console.log(`\n--- SHEET: ${name} ---`);
    const sheet = wb.Sheets[name];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    console.log(`Total rows in sheet ${name}: ${rows.length}`);
    console.log('First 10 rows:');
    rows.slice(0, 10).forEach((r, idx) => {
      console.log(`Row ${idx + 1}:`, JSON.stringify(r));
    });
  }
} else {
  console.log('File does not exist:', excelPath);
}
