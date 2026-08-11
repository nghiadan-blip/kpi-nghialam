import { Router } from 'express';
import { getDashboardStats, exportEvaluationsExcel } from '../controllers/reportController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/dashboard', authenticate, getDashboardStats);
router.get('/evaluations/export', authenticate, exportEvaluationsExcel);

export default router;
