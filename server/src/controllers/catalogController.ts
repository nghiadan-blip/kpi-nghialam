import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import * as XLSX from 'xlsx';
import db from '../config/db';
import { AuthRequest, logAudit } from '../middleware/auth';

export async function getCatalog(req: Request, res: Response): Promise<void> {
  try {
    const { category, status } = req.query;

    let query = db('product_catalog').select('*');

    if (category) {
      query = query.where('category', String(category));
    }

    if (status) {
      query = query.where('status', String(status));
    } else {
      // Default to active items
      query = query.where('status', 'ACTIVE');
    }

    const items = await query.orderBy('id', 'asc');
    res.status(200).json({ catalog: items });
  } catch (err) {
    console.error('Lỗi lấy danh mục sản phẩm NĐ 335:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi lấy danh mục sản phẩm.' });
  }
}

export async function getCatalogById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const item = await db('product_catalog').where('id', Number(id)).first();

    if (!item) {
      res.status(404).json({ message: 'Không tìm thấy sản phẩm trong danh mục.' });
      return;
    }

    res.status(200).json({ item });
  } catch (err) {
    console.error('Lỗi lấy chi tiết sản phẩm:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi lấy chi tiết sản phẩm.' });
  }
}

export async function createCatalogItem(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { code, name, category, coefficient, baseline_score, description, status } = req.body;

    if (!code || !name || !category || coefficient === undefined) {
      res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ: Mã, Tên sản phẩm, Nhóm danh mục và Hệ số.' });
      return;
    }

    const K = Number(coefficient);
    if (isNaN(K) || K <= 0) {
      res.status(400).json({ message: 'Hệ số quy đổi K phải là số dương lớn hơn 0.' });
      return;
    }

    const existing = await db('product_catalog').where('code', code.trim()).first();
    if (existing) {
      res.status(400).json({ message: `Mã sản phẩm "${code}" đã tồn tại.` });
      return;
    }

    const [id] = await db('product_catalog').insert({
      code: code.trim(),
      name: name.trim(),
      category,
      coefficient: K,
      baseline_score: baseline_score !== undefined ? Number(baseline_score) : 5.0,
      description: description ? description.trim() : null,
      status: status || 'ACTIVE',
    });

    const clientIp = req.ip || req.socket.remoteAddress;
    await logAudit(
      req.user?.id || null,
      'CREATE_CATALOG_ITEM',
      `Thêm sản phẩm danh mục NĐ 335: ${name} (${code}) - Hệ số: ${coefficient}`,
      clientIp
    );

    const created = await db('product_catalog').where('id', id).first();
    res.status(201).json({ message: 'Thêm sản phẩm danh mục thành công!', item: created });
  } catch (err) {
    console.error('Lỗi tạo sản phẩm danh mục:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi tạo sản phẩm danh mục.' });
  }
}

// Bulk Import Catalog from Excel JSON Array
export async function importCatalogExcel(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ message: 'Dữ liệu danh mục không hợp lệ hoặc rỗng.' });
      return;
    }

    let createdCount = 0;
    let updatedCount = 0;

    for (const row of items) {
      if (!row.name || !row.name.trim()) continue;

      const name = String(row.name).trim();
      let code = row.code ? String(row.code).trim() : null;
      if (!code) {
        code = 'CV_' + Math.random().toString(36).substring(2, 8).toUpperCase();
      }

      let category = row.category || 'PART_A';
      if (typeof row.category === 'string') {
        const catUpper = row.category.toUpperCase();
        if (catUpper.includes('B.I') || catUpper.includes('NHÓM I') || catUpper.includes('GROUP_I')) {
          category = 'PART_B_GROUP_I';
        } else if (catUpper.includes('B.II') || catUpper.includes('NHÓM II') || catUpper.includes('GROUP_II')) {
          category = 'PART_B_GROUP_II';
        } else {
          category = 'PART_A';
        }
      }

      const coefficient = row.coefficient !== undefined ? Number(row.coefficient) || 1.0 : 1.0;
      const baseline_score = row.baseline_score !== undefined ? Number(row.baseline_score) || 5.0 : 5.0;
      const description = row.description ? String(row.description).trim() : null;

      const existing = await db('product_catalog').where('code', code).first();

      if (existing) {
        await db('product_catalog')
          .where('id', existing.id)
          .update({
            name,
            category,
            coefficient,
            baseline_score,
            description: description || existing.description,
            status: 'ACTIVE',
          });
        updatedCount++;
      } else {
        await db('product_catalog').insert({
          code,
          name,
          category,
          coefficient,
          baseline_score,
          description,
          status: 'ACTIVE',
        });
        createdCount++;
      }
    }

    const clientIp = req.ip || req.socket.remoteAddress;
    await logAudit(
      req.user?.id || null,
      'IMPORT_CATALOG_EXCEL',
      `Nhập danh mục NĐ 335 từ Excel: Thêm ${createdCount}, Cập nhật ${updatedCount} mục`,
      clientIp
    );

    res.status(200).json({
      message: `Nhập danh mục NĐ 335 thành công! Đã thêm mới ${createdCount} và cập nhật ${updatedCount} mục sản phẩm chuẩn.`,
      created_count: createdCount,
      updated_count: updatedCount,
    });
  } catch (err) {
    console.error('Lỗi nhập danh mục từ Excel:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi nhập danh mục NĐ 335 từ Excel.' });
  }
}

// 1-Click Load Official Catalog from local "Danh mục sản phẩm CV kèm QĐ - Nghia Lam.xlsx"
export async function importOfficialQD(req: AuthRequest, res: Response): Promise<void> {
  try {
    const filePath = path.resolve(__dirname, '../../../../Danh mục sản phẩm CV kèm QĐ - Nghia Lam.xlsx');

    if (!fs.existsSync(filePath)) {
      res.status(404).json({ message: 'Không tìm thấy tệp danh mục QĐ Nghĩa Lâm trên máy chủ.' });
      return;
    }

    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawData: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    let createdCount = 0;
    let updatedCount = 0;
    let currentCategory = 'PART_A';

    // Skip headers (starts around row 8 or 9)
    for (let r = 7; r < rawData.length; r++) {
      const row = rawData[r];
      if (!row || row.length === 0) continue;

      const colA = row[0] ? String(row[0]).trim() : '';
      const taskName = row[1] ? String(row[1]).trim() : '';
      const taskCode = row[2] ? String(row[2]).trim() : '';
      const productDesc = row[3] ? String(row[3]).trim() : '';
      const groupCol = row[4] ? String(row[4]).trim() : '';
      const rawBaseline = row[5];
      const rawCoeff = row[6];

      // Check section header like 'A', 'B', 'I', 'II'
      if (taskName.includes('PHẦN B') || taskName.includes('CÔNG VIỆC THEO VỊ TRÍ')) {
        currentCategory = 'PART_B_GROUP_I';
      }
      if (groupCol.includes('II') || groupCol.includes('Nhóm 2')) {
        currentCategory = 'PART_B_GROUP_II';
      }

      if (!taskName || taskName === 'Nhiệm vụ' || taskName.startsWith('(1)')) continue;

      const code = taskCode || `NL_${r}_${colA.replace(/[^a-zA-Z0-9]/g, '')}`;
      const coeff = Number(rawCoeff) > 0 ? Number(rawCoeff) : 1.0;
      const baseline = Number(rawBaseline) > 0 ? Number(rawBaseline) : 5.0;

      const existing = await db('product_catalog').where('code', code).first();
      if (existing) {
        await db('product_catalog').where('id', existing.id).update({
          name: taskName,
          category: currentCategory,
          coefficient: coeff,
          baseline_score: baseline,
          description: productDesc || null,
          status: 'ACTIVE',
        });
        updatedCount++;
      } else {
        await db('product_catalog').insert({
          code,
          name: taskName,
          category: currentCategory,
          coefficient: coeff,
          baseline_score: baseline,
          description: productDesc || null,
          status: 'ACTIVE',
        });
        createdCount++;
      }
    }

    const clientIp = req.ip || req.socket.remoteAddress;
    await logAudit(
      req.user?.id || null,
      'IMPORT_OFFICIAL_CATALOG_QD',
      `Nạp danh mục QĐ Nghĩa Lâm: Đã thêm ${createdCount}, cập nhật ${updatedCount} mục`,
      clientIp
    );

    res.status(200).json({
      message: `Đã nạp thành công toàn bộ danh mục sản phẩm từ Quyết định UBND xã Nghĩa Lâm (${createdCount + updatedCount} mục)!`,
      created_count: createdCount,
      updated_count: updatedCount,
      total: createdCount + updatedCount,
    });
  } catch (err) {
    console.error('Lỗi nạp danh mục QĐ Nghĩa Lâm:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi nạp danh mục QĐ Nghĩa Lâm.' });
  }
}

export async function updateCatalogItem(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { name, category, coefficient, baseline_score, description, status } = req.body;

    const item = await db('product_catalog').where('id', Number(id)).first();
    if (!item) {
      res.status(404).json({ message: 'Không tìm thấy sản phẩm cần cập nhật.' });
      return;
    }

    const updates: any = {};
    if (name !== undefined) updates.name = name.trim();
    if (category !== undefined) updates.category = category;
    if (coefficient !== undefined) {
      const K = Number(coefficient);
      if (isNaN(K) || K <= 0) {
        res.status(400).json({ message: 'Hệ số quy đổi K phải là số dương lớn hơn 0.' });
        return;
      }
      updates.coefficient = K;
    }
    if (baseline_score !== undefined) updates.baseline_score = Number(baseline_score);
    if (description !== undefined) updates.description = description ? description.trim() : null;
    if (status !== undefined) updates.status = status;

    await db('product_catalog').where('id', Number(id)).update(updates);

    const clientIp = req.ip || req.socket.remoteAddress;
    await logAudit(
      req.user?.id || null,
      'UPDATE_CATALOG_ITEM',
      `Cập nhật sản phẩm danh mục ID ${id}: ${item.name}`,
      clientIp
    );

    const updated = await db('product_catalog').where('id', Number(id)).first();
    res.status(200).json({ message: 'Cập nhật sản phẩm danh mục thành công!', item: updated });
  } catch (err) {
    console.error('Lỗi cập nhật sản phẩm danh mục:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi cập nhật sản phẩm danh mục.' });
  }
}

export async function deleteCatalogItem(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const item = await db('product_catalog').where('id', Number(id)).first();
    if (!item) {
      res.status(404).json({ message: 'Không tìm thấy sản phẩm danh mục cần xóa.' });
      return;
    }

    // Soft delete: set status to INACTIVE
    await db('product_catalog').where('id', Number(id)).update({ status: 'INACTIVE' });

    const clientIp = req.ip || req.socket.remoteAddress;
    await logAudit(
      req.user?.id || null,
      'DEACTIVATE_CATALOG_ITEM',
      `Khóa sản phẩm danh mục: ${item.name} (${item.code})`,
      clientIp
    );

    res.status(200).json({ message: `Đã khóa sản phẩm danh mục ${item.name}.` });
  } catch (err) {
    console.error('Lỗi khóa sản phẩm danh mục:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi thao tác xóa sản phẩm danh mục.' });
  }
}
