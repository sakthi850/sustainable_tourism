import { Router } from 'express';
import { listFavorites, addFavorite, removeFavorite } from '../controllers/favoritesController';
import { requireAuth } from '../middleware/auth';

const router = Router();
router.get('/', requireAuth, listFavorites);
router.post('/:placeId', requireAuth, addFavorite);
router.delete('/:placeId', requireAuth, removeFavorite);
export default router;
