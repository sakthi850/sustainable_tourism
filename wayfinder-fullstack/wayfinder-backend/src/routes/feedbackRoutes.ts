import { Router } from 'express';
import { submitFeedback, listFeedbackForAdmin } from '../controllers/feedbackController';
import { requireAuth, requireAdmin } from '../middleware/auth';

const router = Router();
router.post('/', requireAuth, submitFeedback);
router.get('/', requireAuth, requireAdmin, listFeedbackForAdmin);
export default router;
