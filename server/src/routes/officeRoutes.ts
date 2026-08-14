import { Router } from 'express';
import {
  getRequests,
  createRequest,
  updateRequestStatus,
  deleteRequest,
  exportOfficeExcel
} from '../controllers/officeController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getRequests);
router.get('/export', authenticate, exportOfficeExcel);
router.post('/', authenticate, createRequest);
router.put('/:id', authenticate, updateRequestStatus);
router.delete('/:id', authenticate, deleteRequest);

export default router;
