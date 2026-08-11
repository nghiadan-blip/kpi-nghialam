import { Request, Response } from 'express';
import db from '../config/db';
import { AuthRequest, logAudit } from '../middleware/auth';

export async function getDepartments(_req: Request, res: Response): Promise<void> {
  try {
    const departments = await db('departments as d')
      .leftJoin('departments as p', 'd.parent_id', 'p.id')
      .leftJoin('users as u', 'd.id', 'u.department_id')
      .select(
        'd.id',
        'd.name',
        'd.parent_id',
        'd.created_at',
        'p.name as parent_name'
      )
      .count('u.id as user_count')
      .groupBy('d.id')
      .orderBy('d.id', 'asc');

    res.status(200).json({ departments });
  } catch (err) {
    console.error('Lỗi lấy danh sách phòng ban:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi lấy danh sách phòng ban.' });
  }
}

export async function createDepartment(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { name, parent_id } = req.body;

    if (!name || !name.trim()) {
      res.status(400).json({ message: 'Tên phòng ban / bộ phận không được để trống.' });
      return;
    }

    const [id] = await db('departments').insert({
      name: name.trim(),
      parent_id: parent_id ? Number(parent_id) : null
    });

    const clientIp = req.ip || req.socket.remoteAddress;
    await logAudit(
      req.user?.id || null,
      'CREATE_DEPARTMENT',
      `Thêm phòng ban mới: ${name.trim()}`,
      clientIp
    );

    const created = await db('departments').where('id', id).first();
    res.status(201).json({ message: 'Thêm phòng ban thành công!', department: created });
  } catch (err) {
    console.error('Lỗi tạo phòng ban:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi tạo phòng ban.' });
  }
}

export async function updateDepartment(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { name, parent_id } = req.body;

    const dept = await db('departments').where('id', Number(id)).first();
    if (!dept) {
      res.status(404).json({ message: 'Không tìm thấy phòng ban cần sửa.' });
      return;
    }

    const updates: any = {};
    if (name !== undefined) updates.name = name.trim();
    if (parent_id !== undefined) updates.parent_id = parent_id ? Number(parent_id) : null;

    // Prevent department being its own parent
    if (updates.parent_id === Number(id)) {
      res.status(400).json({ message: 'Phòng ban không thể trực thuộc chính nó.' });
      return;
    }

    await db('departments').where('id', Number(id)).update(updates);

    const clientIp = req.ip || req.socket.remoteAddress;
    await logAudit(
      req.user?.id || null,
      'UPDATE_DEPARTMENT',
      `Cập nhật phòng ban ID ${id}: ${dept.name} -> ${updates.name || dept.name}`,
      clientIp
    );

    const updated = await db('departments').where('id', Number(id)).first();
    res.status(200).json({ message: 'Cập nhật phòng ban thành công!', department: updated });
  } catch (err) {
    console.error('Lỗi cập nhật phòng ban:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi cập nhật phòng ban.' });
  }
}

export async function deleteDepartment(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const dept = await db('departments').where('id', Number(id)).first();
    if (!dept) {
      res.status(404).json({ message: 'Không tìm thấy phòng ban cần xóa.' });
      return;
    }

    // Check if there are users in this department
    const userCount = await db('users').where('department_id', Number(id)).count<{ count: number | string }>('id as count').first();
    const uCount = userCount ? Number((userCount as any).count ?? (userCount as any)['count(`id`)'] ?? 0) : 0;
    if (uCount > 0) {
      res.status(400).json({
        message: `Không thể xóa phòng ban này vì đang có ${uCount} cán bộ trực thuộc. Vui lòng chuyển các cán bộ sang phòng ban khác trước.`
      });
      return;
    }

    // Check if there are sub-departments
    const childCount = await db('departments').where('parent_id', Number(id)).count<{ count: number | string }>('id as count').first();
    const cCount = childCount ? Number((childCount as any).count ?? (childCount as any)['count(`id`)'] ?? 0) : 0;
    if (cCount > 0) {
      res.status(400).json({
        message: `Không thể xóa phòng ban này vì đang có ${cCount} đơn vị cấp dưới trực thuộc.`
      });
      return;
    }

    await db('departments').where('id', Number(id)).del();

    const clientIp = req.ip || req.socket.remoteAddress;
    await logAudit(
      req.user?.id || null,
      'DELETE_DEPARTMENT',
      `Xóa phòng ban: ${dept.name}`,
      clientIp
    );

    res.status(200).json({ message: `Đã xóa phòng ban ${dept.name} thành công.` });
  } catch (err) {
    console.error('Lỗi xóa phòng ban:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi xóa phòng ban.' });
  }
}
