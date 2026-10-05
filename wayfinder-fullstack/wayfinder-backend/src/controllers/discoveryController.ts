import { Response } from 'express';
import { DiscoveryCategory } from '../services/overpassService';
import { discoverLiveNearby } from '../services/liveDiscoveryService';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../middleware/errorHandler';
import { isValidCoordinate } from '../utils/haversine';

export const discover = asyncHandler(async (req, res: Response) => {
  const lat = Number(req.query.latitude);
  const lng = Number(req.query.longitude);
  const radiusMeters = req.query.radius ? Number(req.query.radius) : 4000;
  const category = typeof req.query.category === 'string' && req.query.category ? req.query.category : undefined;
  const accuracy = req.query.accuracy === undefined ? null : Number(req.query.accuracy);

  if (accuracy !== null && (!Number.isFinite(accuracy) || accuracy < 0)) throw new ApiError(400, 'accuracy must be a non-negative number of meters.');
  if (process.env.NODE_ENV !== 'production') console.log('[DISCOVERY] request received', { latitude: lat, longitude: lng, accuracy, radius: radiusMeters, category: category ?? 'All' });

  if (!isValidCoordinate(lat, lng)) {
    throw new ApiError(400, 'latitude and longitude query parameters are required and must be valid coordinates (lat -90..90, lng -180..180).');
  }
  if (!Number.isFinite(radiusMeters) || radiusMeters <= 0 || radiusMeters > 50000) {
    throw new ApiError(400, 'radius must be a positive number of meters, at most 50000.');
  }
  const allowedCategories = ['Food', 'Shopping', 'Accommodation', 'Nature', 'Culture', 'History'];
  if (category && !allowedCategories.includes(category)) throw new ApiError(400, `category must be one of: ${allowedCategories.join(', ')}.`);

  const startedAt = Date.now();
  const discovery = await discoverLiveNearby(lat, lng, radiusMeters, category as DiscoveryCategory | undefined);
  console.info('[DISCOVERY] response', { source: discovery.source, finalCount: discovery.places.length, durationMs: Date.now() - startedAt });

  res.json({
    success: true,
    state: discovery.warnings.length ? 'PARTIAL' : discovery.places.length ? 'LIVE_SUCCESS' : 'LIVE_EMPTY',
    source: discovery.source,
    live: true,
    userLocation: { latitude: lat, longitude: lng },
    radius: radiusMeters,
    category: category ?? 'All',
    endpointUsed: discovery.endpointUsed,
    rawCount: discovery.rawCount,
    afterDeduplication: discovery.places.length,
    warnings: discovery.warnings,
    providers: discovery.providers,
    count: discovery.places.length,
    ...(process.env.NODE_ENV !== 'production' ? { diagnostics: { ...discovery.diagnostics, gpsAccuracy: accuracy } } : {}),
    places: discovery.places,
  });
});
