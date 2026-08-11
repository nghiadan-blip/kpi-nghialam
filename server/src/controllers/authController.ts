import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../config/db';
import { JWT_SECRET, JWT_EXPIRES_IN } from '../config/jwt';
import { AuthRequest, logAudit } from '../middleware/auth';

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ message: 'Vui lòng nhập tên đăng nhập và mật khẩu.' });
      return;
    }

    const user = await db('users')
      .leftJoin('departments', 'users.department_id', 'departments.id')
      .where('users.username', username.trim())
      .select(
        'users.id',
        'users.username',
        'users.password_hash',
        'users.fullname',
        'users.email',
        'users.phone',
        'users.role',
        'users.position',
        'users.department_id',
        'users.status',
        'departments.name as department_name'
      )
      .first();

    if (!user) {
      res.status(400).json({ message: 'Tên đăng nhập hoặc mật khẩu không chính xác.' });
      return;
    }

    if (user.status !== 'ACTIVE') {
      res.status(403).json({ message: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Quản trị viên.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      res.status(400).json({ message: 'Tên đăng nhập hoặc mật khẩu không chính xác.' });
      return;
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN as any }
    );

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    const clientIp = req.ip || req.socket.remoteAddress;
    await logAudit(user.id, 'LOGIN', `Đăng nhập thành công với vai trò ${user.role}`, clientIp);

    // Don't send password hash back
    const { password_hash, ...userProfile } = user;

    res.status(200).json({
      message: 'Đăng nhập thành công!',
      token,
      user: userProfile
    });
  } catch (err) {
    console.error('Lỗi đăng nhập:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi xử lý đăng nhập.' });
  }
}

export async function logout(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (req.user) {
      const clientIp = req.ip || req.socket.remoteAddress;
      await logAudit(req.user.id, 'LOGOUT', 'Đăng xuất khỏi hệ thống', clientIp);
    }

    res.clearCookie('token');
    res.status(200).json({ message: 'Đăng xuất thành công.' });
  } catch (err) {
    console.error('Lỗi đăng xuất:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi đăng xuất.' });
  }
}

export async function me(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Chưa xác thực danh tính.' });
      return;
    }

    const user = await db('users')
      .leftJoin('departments', 'users.department_id', 'departments.id')
      .where('users.id', req.user.id)
      .select(
        'users.id',
        'users.username',
        'users.fullname',
        'users.email',
        'users.phone',
        'users.role',
        'users.position',
        'users.department_id',
        'users.status',
        'departments.name as department_name'
      )
      .first();

    if (!user) {
      res.status(404).json({ message: 'Không tìm thấy thông tin tài khoản.' });
      return;
    }

    res.status(200).json({ user });
  } catch (err) {
    console.error('Lỗi lấy thông tin người dùng:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi lấy thông tin cá nhân.' });
  }
}

export async function changePassword(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Chưa xác thực danh tính.' });
      return;
    }

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      res.status(400).json({ message: 'Vui lòng cung cấp mật khẩu hiện tại và mật khẩu mới.' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ message: 'Mật khẩu mới phải có ít nhất 6 ký tự.' });
      return;
    }

    const user = await db('users').where('id', req.user.id).first();
    if (!user) {
      res.status(404).json({ message: 'Không tìm thấy thông tin tài khoản.' });
      return;
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      res.status(400).json({ message: 'Mật khẩu hiện tại không chính xác.' });
      return;
    }

    const saltRounds = 10;
    const newHash = await bcrypt.hash(newPassword, saltRounds);

    await db('users').where('id', req.user.id).update({
      password_hash: newHash,
      updated_at: new Date()
    });

    const clientIp = req.ip || req.socket.remoteAddress;
    await logAudit(req.user.id, 'CHANGE_PASSWORD', 'Người dùng tự đổi mật khẩu cá nhân', clientIp);

    res.status(200).json({ message: 'Đổi mật khẩu thành công!' });
  } catch (err) {
    console.error('Lỗi đổi mật khẩu:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi đổi mật khẩu.' });
  }
}
