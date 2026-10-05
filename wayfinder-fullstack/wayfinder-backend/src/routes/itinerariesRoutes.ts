import { Router } from 'express';
import { generateItinerary, listItineraries, getItinerary, deleteItinerary } from '../controllers/itinerariesController';
import { requireAuth } from '../middleware/auth';

const router = Router();
router.post('/', requireAuth, generateItinerary);
router.get('/', requireAuth, listItineraries);
router.get('/:id', requireAuth, getItinerary);
router.delete('/:id', requireAuth, deleteItinerary);
export default router;
