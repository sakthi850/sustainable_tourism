import { Response } from 'express';
import TouristPlace, { ITouristPlace } from '../models/TouristPlace';
import LocalBusiness, { ILocalBusiness } from '../models/LocalBusiness';
import UserPreference from '../models/UserPreference';
import { computeScade, ScoreableItem, ScadeParams } from '../services/scadeService';
import { DiscoveryCategory, NormalizedPlace } from '../services/overpassService';
import { discoverLiveNearby, LiveProvider, LiveSource } from '../services/liveDiscoveryService';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../middleware/errorHandler';
import { isValidCoordinate, haversineKm } from '../utils/haversine';
import { AuthedRequest } from '../middleware/auth';
import { getCurrentWeather, CurrentWeather } from '../services/weatherService';

function toScoreable(doc: ITouristPlace | ILocalBusiness, kind: 'place' | 'business'): ScoreableItem {
  return { id: doc._id.toString(), kind, name: doc.name, category: doc.category, latitude: doc.latitude, longitude: doc.longitude,
    openTime: doc.openTime, closeTime: doc.closeTime, visitDurationMin: 'visitDurationMin' in doc ? doc.visitDurationMin : 30,
    costLevel: doc.costLevel, rating: doc.rating, sustainability: doc.sustainability, outdoor: doc.category.includes('Nature') };
}

export function osmToScoreable(place: NormalizedPlace): ScoreableItem {
  return { id: `osm:${place.externalId}`, kind: place.kind, name: place.name, category: place.ourCategory,
    latitude: place.latitude, longitude: place.longitude, openTime: null, closeTime: null,
    visitDurationMin: place.ourCategory.includes('Nature') ? 60 : 30, costLevel: null, rating: place.rating ?? 3,
    sustainability: null, outdoor: place.ourCategory.includes('Nature') };
}

type NamedCoordinates = { name: string; latitude: number; longitude: number };
export function dedupeAgainstPlatform<T extends NamedCoordinates>(liveResults: T[], platformDocs: NamedCoordinates[]): T[] {
  return liveResults.filter((place) => !platformDocs.some((doc) => doc.name.trim().toLowerCase() === place.name.trim().toLowerCase()
    && haversineKm(place.latitude, place.longitude, doc.latitude, doc.longitude) < 0.15));
}

export function isWithinRecommendationRadius(userLat: number, userLng: number, itemLat: number, itemLng: number, radiusMeters: number): boolean {
  return haversineKm(userLat, userLng, itemLat, itemLng) * 1000 <= radiusMeters + 50;
}

export const getRecommendations = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const startedAt = Date.now();
  const lat = Number(req.query.latitude); const lng = Number(req.query.longitude);
  if (!isValidCoordinate(lat, lng)) throw new ApiError(400, 'Valid latitude and longitude query parameters are required.');
  const category = typeof req.query.category === 'string' && req.query.category ? req.query.category : null;
  const search = typeof req.query.search === 'string' ? req.query.search.trim().toLocaleLowerCase() : '';
  const accuracy = req.query.accuracy === undefined ? null : Number(req.query.accuracy);
  const allowedCategories = ['Food', 'Shopping', 'Accommodation', 'Nature', 'Culture', 'History'];
  if (category && !allowedCategories.includes(category)) throw new ApiError(400, `category must be one of: ${allowedCategories.join(', ')}.`);
  const ecoFriendly = req.query.ecoFriendly === 'true'; const radiusMeters = req.query.radius ? Number(req.query.radius) : 5000;
  if (accuracy !== null && (!Number.isFinite(accuracy) || accuracy < 0)) throw new ApiError(400, 'accuracy must be a non-negative number of meters.');
  if (process.env.NODE_ENV !== 'production') console.log('[RECOMMENDATIONS] request received', { latitude: lat, longitude: lng, accuracy, radius: radiusMeters, category: category ?? 'All', search });
  if (!Number.isFinite(radiusMeters) || radiusMeters <= 0 || radiusMeters > 50000) throw new ApiError(400, 'radius must be a positive number of meters, at most 50000.');

  const [places, businesses, savedPrefs] = await Promise.all([TouristPlace.find(), LocalBusiness.find(), req.user ? UserPreference.findOne({ user: req.user.userId }) : null]);
  let weather: CurrentWeather | null = null; let weatherError: string | null = null;
  try { weather = await getCurrentWeather(lat, lng); } catch (error) { weatherError = error instanceof Error ? error.message : 'Weather unavailable.'; }
  const params: ScadeParams = { userLat: lat, userLng: lng, interests: savedPrefs?.interests ?? [], budget: req.query.budget !== undefined ? Number(req.query.budget) : savedPrefs?.budget ?? 3,
    travelMode: (req.query.travelMode as ScadeParams['travelMode']) ?? savedPrefs?.travelMode ?? 'walking', availableTimeMin: req.query.availableTime !== undefined ? Number(req.query.availableTime) : savedPrefs?.availableTimeMin ?? 180,
    sustainabilityPreference: savedPrefs?.sustainabilityPreference ?? 0.5, weather: weather ? { rainy: weather.rainy } : null };

  let discoveryError: string | null = null; let warnings: string[] = []; let endpointUsed: string | null = null; let liveSource: LiveSource = 'osm';
  let providers: Record<LiveProvider, { attempted: boolean; succeeded: boolean; count: number; error: string | null }> = {
    geoapify: { attempted: false, succeeded: false, count: 0, error: null }, osm: { attempted: false, succeeded: false, count: 0, error: null },
  };
  let rawLive: NormalizedPlace[] = []; let diagnostics = { overpassStatus: null as number | null, rawElements: 0, validCoordinates: 0, namedElements: 0, normalized: 0, deduplicated: 0, unnamedRemoved: 0, outsideRadiusRemoved: 0, duplicatesRemoved: 0,
    nodeCount: 0, wayCount: 0, relationCount: 0, invalidCoordinatesRemoved: 0, categoryFilteredRemoved: 0, responseLength: 0, perCategory: {} };
  try {
    const discovery = await discoverLiveNearby(lat, lng, radiusMeters, category as DiscoveryCategory | undefined);
    rawLive = discovery.places; warnings = discovery.warnings; endpointUsed = discovery.endpointUsed; diagnostics = discovery.diagnostics; liveSource = discovery.source; providers = discovery.providers;
  } catch (error) { discoveryError = error instanceof Error ? error.message : 'Live discovery failed.'; }

  const platformDocs = [...places, ...businesses];
  const searchedLive = search ? rawLive.filter((place) => place.name.toLocaleLowerCase().includes(search)) : rawLive;
  const afterPlatformDedup = dedupeAgainstPlatform(searchedLive, platformDocs);
  type Candidate = { item: ScoreableItem; source: 'platform' | LiveProvider; verified?: boolean; hasRating: boolean; popularity?: number; localRelevance?: number; sustainabilityEvidence?: string[] | null; live?: NormalizedPlace };
  const beforeCategory: Candidate[] = [
    ...places.map((doc) => ({ item: toScoreable(doc, 'place' as const), source: 'platform' as const, verified: doc.verified, hasRating: doc.ratingCount > 0, popularity: doc.popularity, localRelevance: doc.localRelevance })),
    ...businesses.map((doc) => ({ item: toScoreable(doc, 'business' as const), source: 'platform' as const, verified: doc.verified, hasRating: doc.ratingCount > 0, popularity: doc.popularity, localRelevance: doc.localRelevance })),
    ...afterPlatformDedup.map((place) => ({ item: osmToScoreable(place), source: place.source, verified: false, hasRating: false, sustainabilityEvidence: place.sustainabilityEvidence, live: place })),
  ].filter((candidate) => isWithinRecommendationRadius(lat, lng, candidate.item.latitude, candidate.item.longitude, radiusMeters));
  const afterSearch = search ? beforeCategory.filter((candidate) => candidate.item.name.toLocaleLowerCase().includes(search)) : beforeCategory;
  const afterCategory = category ? afterSearch.filter((candidate) => candidate.item.category.includes(category)) : afterSearch;
  const afterRating = afterCategory; // Minimum-rating filtering is client-side; "Any" preserves unrated OSM records.
  const afterBudget = afterRating; // Budget affects ranking only; unknown OSM cost receives a neutral score.
  const candidates = ecoFriendly ? afterBudget.filter((candidate) => (candidate.item.sustainability !== null && candidate.item.sustainability >= 0.65) || Boolean(candidate.sustainabilityEvidence?.length)) : afterBudget;

  const scored = candidates.map(({ item, source, verified, hasRating, popularity, localRelevance, sustainabilityEvidence, live }) => {
    const result = computeScade(item, params); return { id: item.id, kind: item.kind, name: item.name, category: item.category,
      rating: hasRating ? item.rating : null, ratingSource: hasRating ? 'wayfinder' : 'unavailable', hasRating, source, sourceLabel: source === 'osm' ? 'OpenStreetMap' : source === 'geoapify' ? 'Geoapify' : 'Wayfinder', sources: [source], verified, latitude: item.latitude, longitude: item.longitude,
      sustainability: source === 'platform' ? item.sustainability : null, sustainabilityEvidence: sustainabilityEvidence ?? null,
      ecoFriendly: source !== 'platform' && !sustainabilityEvidence?.length ? 'unknown' : item.sustainability === null ? 'unknown' : item.sustainability >= 0.65,
      osmId: source === 'osm' ? live?.externalId.split('/')[1] ?? null : null, osmType: source === 'osm' ? live?.externalId.split('/')[0] ?? null : null,
      subtype: live?.sourceCategories[0] ?? null, address: live?.address ?? null, phone: live?.phone ?? null,
      website: live?.website ?? null, openingHours: live?.openingHours ?? null, locationLabel: 'Map location',
      popularity: source === 'platform' ? popularity : null, localRelevance: source === 'platform' ? localRelevance : null,
      recommendationScore: result.pct, scadeScore: result.pct, distanceKm: Number(result.distanceKm.toFixed(2)), matchedFactors: Object.entries(result.contrib).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([key]) => key), explanation: result.explanation };
  }).sort((a, b) => b.scadeScore - a.scadeScore || a.distanceKm - b.distanceKm);

  const liveState = discoveryError ? 'LIVE_FAILED' : warnings.length ? 'PARTIAL' : afterPlatformDedup.length ? 'LIVE_SUCCESS' : 'LIVE_EMPTY';
  console.info('[RECOMMENDATIONS] response', { source: liveSource, databaseCount: platformDocs.length, liveCount: afterPlatformDedup.length, returnedCount: scored.length, durationMs: Date.now() - startedAt, discoveryError });
  res.json({ success: true, count: scored.length, recommendations: scored, location: { latitude: lat, longitude: lng }, discovery: {
    state: liveState,
    source: liveSource, attempted: true, succeeded: discoveryError === null, liveResultsIncluded: afterPlatformDedup.length,
    radiusMeters, error: discoveryError, warnings, endpointUsed, selectedCategory: category ?? 'All', osmResultCount: diagnostics.rawElements,
    normalizedOsmCount: liveSource === 'osm' ? diagnostics.deduplicated : 0, afterDeduplication: afterPlatformDedup.length, providers,
    platformCandidates: beforeCategory.filter((candidate) => candidate.source === 'platform').length, totalCandidates: candidates.length, afterScade: scored.length,
    diagnostics: process.env.NODE_ENV !== 'production' ? { ...diagnostics, gpsAccuracy: accuracy, mongodb: platformDocs.length, afterMongoMerge: beforeCategory.length,
      afterNameFilter: afterSearch.length,
      afterCategoryFilter: afterCategory.length, afterRatingFilter: afterRating.length, afterBudgetFilter: afterBudget.length,
      afterEcoFilter: candidates.length, scadeCount: scored.length, finalLiveResults: afterPlatformDedup.length } : undefined,
  }, weather: { current: weather, error: weatherError } });
});
