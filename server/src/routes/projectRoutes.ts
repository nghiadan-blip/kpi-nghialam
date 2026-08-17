import { Router } from 'express';
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  linkInvestmentProject,
  unlinkInvestmentProject,
  getProjectDashboard,
  addMilestone,
  updateMilestone,
  deleteMilestone,
  exportProjectsExcel
} from '../controllers/projectController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Dashboard & Export
router.get('/dashboard', authenticate, getProjectDashboard);
router.get('/export', authenticate, exportProjectsExcel);

// Project CRUD & Linking
router.get('/', authenticate, getProjects);
router.get('/:id', authenticate, getProjectById);
router.post('/', authenticate, createProject);
router.put('/:id', authenticate, updateProject);
router.patch('/:id', authenticate, updateProject);
router.delete('/:id', authenticate, deleteProject);
router.post('/:id/link-investment', authenticate, linkInvestmentProject);
router.post('/:id/unlink-investment', authenticate, unlinkInvestmentProject);

// Milestones
router.post('/:id/milestones', authenticate, addMilestone);
router.put('/:id/milestones/:milestoneId', authenticate, updateMilestone);
router.patch('/:id/milestones/:milestoneId', authenticate, updateMilestone);
router.delete('/:id/milestones/:milestoneId', authenticate, deleteMilestone);

export default router;
