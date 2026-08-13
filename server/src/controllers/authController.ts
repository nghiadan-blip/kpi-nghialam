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
      .where(function () {
        this.where('users.username', username.trim()).orWhere('users.email', username.trim());
      })
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
        'users.auth_provider',
        'users.rejection_reason',
        'departments.name as department_name'
      )
      .first();

    if (!user) {
      res.status(400).json({ message: 'Tên đăng nhập hoặc mật khẩu không chính xác.' });
      return;
    }

    if (user.status === 'PENDING_APPROVAL') {
      res.status(403).json({
        status: 'PENDING_APPROVAL',
        message:
          'Tài khoản của bạn đang trong danh sách chờ Lãnh đạo / Quản trị viên UBND xã phê duyệt và gán vị trí việc làm.',
      });
      return;
    }

    if (user.status === 'REJECTED') {
      res.status(403).json({
        message: `Yêu cầu đăng ký tài khoản đã bị từ chối.${user.rejection_reason ? ` Lý do: ${user.rejection_reason}` : ''}`,
      });
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
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    const clientIp = req.ip || req.socket.remoteAddress;
    await logAudit(user.id, 'LOGIN', `Đăng nhập thành công với vai trò ${user.role}`, clientIp);

    const { password_hash, ...userProfile } = user;

    res.status(200).json({
      message: 'Đăng nhập thành công!',
      token,
      user: userProfile,
    });
  } catch (err) {
    console.error('Lỗi đăng nhập:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi xử lý đăng nhập.' });
  }
}

// Register new member (Pending Approval)
export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { fullname, email, phone, requested_department, requested_position, password } = req.body;

    if (!fullname || !password || (!email && !phone)) {
      res.status(400).json({
        message: 'Vui lòng cung cấp đầy đủ: Họ tên, Mật khẩu và Email hoặc Số điện thoại.',
      });
      return;
    }

    const cleanFullname = fullname.trim();
    const cleanEmail = email ? email.trim().toLowerCase() : null;
    const cleanPhone = phone ? phone.trim() : null;

    // Check duplicate email (case-insensitive)
    if (cleanEmail) {
      const existingEmail = await db('users')
        .whereRaw('LOWER(email) = ?', [cleanEmail])
        .first();
      if (existingEmail) {
        if (existingEmail.status === 'PENDING_APPROVAL') {
          res.status(400).json({
            message: 'Email này đã gửi hồ sơ đăng ký và đang chờ Lãnh đạo / Quản trị viên duyệt. Vui lòng không gửi lại nhiều lần.',
            status: 'PENDING_APPROVAL',
          });
          return;
        }
        res.status(400).json({ message: 'Email này đã có tài khoản trong hệ thống. Vui lòng đăng nhập.' });
        return;
      }
    }

    // Check duplicate phone
    if (cleanPhone) {
      const existingPhone = await db('users').where('phone', cleanPhone).first();
      if (existingPhone) {
        if (existingPhone.status === 'PENDING_APPROVAL') {
          res.status(400).json({
            message: 'Số điện thoại này đã gửi hồ sơ đăng ký và đang chờ phê duyệt. Vui lòng không gửi lại.',
            status: 'PENDING_APPROVAL',
          });
          return;
        }
        res.status(400).json({ message: 'Số điện thoại này đã được sử dụng trong hệ thống.' });
        return;
      }
    }

    // Check duplicate pending request by exact same fullname
    const duplicatePendingName = await db('users')
      .where('status', 'PENDING_APPROVAL')
      .whereRaw('LOWER(fullname) = ?', [cleanFullname.toLowerCase()])
      .first();
    if (duplicatePendingName) {
      res.status(400).json({
        message: `Hồ sơ đăng ký của cán bộ "${cleanFullname}" đã được tiếp nhận và đang trong danh sách chờ duyệt. Vui lòng không gửi lại nhiều lần.`,
        status: 'PENDING_APPROVAL',
      });
      return;
    }

    // Generate unique username
    let baseUsername = cleanEmail ? cleanEmail.split('@')[0].replace(/[^a-z0-9]/g, '') : 'canbo';
    if (!baseUsername) baseUsername = 'canbo';
    let username = baseUsername;
    let count = 1;
    while (await db('users').where('username', username).first()) {
      username = `${baseUsername}${count}`;
      count++;
    }

    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    const inserted = await db('users').insert({
      username,
      password_hash,
      fullname: fullname.trim(),
      email: email ? email.trim() : null,
      phone: phone ? phone.trim() : null,
      role: 'EMPLOYEE',
      position: requested_position || 'Chờ phê duyệt vị trí',
      status: 'PENDING_APPROVAL',
      auth_provider: 'LOCAL',
      requested_department: requested_department || null,
      requested_position: requested_position || null,
      created_at: new Date(),
      updated_at: new Date(),
    });

    const newUserId = Number(inserted[0]);

    const clientIp = req.ip || req.socket.remoteAddress;
    await logAudit(
      newUserId,
      'REGISTER',
      `Đăng ký thành viên mới: ${fullname} (${email || phone}) - Chờ duyệt`,
      clientIp
    );

    res.status(201).json({
      message:
        'Đăng ký tài khoản thành công! Thông tin của bạn đã được gửi tới Lãnh đạo / Quản trị viên UBND xã Nghĩa Lâm để kiểm duyệt và gán vị trí việc làm.',
      status: 'PENDING_APPROVAL',
      user_id: newUserId,
    });
  } catch (err) {
    console.error('Lỗi đăng ký thành viên:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi đăng ký tài khoản.' });
  }
}

// Gmail / Google Authentication Endpoint
export async function googleAuth(req: Request, res: Response): Promise<void> {
  try {
    const { email, fullname, google_id, avatar_url, requested_department, requested_position } = req.body;

    if (!email) {
      res.status(400).json({ message: 'Vui lòng cung cấp tài khoản Gmail hợp lệ.' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if user exists by email
    let user = await db('users')
      .leftJoin('departments', 'users.department_id', 'departments.id')
      .where('users.email', cleanEmail)
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
        'users.auth_provider',
        'users.rejection_reason',
        'departments.name as department_name'
      )
      .first();

    if (!user) {
      // Create new user with PENDING_APPROVAL
      let baseUsername = cleanEmail.split('@')[0].replace(/[^a-z0-9]/g, '');
      let username = baseUsername;
      let count = 1;
      while (await db('users').where('username', username).first()) {
        username = `${baseUsername}${count}`;
        count++;
      }

      const randomPassword = Math.random().toString(36).slice(-10) + 'A1!';
      const password_hash = await bcrypt.hash(randomPassword, 10);

      const inserted = await db('users').insert({
        username,
        password_hash,
        fullname: fullname ? fullname.trim() : cleanEmail.split('@')[0],
        email: cleanEmail,
        google_id: google_id || null,
        avatar_url: avatar_url || null,
        role: 'EMPLOYEE',
        position: requested_position || 'Chờ phê duyệt vị trí',
        status: 'PENDING_APPROVAL',
        auth_provider: 'GOOGLE',
        requested_department: requested_department || null,
        requested_position: requested_position || null,
        created_at: new Date(),
        updated_at: new Date(),
      });

      const newUserId = Number(inserted[0]);

      const clientIp = req.ip || req.socket.remoteAddress;
      await logAudit(
        newUserId,
        'REGISTER_GOOGLE',
        `Đăng ký qua Gmail: ${cleanEmail} - Chờ Lãnh đạo duyệt`,
        clientIp
      );

      res.status(200).json({
        status: 'PENDING_APPROVAL',
        message:
          'Tài khoản Gmail của bạn đã được ghi nhận! Vui lòng chờ Lãnh đạo / Quản trị viên UBND xã Nghĩa Lâm phê duyệt và gán vị trí việc làm để đăng nhập.',
      });
      return;
    }

    // If existing user is pending approval
    if (user.status === 'PENDING_APPROVAL') {
      res.status(200).json({
        status: 'PENDING_APPROVAL',
        message:
          'Tài khoản Gmail của bạn đang trong danh sách chờ Lãnh đạo UBND xã phê duyệt và gán vị trí việc làm.',
      });
      return;
    }

    if (user.status === 'REJECTED') {
      res.status(403).json({
        message: `Yêu cầu tham gia của tài khoản Gmail này đã bị từ chối.${user.rejection_reason ? ` Lý do: ${user.rejection_reason}` : ''}`,
      });
      return;
    }

    if (user.status !== 'ACTIVE') {
      res.status(403).json({ message: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Quản trị viên.' });
      return;
    }

    // Active approved user -> generate session
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN as any }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const clientIp = req.ip || req.socket.remoteAddress;
    await logAudit(user.id, 'LOGIN_GOOGLE', `Đăng nhập qua Gmail thành công với vai trò ${user.role}`, clientIp);

    res.status(200).json({
      message: 'Đăng nhập Gmail thành công!',
      status: 'ACTIVE',
      token,
      user,
    });
  } catch (err) {
    console.error('Lỗi xác thực Gmail:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi xác thực Gmail.' });
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
        'users.auth_provider',
        'users.avatar_url',
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
      updated_at: new Date(),
    });

    const clientIp = req.ip || req.socket.remoteAddress;
    await logAudit(req.user.id, 'CHANGE_PASSWORD', 'Người dùng tự đổi mật khẩu cá nhân', clientIp);

    res.status(200).json({ message: 'Đổi mật khẩu thành công!' });
  } catch (err) {
    console.error('Lỗi đổi mật khẩu:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi đổi mật khẩu.' });
  }
}
