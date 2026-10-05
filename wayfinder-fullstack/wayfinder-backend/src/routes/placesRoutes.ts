import { Router } from 'express';
import { listPlaces, getPlace, createPlace, updatePlace, deletePlace } from '../controllers/placesController';
import { requireAuth, requireAdmin } from '../middleware/auth';

const router = Router();

router.get('/', listPlaces);
router.get('/:id', getPlace);
router.post('/', requireAuth, requireAdmin, createPlace);
router.put('/:id', requireAuth, requireAdmin, updatePlace);
router.delete('/:id', requireAuth, requireAdmin, deletePlace);

export default router;
