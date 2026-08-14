import { Router } from 'express';
import {
  getCases,
  createCase,
  updateCase,
  deleteCase,
  getKH965Progress,
  updateKH965Progress,
  exportLandExcel
} from '../controllers/landCertificateController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/cases', authenticate, getCases);
router.post('/cases', authenticate, createCase);
router.put('/cases/:id', authenticate, updateCase);
router.delete('/cases/:id', authenticate, deleteCase);

router.get('/kh965', authenticate, getKH965Progress);
router.post('/kh965', authenticate, updateKH965Progress);

router.get('/export', authenticate, exportLandExcel);

export default router;
