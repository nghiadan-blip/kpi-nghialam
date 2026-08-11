import { Router } from 'express';
import {
  getCatalog,
  getCatalogById,
  createCatalogItem,
  updateCatalogItem,
  deleteCatalogItem
} from '../controllers/catalogController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// Everyone authenticated can view catalog
router.get('/', authenticate, getCatalog);
router.get('/:id', authenticate, getCatalogById);

// Admin-only management
router.post('/', authenticate, requireRole(['ADMIN']), createCatalogItem);
router.put('/:id', authenticate, requireRole(['ADMIN']), updateCatalogItem);
router.delete('/:id', authenticate, requireRole(['ADMIN']), deleteCatalogItem);

export default router;
