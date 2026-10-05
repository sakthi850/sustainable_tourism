import { Router } from 'express';
import { getRecommendations } from '../controllers/recommendationsController';
import { optionalAuth } from '../middleware/auth';

const router = Router();
router.get('/', optionalAuth, getRecommendations);
export default router;
