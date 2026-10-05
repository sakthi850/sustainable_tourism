import { Router } from 'express';
import { getPreferences, updatePreferences } from '../controllers/preferencesController';
import { requireAuth } from '../middleware/auth';

const router = Router();
router.get('/', requireAuth, getPreferences);
router.put('/', requireAuth, updatePreferences);
export default router;
