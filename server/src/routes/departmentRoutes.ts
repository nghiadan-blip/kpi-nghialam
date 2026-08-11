import { Router } from 'express';
import { getDepartments, createDepartment, updateDepartment, deleteDepartment } from '../controllers/departmentController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// Everyone authenticated can view departments list
router.get('/', authenticate, getDepartments);

// Admin-only management endpoints
router.post('/', authenticate, requireRole(['ADMIN']), createDepartment);
router.put('/:id', authenticate, requireRole(['ADMIN']), updateDepartment);
router.delete('/:id', authenticate, requireRole(['ADMIN']), deleteDepartment);

export default router;
