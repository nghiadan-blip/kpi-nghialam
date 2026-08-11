import { Router } from 'express';
import {
  getTasks,
  getTaskStats,
  getTaskById,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
} from '../controllers/taskController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getTasks);
router.get('/stats', authenticate, getTaskStats);
router.get('/:id', authenticate, getTaskById);
router.post('/', authenticate, createTask);
router.put('/:id', authenticate, updateTask);
router.patch('/:id/status', authenticate, updateTaskStatus);
router.delete('/:id', authenticate, deleteTask);

export default router;
