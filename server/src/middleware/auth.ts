import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/jwt';
import db from '../config/db';
import { UserRole } from '../models';

export interface AuthUser {
  id: number;
  username: string;
  fullname: string;
  role: UserRole | string;
  position: string;
  department_id?: number | null;
  department_name?: string | null;
  status: string;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    let token = req.cookies?.token;

    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.substring(7);
    }

    if (!token) {
      res.status(401).json({ message: 'Vui lòng đăng nhập để tiếp tục (Chưa cung cấp token).' });
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; username: string };

    const user = await db('users')
      .leftJoin('departments', 'users.department_id', 'departments.id')
      .where('users.id', decoded.id)
      .select(
        'users.id',
        'users.username',
        'users.fullname',
        'users.role',
        'users.position',
        'users.department_id',
        'users.status',
        'departments.name as department_name'
      )
      .first();

    if (!user) {
      res.status(401).json({ message: 'Tài khoản không tồn tại hoặc đã bị xóa.' });
      return;
    }

    if (user.status !== 'ACTIVE') {
      res.status(403).json({ message: 'Tài khoản này đang bị khóa hoặc ngừng hoạt động.' });
      return;
    }

    req.user = user;
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      res.status(401).json({ message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' });
      return;
    }
    res.status(401).json({ message: 'Token xác thực không hợp lệ.' });
    return;
  }
}

export function requireRole(allowedRoles: (UserRole | string)[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Yêu cầu đăng nhập để truy cập tài nguyên này.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        message: 'Bạn không có quyền thực hiện hành động này.',
        requiredRoles: allowedRoles,
        userRole: req.user.role
      });
      return;
    }

    next();
  };
}

export async function logAudit(
  userId: number | null,
  action: string,
  details?: string,
  ipAddress?: string,
  oldVal?: string,
  newVal?: string,
  reason?: string
): Promise<void> {
  try {
    await db('audit_logs').insert({
      user_id: userId,
      action,
      details: details || null,
      ip_address: ipAddress || null,
      old_value: oldVal || null,
      new_value: newVal || null,
      reason: reason || null
    });
  } catch (err) {
    console.error('Lỗi khi ghi audit log:', err);
  }
}
