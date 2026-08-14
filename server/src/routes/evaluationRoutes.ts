import { Router } from 'express';
import {
  getEvaluations,
  getEvaluationById,
  saveDraftEvaluation,
  submitSelfEvaluation,
  reviewByManager,
  approveByLeadership,
  getQuotaStats,
  submitAppeal,
  getAppeals,
  resolveAppeal,
  deleteEvaluation,
  sendEvaluationEmail,
  batchSendEvaluationEmails,
  getEvaluationPeriods,
  lockEvaluationPeriod,
  unlockEvaluationPeriod,
} from '../controllers/evaluationController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getEvaluations);
router.get('/periods', authenticate, getEvaluationPeriods);
router.post('/periods/lock', authenticate, lockEvaluationPeriod);
router.post('/periods/unlock', authenticate, unlockEvaluationPeriod);
router.get('/quota-stats', authenticate, getQuotaStats);
router.get('/appeals', authenticate, getAppeals);
router.get('/:id', authenticate, getEvaluationById);

// Employee evaluation routes
router.post('/draft', authenticate, saveDraftEvaluation);
router.post('/self', authenticate, saveDraftEvaluation);
router.post('/:id/submit', authenticate, submitSelfEvaluation);
router.post('/:id/appeal', authenticate, submitAppeal);

// Manager review routes
router.post('/:id/review', authenticate, reviewByManager);
router.post('/:id/manager-review', authenticate, reviewByManager);

// Leadership approval routes
router.post('/:id/approve', authenticate, approveByLeadership);
router.post('/:id/leadership-approval', authenticate, approveByLeadership);

// Email notification routes
router.post('/:id/send-email', authenticate, sendEvaluationEmail);
router.post('/batch-send-emails', authenticate, batchSendEvaluationEmails);

// Appeals resolution
router.post('/appeals/:appealId/resolve', authenticate, resolveAppeal);

router.delete('/:id', authenticate, deleteEvaluation);

export default router;
