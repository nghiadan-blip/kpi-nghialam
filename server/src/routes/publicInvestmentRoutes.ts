import { Router } from 'express';
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  exportProjectsExcel
} from '../controllers/publicInvestmentController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getProjects);
router.get('/export', authenticate, exportProjectsExcel);
router.post('/', authenticate, createProject);
router.put('/:id', authenticate, updateProject);
router.delete('/:id', authenticate, deleteProject);

export default router;
