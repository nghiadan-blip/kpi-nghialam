import { Response } from 'express';
import db from '../config/db';
import { AuthRequest, logAudit } from '../middleware/auth';

export async function getTasks(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: 'Chưa xác thực danh tính.' });
      return;
    }

    const { status, assigned_to, assigned_by, department_id, search, overdue_only } = req.query;

    let query = db('tasks as t')
      .leftJoin('users as u_assignee', 't.assigned_to', 'u_assignee.id')
      .leftJoin('departments as d', 'u_assignee.department_id', 'd.id')
      .leftJoin('users as u_creator', 't.assigned_by', 'u_creator.id')
      .leftJoin('product_catalog as pc', 't.product_catalog_id', 'pc.id')
      .select(
        't.id',
        't.title',
        't.description',
        't.assigned_to',
        't.assigned_by',
        't.product_catalog_id',
        't.deadline',
        't.weight',
        't.status',
        't.evidence',
        't.created_at',
        't.updated_at',
        'u_assignee.fullname as assignee_name',
        'u_assignee.position as assignee_position',
        'u_assignee.department_id as assignee_department_id',
        'd.name as assignee_department_name',
        'u_creator.fullname as creator_name',
        'u_creator.position as creator_position',
        'pc.name as catalog_name',
        'pc.code as catalog_code',
        'pc.coefficient as catalog_coefficient'
      );

    // Role-based scoping
    if (user.role === 'EMPLOYEE') {
      query = query.where((builder) => {
        builder.where('t.assigned_to', user.id).orWhere('t.assigned_by', user.id);
      });
    } else if (user.role === 'DEPARTMENT_HEAD') {
      if (user.department_id) {
        query = query.where((builder) => {
          builder
            .where('u_assignee.department_id', user.department_id)
            .orWhere('t.assigned_by', user.id)
            .orWhere('t.assigned_to', user.id);
        });
      } else {
        query = query.where((builder) => {
          builder.where('t.assigned_to', user.id).orWhere('t.assigned_by', user.id);
        });
      }
    }
    // LEADERSHIP and ADMIN can see all tasks

    // Optional query filters
    if (assigned_to) {
      query = query.where('t.assigned_to', Number(assigned_to));
    }
    if (assigned_by) {
      query = query.where('t.assigned_by', Number(assigned_by));
    }
    if (department_id) {
      query = query.where('u_assignee.department_id', Number(department_id));
    }
    if (status) {
      query = query.where('t.status', String(status));
    }
    if (search) {
      const s = `%${String(search).trim()}%`;
      query = query.where((builder) => {
        builder
          .where('t.title', 'like', s)
          .orWhere('t.description', 'like', s)
          .orWhere('u_assignee.fullname', 'like', s);
      });
    }

    const tasks = await query.orderBy('t.deadline', 'asc');

    // Post-process overdue calculation
    const now = new Date();
    const processedTasks = tasks.map((task) => {
      const isOverdue = task.status !== 'COMPLETED' && new Date(task.deadline) < now;
      return {
        ...task,
        is_overdue: isOverdue,
        computed_status: isOverdue ? 'OVERDUE' : task.status,
      };
    });

    if (overdue_only === 'true') {
      res.status(200).json({ tasks: processedTasks.filter((t) => t.is_overdue) });
      return;
    }

    res.status(200).json({ tasks: processedTasks });
  } catch (err) {
    console.error('Lỗi lấy danh sách nhiệm vụ:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi lấy danh sách nhiệm vụ.' });
  }
}

export async function getTaskStats(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: 'Chưa xác thực danh tính.' });
      return;
    }

    let query = db('tasks as t')
      .leftJoin('users as u_assignee', 't.assigned_to', 'u_assignee.id')
      .select('t.id', 't.status', 't.deadline');

    if (user.role === 'EMPLOYEE') {
      query = query.where((builder) => {
        builder.where('t.assigned_to', user.id).orWhere('t.assigned_by', user.id);
      });
    } else if (user.role === 'DEPARTMENT_HEAD' && user.department_id) {
      query = query.where((builder) => {
        builder
          .where('u_assignee.department_id', user.department_id)
          .orWhere('t.assigned_by', user.id)
          .orWhere('t.assigned_to', user.id);
      });
    }

    const tasks = await query;
    const now = new Date();

    let total = 0;
    let pending = 0;
    let in_progress = 0;
    let completed = 0;
    let overdue = 0;
    let cancelled = 0;
    let unknown = 0;

    for (const t of tasks) {
      const statusUpper = (t.status || '').toUpperCase();
      if (statusUpper === 'CANCELLED') {
        cancelled++;
      } else {
        total++;
        const isOverdue = new Date(t.deadline) < now;
        if (statusUpper === 'COMPLETED') {
          completed++;
        } else if (isOverdue) {
          overdue++;
        } else if (statusUpper === 'IN_PROGRESS') {
          in_progress++;
        } else if (statusUpper === 'PENDING') {
          pending++;
        } else {
          unknown++;
        }
      }
    }

    res.status(200).json({
      stats: {
        total,
        pending,
        in_progress,
        completed,
        overdue,
        cancelled,
        unknown,
      },
    });
  } catch (err) {
    console.error('Lỗi tính thống kê nhiệm vụ:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi tính thống kê nhiệm vụ.' });
  }
}

export async function getTaskById(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const task = await db('tasks as t')
      .leftJoin('users as u_assignee', 't.assigned_to', 'u_assignee.id')
      .leftJoin('departments as d', 'u_assignee.department_id', 'd.id')
      .leftJoin('users as u_creator', 't.assigned_by', 'u_creator.id')
      .leftJoin('product_catalog as pc', 't.product_catalog_id', 'pc.id')
      .where('t.id', Number(id))
      .select(
        't.id',
        't.title',
        't.description',
        't.assigned_to',
        't.assigned_by',
        't.product_catalog_id',
        't.deadline',
        't.weight',
        't.status',
        't.evidence',
        't.created_at',
        't.updated_at',
        'u_assignee.fullname as assignee_name',
        'u_assignee.position as assignee_position',
        'u_assignee.department_id as assignee_department_id',
        'd.name as assignee_department_name',
        'u_creator.fullname as creator_name',
        'u_creator.position as creator_position',
        'pc.name as catalog_name',
        'pc.code as catalog_code',
        'pc.coefficient as catalog_coefficient'
      )
      .first();

    if (!task) {
      res.status(404).json({ message: 'Không tìm thấy nhiệm vụ này.' });
      return;
    }

    const isOverdue = task.status !== 'COMPLETED' && new Date(task.deadline) < new Date();
    res.status(200).json({
      task: {
        ...task,
        is_overdue: isOverdue,
        computed_status: isOverdue ? 'OVERDUE' : task.status,
      },
    });
  } catch (err) {
    console.error('Lỗi lấy chi tiết nhiệm vụ:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi lấy chi tiết nhiệm vụ.' });
  }
}

export async function createTask(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: 'Chưa xác thực danh tính.' });
      return;
    }

    const {
      title,
      description,
      assigned_to,
      product_catalog_id,
      deadline,
      weight,
      status,
      assigned_quantity = 1.0,
      related_land_case_id,
      related_project_id,
      related_revenue_id,
      related_expenditure_id,
      related_office_request_id,
    } = req.body;

    if (!title || !title.trim() || !assigned_to || !deadline) {
      res.status(400).json({ message: 'Vui lòng điền đầy đủ: Tiêu đề nhiệm vụ, Người tiếp nhận và Hạn hoàn thành.' });
      return;
    }

    if (!product_catalog_id) {
      res.status(400).json({
        message: 'Bắt buộc phải gắn Mã sản phẩm theo Nghị định 335 để xác định hệ số quy đổi K khi giao nhiệm vụ.',
      });
      return;
    }

    const qty = Number(assigned_quantity);
    if (isNaN(qty) || qty <= 0) {
      res.status(400).json({ message: 'Số lượng giao việc phải là số dương lớn hơn 0.' });
      return;
    }

    // Verify assignee exists
    const assignee = await db('users').where('id', Number(assigned_to)).first();
    if (!assignee) {
      res.status(400).json({ message: 'Người tiếp nhận nhiệm vụ không tồn tại.' });
      return;
    }

    const cat = await db('product_catalog').where('id', Number(product_catalog_id)).first();
    const coeff = cat?.coefficient || (weight !== undefined ? Number(weight) : 1.0);
    const convertedQty = Number((qty * coeff).toFixed(2));

    const [id] = await db('tasks').insert({
      title: title.trim(),
      description: description ? description.trim() : null,
      assigned_to: Number(assigned_to),
      assigned_by: user.id,
      product_catalog_id: Number(product_catalog_id),
      assigned_quantity: qty,
      converted_assigned_quantity: convertedQty,
      deadline: new Date(deadline).toISOString(),
      weight: coeff,
      status: status || 'PENDING',
      related_land_case_id: related_land_case_id ? Number(related_land_case_id) : null,
      related_project_id: related_project_id ? Number(related_project_id) : null,
      related_revenue_id: related_revenue_id ? Number(related_revenue_id) : null,
      related_expenditure_id: related_expenditure_id ? Number(related_expenditure_id) : null,
      related_office_request_id: related_office_request_id ? Number(related_office_request_id) : null,
    });

    const relationsLog: string[] = [];
    if (related_land_case_id) relationsLog.push(`Đất đai ID ${related_land_case_id}`);
    if (related_project_id) relationsLog.push(`Đầu tư công ID ${related_project_id}`);
    if (related_revenue_id) relationsLog.push(`Nguồn thu ID ${related_revenue_id}`);
    if (related_expenditure_id) relationsLog.push(`Khoản chi ID ${related_expenditure_id}`);
    if (related_office_request_id) relationsLog.push(`Văn phòng ID ${related_office_request_id}`);
    const relationStr = relationsLog.length > 0 ? ` (Liên kết: ${relationsLog.join(', ')})` : '';

    const clientIp = req.ip || req.socket.remoteAddress;
    await logAudit(
      user.id,
      'CREATE_TASK',
      `Giao nhiệm vụ mới ID ${id}: "${title.trim()}" cho cán bộ ${assignee.fullname}${relationStr}`,
      clientIp
    );

    const created = await db('tasks as t')
      .leftJoin('users as u_assignee', 't.assigned_to', 'u_assignee.id')
      .leftJoin('departments as d', 'u_assignee.department_id', 'd.id')
      .leftJoin('users as u_creator', 't.assigned_by', 'u_creator.id')
      .leftJoin('product_catalog as pc', 't.product_catalog_id', 'pc.id')
      .where('t.id', id)
      .select(
        't.id',
        't.title',
        't.description',
        't.assigned_to',
        't.assigned_by',
        't.product_catalog_id',
        't.deadline',
        't.weight',
        't.status',
        't.evidence',
        't.created_at',
        'u_assignee.fullname as assignee_name',
        'u_creator.fullname as creator_name',
        'pc.name as catalog_name'
      )
      .first();

    res.status(201).json({ message: 'Giao nhiệm vụ thành công!', task: created });
  } catch (err) {
    console.error('Lỗi tạo nhiệm vụ:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi tạo nhiệm vụ.' });
  }
}

export async function updateTask(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    const { id } = req.params;
    const {
      title,
      description,
      assigned_to,
      product_catalog_id,
      deadline,
      weight,
      status,
      evidence,
      assigned_quantity,
      related_land_case_id,
      related_project_id,
      related_revenue_id,
      related_expenditure_id,
      related_office_request_id,
    } = req.body;

    if (!user) {
      res.status(401).json({ message: 'Chưa xác thực danh tính.' });
      return;
    }

    const task = await db('tasks').where('id', Number(id)).first();
    if (!task) {
      res.status(404).json({ message: 'Không tìm thấy nhiệm vụ cần sửa.' });
      return;
    }

    // Permission check: creator, admin, or leadership can update task metadata
    const canEdit =
      user.role === 'ADMIN' ||
      user.role === 'LEADERSHIP' ||
      task.assigned_by === user.id ||
      (user.role === 'DEPARTMENT_HEAD' && user.id === task.assigned_to);

    if (!canEdit) {
      res.status(403).json({ message: 'Bạn không có quyền chỉnh sửa nhiệm vụ này.' });
      return;
    }

    const updates: any = {
      updated_at: new Date(),
    };

    if (title !== undefined) updates.title = title.trim();
    if (description !== undefined) updates.description = description ? description.trim() : null;
    if (assigned_to !== undefined) updates.assigned_to = Number(assigned_to);
    if (product_catalog_id !== undefined) updates.product_catalog_id = product_catalog_id ? Number(product_catalog_id) : null;
    if (deadline !== undefined) updates.deadline = new Date(deadline).toISOString();
    if (weight !== undefined) updates.weight = Number(weight);
    if (status !== undefined) {
      if (status === 'COMPLETED' && task.status === 'PENDING') {
        res.status(400).json({
          message: 'Không thể nhảy cóc trạng thái! Nhiệm vụ đang ở trạng thái "Chờ tiếp nhận" (PENDING). Vui lòng chuyển sang "Đang thực hiện" (IN_PROGRESS) trước khi hoàn thành.',
        });
        return;
      }
      updates.status = status;
    }
    if (evidence !== undefined) updates.evidence = evidence ? evidence.trim() : null;

    if (assigned_quantity !== undefined) {
      const qty = Number(assigned_quantity);
      if (isNaN(qty) || qty <= 0) {
        res.status(400).json({ message: 'Số lượng giao việc phải là số dương lớn hơn 0.' });
        return;
      }
      updates.assigned_quantity = qty;
      const currentCatalogId = product_catalog_id !== undefined ? product_catalog_id : task.product_catalog_id;
      if (currentCatalogId) {
        const cat = await db('product_catalog').where('id', Number(currentCatalogId)).first();
        const coeff = cat?.coefficient || 1.0;
        updates.converted_assigned_quantity = Number((qty * coeff).toFixed(2));
      }
    }

    if (related_land_case_id !== undefined) updates.related_land_case_id = related_land_case_id ? Number(related_land_case_id) : null;
    if (related_project_id !== undefined) updates.related_project_id = related_project_id ? Number(related_project_id) : null;
    if (related_revenue_id !== undefined) updates.related_revenue_id = related_revenue_id ? Number(related_revenue_id) : null;
    if (related_expenditure_id !== undefined) updates.related_expenditure_id = related_expenditure_id ? Number(related_expenditure_id) : null;
    if (related_office_request_id !== undefined) updates.related_office_request_id = related_office_request_id ? Number(related_office_request_id) : null;

    await db('tasks').where('id', Number(id)).update(updates);

    const clientIp = req.ip || req.socket.remoteAddress;
    
    // Log audit trail including old/new values
    await logAudit(
      user.id,
      'UPDATE_TASK',
      `Cập nhật nhiệm vụ ID ${id}: ${task.title}`,
      clientIp,
      JSON.stringify(task),
      JSON.stringify({ ...task, ...updates })
    );

    const updated = await db('tasks as t')
      .leftJoin('users as u_assignee', 't.assigned_to', 'u_assignee.id')
      .where('t.id', Number(id))
      .select('t.*', 'u_assignee.fullname as assignee_name')
      .first();

    res.status(200).json({ message: 'Cập nhật nhiệm vụ thành công!', task: updated });
  } catch (err) {
    console.error('Lỗi cập nhật nhiệm vụ:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi cập nhật nhiệm vụ.' });
  }
}

export async function updateTaskStatus(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    const { id } = req.params;
    const {
      status,
      evidence,
      actual_completed_quantity,
      actual_completed_date,
      delay_count,
      rework_count,
    } = req.body;

    if (!user) {
      res.status(401).json({ message: 'Chưa xác thực danh tính.' });
      return;
    }

    const task = await db('tasks').where('id', Number(id)).first();
    if (!task) {
      res.status(404).json({ message: 'Không tìm thấy nhiệm vụ.' });
      return;
    }

    // Assignee, creator, or managers can update status
    const canUpdateStatus =
      task.assigned_to === user.id ||
      task.assigned_by === user.id ||
      user.role === 'ADMIN' ||
      user.role === 'LEADERSHIP' ||
      user.role === 'DEPARTMENT_HEAD';

    if (!canUpdateStatus) {
      res.status(403).json({ message: 'Bạn không được phân công nhiệm vụ này để cập nhật tiến độ.' });
      return;
    }

    const updates: any = {
      updated_at: new Date(),
    };

    if (status) {
      if (status === 'COMPLETED' && task.status === 'PENDING') {
        res.status(400).json({
          message: 'Không thể nhảy cóc trạng thái! Nhiệm vụ đang ở trạng thái "Chờ tiếp nhận" (PENDING). Vui lòng chuyển sang "Đang thực hiện" (IN_PROGRESS) trước khi hoàn thành.',
        });
        return;
      }
      if (status === 'COMPLETED' && !evidence && !task.evidence) {
        res.status(400).json({
          message: 'Khi chuyển sang Đã hoàn thành (COMPLETED), bắt buộc phải cung cấp minh chứng hoặc tóm tắt kết quả thực hiện.',
        });
        return;
      }
      updates.status = status;

      if (status === 'COMPLETED') {
        updates.actual_completed_quantity =
          actual_completed_quantity !== undefined
            ? Number(actual_completed_quantity)
            : task.assigned_quantity || 1.0;
        updates.actual_completed_date = actual_completed_date || new Date().toISOString();
      }
    }

    if (evidence !== undefined) updates.evidence = evidence ? evidence.trim() : null;
    if (delay_count !== undefined) updates.delay_count = Number(delay_count);
    if (rework_count !== undefined) updates.rework_count = Number(rework_count);

    await db('tasks').where('id', Number(id)).update(updates);

    const clientIp = req.ip || req.socket.remoteAddress;
    await logAudit(
      user.id,
      'UPDATE_TASK_STATUS',
      `Cập nhật tiến độ nhiệm vụ ID ${id} (${task.status} -> ${status || task.status})`,
      clientIp
    );

    res.status(200).json({ message: 'Cập nhật tiến độ nhiệm vụ thành công!' });
  } catch (err) {
    console.error('Lỗi cập nhật trạng thái nhiệm vụ:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi cập nhật trạng thái nhiệm vụ.' });
  }
}

export async function deleteTask(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    const { id } = req.params;

    if (!user) {
      res.status(401).json({ message: 'Chưa xác thực danh tính.' });
      return;
    }

    const task = await db('tasks').where('id', Number(id)).first();
    if (!task) {
      res.status(404).json({ message: 'Không tìm thấy nhiệm vụ cần xóa.' });
      return;
    }

    const canDelete =
      user.role === 'ADMIN' ||
      user.role === 'LEADERSHIP' ||
      task.assigned_by === user.id;

    if (!canDelete) {
      res.status(403).json({ message: 'Bạn không có quyền xóa nhiệm vụ này.' });
      return;
    }

    await db('tasks').where('id', Number(id)).del();

    const clientIp = req.ip || req.socket.remoteAddress;
    await logAudit(user.id, 'DELETE_TASK', `Xóa nhiệm vụ ID ${id}: ${task.title}`, clientIp);

    res.status(200).json({ message: `Đã xóa nhiệm vụ "${task.title}" thành công.` });
  } catch (err) {
    console.error('Lỗi xóa nhiệm vụ:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi xóa nhiệm vụ.' });
  }
}
