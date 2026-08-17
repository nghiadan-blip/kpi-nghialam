import { Router } from 'express';
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getDashboard,
  exportExcel,
  updateWorkflowStep,
  approveWorkflowStep,
  getProjectDocuments,
  addProjectDocument,
  deleteProjectDocument,
  getProjectAuditLog,
  addMilestone,
  updateMilestone,
  deleteMilestone
} from '../controllers/projectController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Dashboard & Export
router.get('/dashboard', authenticate, getDashboard);
router.get('/export', authenticate, exportExcel);

// Project CRUD
router.get('/', authenticate, getProjects);
router.get('/:id', authenticate, getProjectById);
router.post('/', authenticate, createProject);
router.put('/:id', authenticate, updateProject);
router.patch('/:id', authenticate, updateProject);
router.delete('/:id', authenticate, deleteProject);

// 16 Workflow Steps
router.put('/:id/workflow/:stepNumber', authenticate, updateWorkflowStep);
router.post('/:id/workflow/:stepNumber/approve', authenticate, approveWorkflowStep);

// Electronic Documents
router.get('/:id/documents', authenticate, getProjectDocuments);
router.post('/:id/documents', authenticate, addProjectDocument);
router.delete('/:id/documents/:docId', authenticate, deleteProjectDocument);

// Audit Log
router.get('/:id/audit-log', authenticate, getProjectAuditLog);

// Milestones
router.post('/:id/milestones', authenticate, addMilestone);
router.put('/:id/milestones/:milestoneId', authenticate, updateMilestone);
router.patch('/:id/milestones/:milestoneId', authenticate, updateMilestone);
router.delete('/:id/milestones/:milestoneId', authenticate, deleteMilestone);

export default router;
