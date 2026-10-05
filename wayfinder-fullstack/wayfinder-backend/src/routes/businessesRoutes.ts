import { Router } from 'express';
import {
  listBusinesses, getBusiness, createBusiness, updateBusiness, deleteBusiness, setVerified,
} from '../controllers/businessesController';
import { requireAuth, requireAdmin } from '../middleware/auth';

const router = Router();

router.get('/', listBusinesses);
router.get('/:id', getBusiness);
router.post('/', requireAuth, requireAdmin, createBusiness);
router.put('/:id', requireAuth, requireAdmin, updateBusiness);
router.delete('/:id', requireAuth, requireAdmin, deleteBusiness);
router.patch('/:id/verify', requireAuth, requireAdmin, setVerified);

export default router;
