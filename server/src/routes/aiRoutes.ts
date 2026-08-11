import { Router } from 'express';
import { generateEvaluationRemark, suggestTaskDetails, chatWithAI } from '../controllers/aiController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/evaluate-remark', authenticate, generateEvaluationRemark);
router.post('/suggest-task', authenticate, suggestTaskDetails);
router.post('/chat', authenticate, chatWithAI);

export default router;
