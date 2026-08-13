import path from 'path';
import * as XLSX from 'xlsx';

const filePath = 'd:/Dropbox/Văn bản/UBND xa Nghia Lam/CBCC/email_Nghia_Lam_cap_nhat_bo_sung_22-07-2026.xlsx';

const wb = XLSX.readFile(filePath);
console.log('=== FILE SHEETS ===', wb.SheetNames);

for (const sheetName of wb.SheetNames) {
  console.log(`\n--- SHEET: ${sheetName} ---`);
  const sheet = wb.Sheets[sheetName];
  const rows: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  rows.forEach((r, idx) => {
    if (r && r.length > 0) {
      console.log(`Row ${idx + 1}:`, JSON.stringify(r));
    }
  });
}
