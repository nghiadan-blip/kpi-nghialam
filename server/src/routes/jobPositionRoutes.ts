import { Router } from 'express';
import { getJobPositions, getJobPositionByCode } from '../controllers/jobPositionController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getJobPositions);
router.get('/:code', authenticate, getJobPositionByCode);

export default router;
