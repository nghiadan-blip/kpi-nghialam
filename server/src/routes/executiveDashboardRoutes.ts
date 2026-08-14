import { Router } from 'express';
import { getExecutiveDashboard } from '../controllers/executiveDashboardController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getExecutiveDashboard);

export default router;
