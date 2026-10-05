import { Router } from 'express';
import authRoutes from './authRoutes';
import placesRoutes from './placesRoutes';
import businessesRoutes from './businessesRoutes';
import discoveryRoutes from './discoveryRoutes';
import recommendationsRoutes from './recommendationsRoutes';
import preferencesRoutes from './preferencesRoutes';
import favoritesRoutes from './favoritesRoutes';
import reviewsRoutes from './reviewsRoutes';
import itinerariesRoutes from './itinerariesRoutes';
import feedbackRoutes from './feedbackRoutes';
import routingRoutes from './routingRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/places', placesRoutes);
router.use('/businesses', businessesRoutes);
router.use('/discovery', discoveryRoutes);
router.use('/recommendations', recommendationsRoutes);
router.use('/preferences', preferencesRoutes);
router.use('/favorites', favoritesRoutes);
router.use('/reviews', reviewsRoutes);
router.use('/itineraries', itinerariesRoutes);
router.use('/feedback', feedbackRoutes);
router.use('/routing', routingRoutes);

router.get('/health', (_req, res) => res.json({ success: true, message: 'Wayfinder API is up.' }));

export default router;
