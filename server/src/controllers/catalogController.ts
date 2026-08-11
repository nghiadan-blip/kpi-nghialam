import { Request, Response } from 'express';
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

    const existing = await db('product_catalog').where('code', code.trim()).first();
    if (existing) {
      res.status(400).json({ message: `Mã sản phẩm "${code}" đã tồn tại.` });
      return;
    }

    const [id] = await db('product_catalog').insert({
      code: code.trim(),
      name: name.trim(),
      category,
      coefficient: Number(coefficient),
      baseline_score: baseline_score !== undefined ? Number(baseline_score) : 5.0,
      description: description ? description.trim() : null,
      status: status || 'ACTIVE'
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
    if (coefficient !== undefined) updates.coefficient = Number(coefficient);
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
