import { Router } from 'express';
import {
  getBudgets,
  createRevenue,
  updateRevenue,
  deleteRevenue,
  createExpenditure,
  updateExpenditure,
  deleteExpenditure,
  exportBudgetExcel
} from '../controllers/budgetController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getBudgets);
router.get('/export', authenticate, exportBudgetExcel);

router.post('/revenue', authenticate, createRevenue);
router.post('/revenues', authenticate, createRevenue);
router.put('/revenue/:id', authenticate, updateRevenue);
router.put('/revenues/:id', authenticate, updateRevenue);
router.delete('/revenue/:id', authenticate, deleteRevenue);
router.delete('/revenues/:id', authenticate, deleteRevenue);

router.post('/expenditure', authenticate, createExpenditure);
router.post('/expenditures', authenticate, createExpenditure);
router.put('/expenditure/:id', authenticate, updateExpenditure);
router.put('/expenditures/:id', authenticate, updateExpenditure);
router.delete('/expenditure/:id', authenticate, deleteExpenditure);
router.delete('/expenditures/:id', authenticate, deleteExpenditure);

export default router;
