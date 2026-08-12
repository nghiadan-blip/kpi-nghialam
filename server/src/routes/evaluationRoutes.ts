import { Router } from 'express';
import {
  getEvaluations,
  getEvaluationById,
  saveDraftEvaluation,
  submitSelfEvaluation,
  reviewByManager,
  approveByLeadership,
  deleteEvaluation,
} from '../controllers/evaluationController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getEvaluations);
router.get('/:id', authenticate, getEvaluationById);

// Employee evaluation routes
router.post('/draft', authenticate, saveDraftEvaluation);
router.post('/self', authenticate, saveDraftEvaluation);
router.post('/:id/submit', authenticate, submitSelfEvaluation);

// Manager review routes
router.post('/:id/review', authenticate, reviewByManager);
router.post('/:id/manager-review', authenticate, reviewByManager);

// Leadership approval routes
router.post('/:id/approve', authenticate, approveByLeadership);
router.post('/:id/leadership-approval', authenticate, approveByLeadership);

router.delete('/:id', authenticate, deleteEvaluation);

export default router;
