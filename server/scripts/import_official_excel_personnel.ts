import bcrypt from 'bcryptjs';
import * as XLSX from 'xlsx';
import db from '../src/config/db';

const filePath = 'd:/Dropbox/Văn bản/UBND xa Nghia Lam/CBCC/email_Nghia_Lam_cap_nhat_bo_sung_22-07-2026.xlsx';

function removeVietnameseTones(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

function generateUsername(fullname: string, email?: string): string {
  if (email && email.includes('@')) {
    const prefix = email.split('@')[0].replace(/[^a-zA-Z0-9._]/g, '').toLowerCase();
    if (prefix.length >= 3 && !prefix.startsWith('canbotest')) return prefix;
  }
  const clean = removeVietnameseTones(fullname);
  return clean || 'canbo_' + Math.floor(Math.random() * 10000);
}

function mapDepartmentAndRole(position: string, workUnit: string): { deptId: number; role: string; posCode: string; posTitle: string } {
  const p = (position || '').toLowerCase();
  const u = (workUnit || '').toLowerCase();

  // 1. Cung ứng dịch vụ công
  if (u.includes('cung ứng') || u.includes('dịch vụ công') || p.includes('viên chức')) {
    return {
      deptId: 9, // Cung ứng dịch vụ công
      role: 'EMPLOYEE',
      posCode: 'NA-NL-III.1',
      posTitle: position || 'Viên chức cung ứng dịch vụ công',
    };
  }

  // 2. Lãnh đạo UBND / HĐND
  if (p.includes('ct. ubnd') || p.includes('chủ tịch ubnd')) {
    return { deptId: 1, role: 'LEADERSHIP', posCode: 'NA-NL-I.01', posTitle: 'Chủ tịch UBND xã' };
  }
  if (p.includes('phó chủ tịch') || p.includes('pct')) {
    return { deptId: 1, role: 'LEADERSHIP', posCode: 'NA-NL-I.02', posTitle: 'Phó Chủ tịch UBND xã' };
  }
  if (p.includes('hđnd') || p.includes('pt. hđnd') || p.includes('phó ban') || p.includes('ban khxh') || p.includes('pháp chế')) {
    return { deptId: 1, role: 'LEADERSHIP', posCode: 'NA-NL-I.01', posTitle: position || 'Thường trực HĐND xã' };
  }

  // 3. TTPVHCC
  if (p.includes('giám đốc ttpvhcc')) {
    return { deptId: 2, role: 'DEPARTMENT_HEAD', posCode: 'NA-NL-I.05', posTitle: 'Giám đốc Trung tâm Phục vụ hành chính công' };
  }
  if (p.includes('ttpvhcc') || p.includes('một cửa')) {
    return { deptId: 2, role: 'EMPLOYEE', posCode: 'NA-NL-II.02', posTitle: position || 'Chuyên viên TTPVHCC' };
  }

  // 4. Phòng Văn hóa
  if (p.includes('trưởng phòng văn hoá') || p.includes('trưởng phòng vh')) {
    return { deptId: 4, role: 'DEPARTMENT_HEAD', posCode: 'NA-NL-I.04', posTitle: 'Trưởng phòng Văn hóa - Xã hội' };
  }
  if (p.includes('phó trưởng phòng văn hoá') || p.includes('phó trưởng phòng vh')) {
    return { deptId: 4, role: 'DEPARTMENT_HEAD', posCode: 'NA-NL-I.06', posTitle: 'Phó Trưởng phòng Văn hóa - Xã hội' };
  }
  if (p.includes('phòng vh') || p.includes('phòng vhxh') || p.includes('lao động') || p.includes('tbxh') || p.includes('văn hóa')) {
    return { deptId: 4, role: 'EMPLOYEE', posCode: 'NA-NL-II.21', posTitle: position || 'Chuyên viên Văn hóa - Xã hội' };
  }

  // 5. Phòng Kinh tế / Địa chính - Xây dựng - Nông nghiệp
  if (p.includes('trưởng phòng kt') || p.includes('trưởng phòng kinh tế')) {
    return { deptId: 3, role: 'DEPARTMENT_HEAD', posCode: 'NA-NL-I.03', posTitle: 'Trưởng phòng Kinh tế / Địa chính' };
  }
  if (p.includes('phó trưởng phòng kinh tế') || p.includes('phó trưởng phòng kt')) {
    return { deptId: 3, role: 'DEPARTMENT_HEAD', posCode: 'NA-NL-I.06', posTitle: 'Phó Trưởng phòng Kinh tế' };
  }
  if (p.includes('phòng kt') || p.includes('đất đai') || p.includes('địa chính') || p.includes('nông nghiệp') || p.includes('xây dựng')) {
    return { deptId: 3, role: 'EMPLOYEE', posCode: 'NA-NL-II.15', posTitle: position || 'Chuyên viên Kinh tế / Địa chính - Xây dựng' };
  }

  // 6. Tài chính - Kế toán
  if (p.includes('kế toán') || p.includes('ngân sách') || p.includes('tài chính')) {
    return { deptId: 6, role: 'EMPLOYEE', posCode: 'NA-NL-II.06', posTitle: position || 'Chuyên viên Tài chính - Kế toán' };
  }

  // 7. Chánh văn phòng / Văn phòng
  if (p.includes('chánh văn phòng')) {
    return { deptId: 5, role: 'DEPARTMENT_HEAD', posCode: 'NA-NL-I.03', posTitle: 'Chánh Văn phòng HĐND & UBND' };
  }

  // Mặc định: Văn phòng - Thống kê (ID 5)
  return { deptId: 5, role: 'EMPLOYEE', posCode: 'NA-NL-II.02', posTitle: position || 'Chuyên viên Văn phòng - Thống kê' };
}

async function importExcelPersonnel() {
  console.log('=== BẮT ĐẦU NHẬP DANH SÁCH 45 CÁN BỘ TỪ FILE EXCEL ===\n');

  const wb = XLSX.readFile(filePath);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rawRows: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  // Header is at row index 5 (Row 6)
  // Data starts at row index 6 (Row 7)
  const defaultPasswordHash = await bcrypt.hash('cbcc123', 10);

  let insertedCount = 0;
  let updatedCount = 0;

  for (let i = 6; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (!row || row.length === 0 || !row[1] || typeof row[1] !== 'string') continue;
    if (row[0] && String(row[0]).includes('*')) break; // Stop at footnotes

    const stt = row[0];
    const fullname = String(row[1]).trim();
    const workUnit = row[2] ? String(row[2]).trim() : 'UBND xã Nghĩa Lâm';
    const cccd = row[3] ? String(row[3]).trim() : null;
    const position = row[4] ? String(row[4]).trim() : 'Chuyên viên';
    const email = row[5] ? String(row[5]).trim() : null;
    const gender = row[6] ? String(row[6]).trim() : null;
    const phone = row[8] ? String(row[8]).trim() : null;

    const { deptId, role, posCode, posTitle } = mapDepartmentAndRole(position, workUnit);
    let username = generateUsername(fullname, email || undefined);

    // Check if user with similar email or fullname exists
    let existingUser = null;
    if (email) {
      existingUser = await db('users').where('email', email).first();
    }
    if (!existingUser) {
      existingUser = await db('users').where('fullname', fullname).first();
    }
    if (!existingUser) {
      existingUser = await db('users').where('username', username).first();
    }

    if (existingUser) {
      // Update existing record
      await db('users')
        .where('id', existingUser.id)
        .update({
          fullname,
          email: email || existingUser.email,
          phone: phone || existingUser.phone,
          department_id: deptId,
          role: role === 'ADMIN' ? 'ADMIN' : role,
          position: posTitle,
          position_code: posCode,
          status: 'ACTIVE',
          updated_at: new Date().toISOString(),
        });
      console.log(`🔄 [${stt || '-'}] CẬP NHẬT: ${fullname} (${existingUser.username}) -> [${posCode}] ${posTitle} - Phòng ID: ${deptId}`);
      updatedCount++;
    } else {
      // Check username collision
      const checkUser = await db('users').where('username', username).first();
      if (checkUser) {
        username = `${username}_${Math.floor(100 + Math.random() * 900)}`;
      }

      await db('users').insert({
        username,
        password_hash: defaultPasswordHash,
        fullname,
        email: email || `${username}@nghialam.nghean.gov.vn`,
        phone,
        department_id: deptId,
        role,
        position: posTitle,
        position_code: posCode,
        status: 'ACTIVE',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      console.log(`✨ [${stt || '-'}] THÊM MỚI: ${fullname} (${username}) -> [${posCode}] ${posTitle} - Phòng ID: ${deptId}`);
      insertedCount++;
    }
  }

  // Summary
  const totalInDb = await db('users').count('id as count').first();
  console.log('\n=============================================');
  console.log(`🎉 HOÀN THÀNH NẠP DANH SÁCH CÁN BỘ XÃ NGHĨA LÂM!`);
  console.log(`- Thêm mới: ${insertedCount} cán bộ`);
  console.log(`- Cập nhật thông tin: ${updatedCount} cán bộ`);
  console.log(`- Tổng số cán bộ trong hệ thống: ${(totalInDb as any)?.count} người`);
  console.log(`- Mật khẩu mặc định cho cán bộ mới: cbcc123`);
  console.log('=============================================\n');

  process.exit(0);
}

importExcelPersonnel().catch((err) => {
  console.error('Lỗi khi nạp dữ liệu cán bộ:', err);
  process.exit(1);
});
