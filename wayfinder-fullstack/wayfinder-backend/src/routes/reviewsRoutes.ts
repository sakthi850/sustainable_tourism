import { Router } from 'express';
import { createReview, listReviewsForTarget, listReviewsByTarget, listMyReviews, listAllReviews, updateReview, deleteReview, voteHelpful } from '../controllers/reviewsController';
import { requireAuth, requireAdmin } from '../middleware/auth';

const router = Router();
router.post('/', requireAuth, createReview);
router.get('/', listReviewsByTarget);
router.get('/mine', requireAuth, listMyReviews);
router.get('/admin/all', requireAuth, requireAdmin, listAllReviews);
router.get('/:placeId', listReviewsForTarget);
router.put('/:id', requireAuth, updateReview);
router.delete('/:id', requireAuth, deleteReview);
router.post('/:id/vote', requireAuth, voteHelpful);
export default router;
