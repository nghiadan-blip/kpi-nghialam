import { Request, Response } from 'express';
import db from '../config/db';
import { AuthRequest } from '../middleware/auth';

export async function getJobPositions(req: Request, res: Response): Promise<void> {
  try {
    const { group_type } = req.query;

    let query = db('job_positions').select('*');
    if (group_type) {
      query = query.where('group_type', String(group_type));
    }

    const positions = await query.orderBy('code', 'asc');

    // Count assigned active users for each position
    const assignedCounts = await db('users')
      .where('status', 'ACTIVE')
      .whereNotNull('position_code')
      .groupBy('position_code')
      .select('position_code')
      .count('id as current_assigned');

    const countMap = new Map<string, number>();
    assignedCounts.forEach((row: any) => {
      countMap.set(row.position_code, Number(row.current_assigned || 0));
    });

    const enriched = positions.map((p) => {
      const current = countMap.get(p.code) || 0;
      const isVacant = p.allocated_quota > 0 && current === 0;
      const isOverQuota = p.allocated_quota > 0 && current > p.allocated_quota;
      const fillRate = p.allocated_quota > 0 ? Math.round((current / p.allocated_quota) * 100) : 0;

      return {
        ...p,
        current_assigned: current,
        is_vacant: isVacant,
        is_over_quota: isOverQuota,
        fill_rate_percent: fillRate,
      };
    });

    res.status(200).json({
      job_positions: enriched,
      total_positions: enriched.length,
      total_allocated_quota: enriched.reduce((sum, p) => sum + p.allocated_quota, 0),
      total_assigned: enriched.reduce((sum, p) => sum + p.current_assigned, 0),
    });
  } catch (err) {
    console.error('Lỗi lấy danh sách vị trí việc làm:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi lấy danh mục vị trí việc làm.' });
  }
}

export async function getJobPositionByCode(req: Request, res: Response): Promise<void> {
  try {
    const { code } = req.params;
    const position = await db('job_positions').where('code', code).first();
    if (!position) {
      res.status(404).json({ message: 'Không tìm thấy vị trí việc làm này.' });
      return;
    }

    const assignedUsers = await db('users')
      .where('position_code', code)
      .where('status', 'ACTIVE')
      .select('id', 'fullname', 'username', 'email', 'phone', 'role');

    res.status(200).json({
      position: {
        ...position,
        assigned_users: assignedUsers,
        current_assigned: assignedUsers.length,
      },
    });
  } catch (err) {
    console.error('Lỗi lấy chi tiết vị trí việc làm:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi lấy chi tiết vị trí việc làm.' });
  }
}
