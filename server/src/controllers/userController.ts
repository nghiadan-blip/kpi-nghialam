import { Response } from 'express';
import bcrypt from 'bcryptjs';
import db from '../config/db';
import { AuthRequest, logAudit } from '../middleware/auth';

export async function getUsers(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { department_id, role, status, search } = req.query;

    let query = db('users')
      .leftJoin('departments', 'users.department_id', 'departments.id')
      .leftJoin('job_positions', 'users.position_code', 'job_positions.code')
      .select(
        'users.id',
        'users.username',
        'users.fullname',
        'users.email',
        'users.phone',
        'users.role',
        'users.position',
        'users.position_code',
        'users.department_id',
        'users.status',
        'users.auth_provider',
        'users.requested_department',
        'users.requested_position',
        'users.rejection_reason',
        'users.is_disciplined',
        'users.discipline_details',
        'users.created_at',
        'users.updated_at',
        'departments.name as department_name',
        'job_positions.name as official_position_name',
        'job_positions.civil_service_rank',
        'job_positions.allocated_quota'
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
      query = query.where((builder) => {
        builder
          .where('users.fullname', 'like', s)
          .orWhere('users.username', 'like', s)
          .orWhere('users.position', 'like', s)
          .orWhere('users.email', 'like', s);
      });
    }

    const users = await query.orderBy('users.id', 'asc');
    res.status(200).json({ users });
  } catch (err) {
    console.error('Lỗi lấy danh sách cán bộ:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi lấy danh sách cán bộ.' });
  }
}

export async function getPendingApprovals(req: AuthRequest, res: Response): Promise<void> {
  try {
    const pendingUsers = await db('users')
      .leftJoin('departments', 'users.department_id', 'departments.id')
      .where('users.status', 'PENDING_APPROVAL')
      .select(
        'users.id',
        'users.username',
        'users.fullname',
        'users.email',
        'users.phone',
        'users.role',
        'users.position',
        'users.auth_provider',
        'users.avatar_url',
        'users.requested_department',
        'users.requested_position',
        'users.created_at',
        'departments.name as department_name'
      )
      .orderBy('users.created_at', 'desc');

    res.status(200).json({ pending_users: pendingUsers, count: pendingUsers.length });
  } catch (err) {
    console.error('Lỗi lấy danh sách chờ phê duyệt:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi lấy danh sách chờ phê duyệt.' });
  }
}

export async function approveMembership(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { role, department_id, position, position_code, is_disciplined, discipline_details } = req.body;

    if (!role || (!position && !position_code)) {
      res.status(400).json({ message: 'Vui lòng chọn vai trò phân quyền và vị trí việc làm chuẩn.' });
      return;
    }

    const user = await db('users').where('id', Number(id)).first();
    if (!user) {
      res.status(404).json({ message: 'Không tìm thấy thông tin đăng ký của cán bộ.' });
      return;
    }

    let finalPosCode = position_code || null;
    let finalPosName = position ? position.trim() : '';

    if (finalPosCode) {
      const posObj = await db('job_positions').where('code', finalPosCode).first();
      if (posObj && !finalPosName) {
        finalPosName = posObj.name;
      }
    }

    await db('users')
      .where('id', Number(id))
      .update({
        role,
        department_id: department_id ? Number(department_id) : null,
        position: finalPosName,
        position_code: finalPosCode,
        is_disciplined: Boolean(is_disciplined),
        discipline_details: discipline_details ? discipline_details.trim() : null,
        status: 'ACTIVE',
        rejection_reason: null,
        updated_at: new Date(),
      });

    const clientIp = req.ip || req.socket.remoteAddress;
    await logAudit(
      req.user?.id || null,
      'APPROVE_MEMBER',
      `Phê duyệt tài khoản: ${user.fullname} (${user.email || user.username}) - Vị trí: [${finalPosCode || 'N/A'}] ${finalPosName}, Vai trò: ${role}`,
      clientIp
    );

    const updatedUser = await db('users')
      .leftJoin('departments', 'users.department_id', 'departments.id')
      .leftJoin('job_positions', 'users.position_code', 'job_positions.code')
      .where('users.id', Number(id))
      .select('users.*', 'departments.name as department_name', 'job_positions.name as official_position_name')
      .first();

    res.status(200).json({
      message: `Đã phê duyệt và kích hoạt tài khoản cho đồng chí ${user.fullname} thành công!`,
      user: updatedUser,
    });
  } catch (err) {
    console.error('Lỗi phê duyệt thành viên:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi phê duyệt thành viên.' });
  }
}

export async function rejectMembership(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { rejection_reason } = req.body;

    const user = await db('users').where('id', Number(id)).first();
    if (!user) {
      res.status(404).json({ message: 'Không tìm thấy thông tin đăng ký của cán bộ.' });
      return;
    }

    await db('users')
      .where('id', Number(id))
      .update({
        status: 'REJECTED',
        rejection_reason: rejection_reason || 'Không đủ điều kiện tiếp nhận hồ sơ cán bộ.',
        updated_at: new Date(),
      });

    const clientIp = req.ip || req.socket.remoteAddress;
    await logAudit(
      req.user?.id || null,
      'REJECT_MEMBER',
      `Từ chối tài khoản đăng ký: ${user.fullname} (${user.email || user.username}) - Lý do: ${rejection_reason || 'N/A'}`,
      clientIp
    );

    res.status(200).json({
      message: `Đã từ chối yêu cầu đăng ký của ${user.fullname}.`,
    });
  } catch (err) {
    console.error('Lỗi từ chối thành viên:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi từ chối thành viên.' });
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
    console.error('Lỗi lấy chi tiết cán bộ:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi lấy chi tiết cán bộ.' });
  }
}

export async function createUser(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { username, password, fullname, email, phone, role, position, department_id } = req.body;

    if (!username || !password || !fullname || !role || !position) {
      res.status(400).json({
        message: 'Vui lòng điền đầy đủ các trường bắt buộc: Tên đăng nhập, Mật khẩu, Họ và tên, Vai trò, Chức vụ.',
      });
      return;
    }

    const existingUser = await db('users').where('username', username.trim()).first();
    if (existingUser) {
      res.status(400).json({ message: 'Tên đăng nhập này đã tồn tại trong hệ thống.' });
      return;
    }

    if (email) {
      const existingEmail = await db('users').where('email', email.trim()).first();
      if (existingEmail) {
        res.status(400).json({ message: 'Địa chỉ Email này đã được sử dụng.' });
        return;
      }
    }

    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    const [newUserId] = await db('users').insert({
      username: username.trim(),
      password_hash,
      fullname: fullname.trim(),
      email: email ? email.trim() : null,
      phone: phone ? phone.trim() : null,
      role,
      position: position.trim(),
      department_id: department_id ? Number(department_id) : null,
      status: 'ACTIVE',
      created_at: new Date(),
      updated_at: new Date(),
    });

    const clientIp = req.ip || req.socket.remoteAddress;
    await logAudit(
      req.user?.id || null,
      'CREATE_USER',
      `Tạo mới cán bộ: ${fullname} (${username}) - Vai trò: ${role}`,
      clientIp
    );

    const createdUser = await db('users')
      .leftJoin('departments', 'users.department_id', 'departments.id')
      .where('users.id', newUserId)
      .select('users.*', 'departments.name as department_name')
      .first();

    res.status(201).json({ message: 'Tạo tài khoản cán bộ thành công!', user: createdUser });
  } catch (err) {
    console.error('Lỗi tạo cán bộ:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi tạo mới cán bộ.' });
  }
}

// Bulk Import Users from Excel parsed data
export async function importUsersExcel(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { users } = req.body;

    if (!Array.isArray(users) || users.length === 0) {
      res.status(400).json({ message: 'Dữ liệu danh sách cán bộ không hợp lệ hoặc rỗng.' });
      return;
    }

    let createdCount = 0;
    let updatedCount = 0;
    const defaultPassword = 'password123';
    const defaultHash = await bcrypt.hash(defaultPassword, 10);

    // Cache existing departments
    const allDepts = await db('departments').select('id', 'name');
    const deptMap = new Map<string, number>();
    allDepts.forEach((d) => deptMap.set(d.name.toLowerCase().trim(), d.id));

    for (const row of users) {
      if (!row.fullname || !row.fullname.trim()) continue;

      const fullname = row.fullname.trim();
      const email = row.email ? String(row.email).trim().toLowerCase() : null;
      const phone = row.phone ? String(row.phone).trim() : null;
      const position = row.position ? String(row.position).trim() : 'Công chức chuyên môn';
      const deptName = row.department_name ? String(row.department_name).trim() : null;

      // Auto-detect or create department
      let department_id: number | null = null;
      if (deptName) {
        const lowerDept = deptName.toLowerCase();
        if (deptMap.has(lowerDept)) {
          department_id = deptMap.get(lowerDept)!;
        } else {
          const [newDeptId] = await db('departments').insert({
            name: deptName,
            created_at: new Date(),
          });
          deptMap.set(lowerDept, newDeptId);
          department_id = newDeptId;
        }
      }

      // Auto-detect role
      let role = row.role || 'EMPLOYEE';
      if (!row.role) {
        const lowerPos = position.toLowerCase();
        if (lowerPos.includes('chủ tịch') || lowerPos.includes('hđnd') || lowerPos.includes('lãnh đạo')) {
          role = 'LEADERSHIP';
        } else if (
          lowerPos.includes('trưởng') ||
          lowerPos.includes('giám đốc') ||
          lowerPos.includes('phó phòng') ||
          lowerPos.includes('chỉ huy')
        ) {
          role = 'DEPARTMENT_HEAD';
        } else {
          role = 'EMPLOYEE';
        }
      }

      // Check if user exists by email or phone or username
      let existing = null;
      if (email) {
        existing = await db('users').where('email', email).first();
      }
      if (!existing && row.username) {
        existing = await db('users').where('username', row.username.trim()).first();
      }

      if (existing) {
        // Update existing user
        await db('users')
          .where('id', existing.id)
          .update({
            fullname,
            position,
            department_id: department_id || existing.department_id,
            role,
            phone: phone || existing.phone,
            status: 'ACTIVE',
            updated_at: new Date(),
          });
        updatedCount++;
      } else {
        // Generate clean unique username
        let baseUsername = email
          ? email.split('@')[0].replace(/[^a-z0-9]/g, '')
          : fullname
              .toLowerCase()
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .replace(/[^a-z0-9]/g, '');
        if (!baseUsername) baseUsername = 'canbo';

        let username = baseUsername;
        let count = 1;
        while (await db('users').where('username', username).first()) {
          username = `${baseUsername}${count}`;
          count++;
        }

        await db('users').insert({
          username,
          password_hash: defaultHash,
          fullname,
          email,
          phone,
          role,
          position,
          department_id,
          status: 'ACTIVE',
          auth_provider: 'LOCAL',
          created_at: new Date(),
          updated_at: new Date(),
        });
        createdCount++;
      }
    }

    const clientIp = req.ip || req.socket.remoteAddress;
    await logAudit(
      req.user?.id || null,
      'IMPORT_USERS_EXCEL',
      `Nhập danh sách cán bộ từ Excel: Thêm mới ${createdCount}, Cập nhật ${updatedCount}`,
      clientIp
    );

    res.status(200).json({
      message: `Nhập danh sách cán bộ thành công! Đã thêm mới ${createdCount} và cập nhật ${updatedCount} hồ sơ cán bộ.`,
      created_count: createdCount,
      updated_count: updatedCount,
    });
  } catch (err) {
    console.error('Lỗi nhập cán bộ từ Excel:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi nhập danh sách cán bộ từ Excel.' });
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

    if (email && email.trim() !== user.email) {
      const existingEmail = await db('users')
        .where('email', email.trim())
        .whereNot('id', Number(id))
        .first();
      if (existingEmail) {
        res.status(400).json({ message: 'Địa chỉ Email này đã được sử dụng bởi người khác.' });
        return;
      }
    }

    await db('users')
      .where('id', Number(id))
      .update({
        fullname: fullname ? fullname.trim() : user.fullname,
        email: email !== undefined ? (email ? email.trim() : null) : user.email,
        phone: phone !== undefined ? (phone ? phone.trim() : null) : user.phone,
        role: role || user.role,
        position: position ? position.trim() : user.position,
        department_id: department_id !== undefined ? (department_id ? Number(department_id) : null) : user.department_id,
        status: status || user.status,
        updated_at: new Date(),
      });

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
      .select('users.*', 'departments.name as department_name')
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
      updated_at: new Date(),
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

    await db('users').where('id', Number(id)).update({
      status: 'INACTIVE',
      updated_at: new Date(),
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
