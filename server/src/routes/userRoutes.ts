import { Router } from 'express';
import {
  getUsers,
  getPendingApprovals,
  approveMembership,
  rejectMembership,
  importUsersExcel,
  getUserById,
  createUser,
  updateUser,
  resetPassword,
  deleteUser,
} from '../controllers/userController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// Everyone authenticated can view user list (e.g. for task assignments, mentions, department views)
router.get('/', authenticate, getUsers);

// Pending membership approvals (Admin and Leadership)
router.get('/pending/list', authenticate, requireRole(['ADMIN', 'LEADERSHIP']), getPendingApprovals);
router.post('/:id/approve', authenticate, requireRole(['ADMIN', 'LEADERSHIP']), approveMembership);
router.post('/:id/reject', authenticate, requireRole(['ADMIN', 'LEADERSHIP']), rejectMembership);

// Excel Bulk Import
router.post('/import-excel', authenticate, requireRole(['ADMIN']), importUsersExcel);

router.get('/:id', authenticate, getUserById);

// Admin-only management endpoints
router.post('/', authenticate, requireRole(['ADMIN']), createUser);
router.put('/:id', authenticate, requireRole(['ADMIN']), updateUser);
router.post('/:id/reset-password', authenticate, requireRole(['ADMIN']), resetPassword);
router.delete('/:id', authenticate, requireRole(['ADMIN']), deleteUser);

export default router;
