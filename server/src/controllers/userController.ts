import { Response } from 'express';
import bcrypt from 'bcryptjs';
import db from '../config/db';
import { AuthRequest, logAudit } from '../middleware/auth';

export async function getUsers(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { department_id, role, status, search } = req.query;

    let query = db('users')
      .leftJoin('departments', 'users.department_id', 'departments.id')
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
        'users.created_at',
        'users.updated_at',
        'departments.name as department_name'
      );

    if (department_id) {
      query = query.where('users.department_id', Number(department_id));
    }

    if (role) {
      query = query.where('users.role', String(role));
    }

    if (status) {
      query = query.where('users.status', String(status));
    }

    if (search) {
      const s = `%${String(search).trim()}%`;
      query = query.where(builder => {
        builder.where('users.fullname', 'like', s)
          .orWhere('users.username', 'like', s)
          .orWhere('users.position', 'like', s);
      });
    }

    const users = await query.orderBy('users.id', 'asc');
    res.status(200).json({ users });
  } catch (err) {
    console.error('Lỗi lấy danh sách cán bộ:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi lấy danh sách cán bộ.' });
  }
}

export async function getUserById(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const user = await db('users')
      .leftJoin('departments', 'users.department_id', 'departments.id')
      .where('users.id', Number(id))
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
        'users.created_at',
        'users.updated_at',
        'departments.name as department_name'
      )
      .first();

    if (!user) {
      res.status(404).json({ message: 'Không tìm thấy cán bộ công chức này.' });
      return;
    }

    res.status(200).json({ user });
  } catch (err) {
    console.error('Lỗi lấy thông tin cán bộ:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi lấy thông tin cán bộ.' });
  }
}

export async function createUser(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { username, password, fullname, email, phone, role, position, department_id, status } = req.body;

    if (!username || !password || !fullname || !role || !position) {
      res.status(400).json({ message: 'Vui lòng điền đầy đủ: Tên đăng nhập, Mật khẩu, Họ và tên, Vai trò và Chức vụ.' });
      return;
    }

    // Check if username already exists
    const existing = await db('users').where('username', username.trim()).first();
    if (existing) {
      res.status(400).json({ message: `Tên đăng nhập "${username}" đã được sử dụng.` });
      return;
    }

    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    const [newId] = await db('users').insert({
      username: username.trim(),
      password_hash,
      fullname: fullname.trim(),
      email: email ? email.trim() : null,
      phone: phone ? phone.trim() : null,
      role,
      position: position.trim(),
      department_id: department_id ? Number(department_id) : null,
      status: status || 'ACTIVE'
    });

    const clientIp = req.ip || req.socket.remoteAddress;
    await logAudit(
      req.user?.id || null,
      'CREATE_USER',
      `Tạo tài khoản cán bộ mới: ${fullname} (${username}) - Vai trò: ${role}`,
      clientIp
    );

    const createdUser = await db('users')
      .leftJoin('departments', 'users.department_id', 'departments.id')
      .where('users.id', newId)
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

    res.status(201).json({ message: 'Tạo tài khoản cán bộ thành công!', user: createdUser });
  } catch (err) {
    console.error('Lỗi tạo tài khoản cán bộ:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi tạo tài khoản cán bộ.' });
  }
}

export async function updateUser(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { fullname, email, phone, role, position, department_id, status } = req.body;

    const user = await db('users').where('id', Number(id)).first();
    if (!user) {
      res.status(404).json({ message: 'Không tìm thấy cán bộ công chức cần cập nhật.' });
      return;
    }

    const updates: any = {
      updated_at: new Date()
    };

    if (fullname !== undefined) updates.fullname = fullname.trim();
    if (email !== undefined) updates.email = email ? email.trim() : null;
    if (phone !== undefined) updates.phone = phone ? phone.trim() : null;
    if (role !== undefined) updates.role = role;
    if (position !== undefined) updates.position = position.trim();
    if (department_id !== undefined) updates.department_id = department_id ? Number(department_id) : null;
    if (status !== undefined) updates.status = status;

    await db('users').where('id', Number(id)).update(updates);

    const clientIp = req.ip || req.socket.remoteAddress;
    await logAudit(
      req.user?.id || null,
      'UPDATE_USER',
      `Cập nhật thông tin cán bộ ID ${id}: ${user.fullname}`,
      clientIp
    );

    const updatedUser = await db('users')
      .leftJoin('departments', 'users.department_id', 'departments.id')
      .where('users.id', Number(id))
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

    res.status(200).json({ message: 'Cập nhật thông tin thành công!', user: updatedUser });
  } catch (err) {
    console.error('Lỗi cập nhật cán bộ:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi cập nhật cán bộ.' });
  }
}

export async function resetPassword(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      res.status(400).json({ message: 'Mật khẩu mới phải có ít nhất 6 ký tự.' });
      return;
    }

    const user = await db('users').where('id', Number(id)).first();
    if (!user) {
      res.status(404).json({ message: 'Không tìm thấy cán bộ công chức cần cấp lại mật khẩu.' });
      return;
    }

    const saltRounds = 10;
    const password_hash = await bcrypt.hash(newPassword, saltRounds);

    await db('users').where('id', Number(id)).update({
      password_hash,
      updated_at: new Date()
    });

    const clientIp = req.ip || req.socket.remoteAddress;
    await logAudit(
      req.user?.id || null,
      'RESET_PASSWORD',
      `Quản trị viên đặt lại mật khẩu cho cán bộ: ${user.fullname} (${user.username})`,
      clientIp
    );

    res.status(200).json({ message: `Đã cấp lại mật khẩu mới cho ${user.fullname} thành công.` });
  } catch (err) {
    console.error('Lỗi reset mật khẩu:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi cấp lại mật khẩu.' });
  }
}

export async function deleteUser(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    if (Number(id) === req.user?.id) {
      res.status(400).json({ message: 'Bạn không thể tự xóa tài khoản của chính mình.' });
      return;
    }

    const user = await db('users').where('id', Number(id)).first();
    if (!user) {
      res.status(404).json({ message: 'Không tìm thấy cán bộ công chức cần xóa.' });
      return;
    }

    // Set status to INACTIVE instead of hard delete to preserve foreign key integrity in evaluations and tasks
    await db('users').where('id', Number(id)).update({
      status: 'INACTIVE',
      updated_at: new Date()
    });

    const clientIp = req.ip || req.socket.remoteAddress;
    await logAudit(
      req.user?.id || null,
      'DEACTIVATE_USER',
      `Khóa tài khoản cán bộ: ${user.fullname} (${user.username})`,
      clientIp
    );

    res.status(200).json({ message: `Đã khóa hoạt động của cán bộ ${user.fullname}.` });
  } catch (err) {
    console.error('Lỗi khóa tài khoản cán bộ:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi thao tác xóa/khóa tài khoản.' });
  }
}
