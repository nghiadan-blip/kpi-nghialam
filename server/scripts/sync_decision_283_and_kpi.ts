import * as XLSX from 'xlsx';
import db from '../src/config/db';

const excelPath = 'd:/Dropbox/Văn bản/UBND xa Nghia Lam/CBCC/DM công việc gửi kèm QĐ 15.6.xlsx';

async function syncDecision283AndKPI() {
  console.log('=== ĐỒNG BỘ TOÀN BỘ DANH MỤC KPI THEO QUYẾT ĐỊNH 283/QĐ-UBND XÃ NGHĨA LÂM ===\n');

  const wb = XLSX.readFile(excelPath);

  const itemsToInsert: any[] = [];

  // --- SHEET 2: PL II - Lanh dao QL (PART_A) ---
  const sheet2 = wb.Sheets['PL II - Lanh dao QL'];
  if (sheet2) {
    const rows2: any[] = XLSX.utils.sheet_to_json(sheet2, { header: 1 });
    for (let i = 4; i < rows2.length; i++) {
      const r = rows2[i];
      if (!r || !r[1] || String(r[1]).trim() === '') continue;

      const code = String(r[1]).trim();
      const taskName = String(r[2] || '').trim();
      const detailJob = String(r[3] || '').trim();
      const outputProduct = String(r[4] || '').trim();
      const groupCode = String(r[5] || 'N2').trim();
      const pointRaw = Number(r[7]) || 50;
      const coeffRaw = Number(r[8]) || Number((pointRaw / 5).toFixed(2));
      const note = r[9] ? String(r[9]).trim() : '';

      itemsToInsert.push({
        code,
        name: taskName,
        description: `Chi tiết: ${detailJob}${note ? ` (Ghi chú: ${note})` : ''}`,
        output_product: outputProduct || 'Sản phẩm',
        category: 'PART_A',
        complexity_group: groupCode,
        baseline_score: 5.0,
        coefficient: coeffRaw,
        applicable_position_codes: 'NA-NL-I.01,NA-NL-I.02,NA-NL-I.03,NA-NL-I.04,NA-NL-I.05,NA-NL-I.06',
        frequency: 'Thường xuyên',
        status: 'ACTIVE',
      });
    }
  }

  // --- SHEET 3: PL III - Dung chung (PART_B_GROUP_I) ---
  const sheet3 = wb.Sheets['PL III - Dung chung'];
  if (sheet3) {
    const rows3: any[] = XLSX.utils.sheet_to_json(sheet3, { header: 1 });
    for (let i = 4; i < rows3.length; i++) {
      const r = rows3[i];
      if (!r || !r[1] || String(r[1]).trim() === '') continue;

      const code = String(r[1]).trim();
      const taskName = String(r[2] || '').trim();
      const detailJob = String(r[3] || '').trim();
      const outputProduct = String(r[4] || '').trim();
      const groupCode = String(r[5] || 'N1').trim();
      const pointRaw = Number(r[7]) || 5;
      const coeffRaw = Number(r[8]) || Number((pointRaw / 5).toFixed(2));

      itemsToInsert.push({
        code,
        name: taskName,
        description: `Chi tiết: ${detailJob}`,
        output_product: outputProduct || 'Văn bản/Sản phẩm',
        category: 'PART_B_GROUP_I',
        complexity_group: groupCode,
        baseline_score: 5.0,
        coefficient: coeffRaw,
        applicable_position_codes: 'ALL',
        frequency: 'Thường xuyên',
        status: 'ACTIVE',
      });
    }
  }

  // --- SHEET 4: PL IV - Rieng phong (PART_B_GROUP_II) ---
  const sheet4 = wb.Sheets['PL IV - Rieng phong'];
  if (sheet4) {
    const rows4: any[] = XLSX.utils.sheet_to_json(sheet4, { header: 1 });
    for (let i = 5; i < rows4.length; i++) {
      const r = rows4[i];
      if (!r || !r[1] || String(r[1]).trim() === '') continue;

      const code = String(r[1]).trim();
      const deptName = String(r[2] || '').trim();
      const taskName = String(r[3] || '').trim();
      const detailJob = String(r[4] || '').trim();
      const outputProduct = String(r[5] || '').trim();
      const groupCode = String(r[6] || 'N2').trim();
      const pointRaw = Number(r[8]) || 25;
      const coeffRaw = Number(r[9]) || Number((pointRaw / 5).toFixed(2));
      const note = r[10] ? String(r[10]).trim() : '';

      let posCodes = 'ALL';
      if (deptName.includes('Văn phòng')) {
        posCodes = 'NA-NL-II.02,NA-NL-II.04,NA-NL-I.03';
      } else if (deptName.includes('Kinh tế')) {
        posCodes = 'NA-NL-II.15,NA-NL-II.16,NA-NL-II.13,NA-NL-I.03,NA-NL-I.06';
      } else if (deptName.includes('Văn hóa')) {
        posCodes = 'NA-NL-II.21,NA-NL-II.22,NA-NL-II.23,NA-NL-I.04,NA-NL-I.06';
      } else if (deptName.includes('hành chính công')) {
        posCodes = 'NA-NL-II.02,NA-NL-I.05';
      }

      itemsToInsert.push({
        code,
        name: taskName,
        description: `[${deptName}] ${detailJob}${note ? ` (${note})` : ''}`,
        output_product: outputProduct || 'Hồ sơ/Sản phẩm',
        category: 'PART_B_GROUP_II',
        complexity_group: groupCode,
        baseline_score: 5.0,
        coefficient: coeffRaw,
        applicable_position_codes: posCodes,
        frequency: 'Thường xuyên',
        status: 'ACTIVE',
      });
    }
  }

  console.log(`Đã phân tích tổng cộng ${itemsToInsert.length} danh mục SPCV chuẩn từ file Quyết định 283.`);

  let inserted = 0;
  let updated = 0;

  for (const item of itemsToInsert) {
    const existing = await db('product_catalog').where('code', item.code).first();
    if (existing) {
      await db('product_catalog')
        .where('id', existing.id)
        .update({
          name: item.name,
          description: item.description,
          output_product: item.output_product,
          category: item.category,
          complexity_group: item.complexity_group,
          baseline_score: item.baseline_score,
          coefficient: item.coefficient,
          applicable_position_codes: item.applicable_position_codes,
          frequency: item.frequency,
          status: item.status,
        });
      updated++;
    } else {
      await db('product_catalog').insert({
        ...item,
        created_at: new Date().toISOString(),
      });
      inserted++;
    }
  }

  const finalTotal = await db('product_catalog').count('id as count').first();

  console.log('\n=============================================');
  console.log(`🎉 HOÀN THÀNH ĐỒNG BỘ DANH MỤC KPI QUYẾT ĐỊNH 283/QĐ-UBND!`);
  console.log(`- Thêm mới: ${inserted} mục`);
  console.log(`- Cập nhật: ${updated} mục`);
  console.log(`- Tổng số danh mục SPCV trong hệ thống: ${(finalTotal as any)?.count} mục`);
  console.log('=============================================\n');

  process.exit(0);
}

syncDecision283AndKPI().catch((err) => {
  console.error('Lỗi khi đồng bộ KPI QĐ 283:', err);
  process.exit(1);
});
