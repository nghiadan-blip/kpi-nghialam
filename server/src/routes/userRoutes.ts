import { Router } from 'express';
import { getUsers, getUserById, createUser, updateUser, resetPassword, deleteUser } from '../controllers/userController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// Everyone authenticated can view user list (e.g. for task assignments, mentions, department views)
router.get('/', authenticate, getUsers);
router.get('/:id', authenticate, getUserById);

// Admin-only management endpoints
router.post('/', authenticate, requireRole(['ADMIN']), createUser);
router.put('/:id', authenticate, requireRole(['ADMIN']), updateUser);
router.post('/:id/reset-password', authenticate, requireRole(['ADMIN']), resetPassword);
router.delete('/:id', authenticate, requireRole(['ADMIN']), deleteUser);

export default router;
