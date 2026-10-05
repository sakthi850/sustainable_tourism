import { Response } from 'express';
import TouristPlace from '../models/TouristPlace';
import LocalBusiness from '../models/LocalBusiness';
import Itinerary, { IItineraryStop } from '../models/Itinerary';
import { computeScade, ScoreableItem, ScadeParams } from '../services/scadeService';
import { haversineKm, isValidCoordinate } from '../utils/haversine';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthedRequest } from '../middleware/auth';
import { ApiError } from '../middleware/errorHandler';

const SPEED_KMH: Record<string, number> = { walking: 4.5, cycling: 15, driving: 28, public_transport: 20 };

export const generateItinerary = asyncHandler(async (req: AuthedRequest, res: Response) => {
  if (!req.user) throw new ApiError(401, 'Authentication required.');
  const { availableTimeMin, travelMode, budget, interests, startLat, startLng, title } = req.body ?? {};
  if (!isValidCoordinate(startLat, startLng)) throw new ApiError(400, 'Valid startLat/startLng are required.');
  if (!Number.isFinite(availableTimeMin) || availableTimeMin < 15) throw new ApiError(400, 'availableTimeMin must be at least 15.');

  const [places, businesses] = await Promise.all([TouristPlace.find(), LocalBusiness.find()]);
  const all = [
    ...places.map((p) => ({ doc: p, kind: 'place' as const })),
    ...businesses.map((b) => ({ doc: b, kind: 'business' as const })),
  ];

  const params: ScadeParams = {
    userLat: startLat, userLng: startLng, interests: interests ?? [],
    budget: budget ?? 3, travelMode: travelMode ?? 'walking',
    availableTimeMin, sustainabilityPreference: 0.5,
  };

  let candidates = all
    .filter(({ doc }) => doc.costLevel === null || doc.costLevel <= (budget ?? 3))
    .filter(({ doc }) => !interests?.length || doc.category.some((c: string) => interests.includes(c)))
    .map(({ doc, kind }) => {
      const item: ScoreableItem = {
        id: doc._id.toString(), kind, name: doc.name, category: doc.category,
        latitude: doc.latitude, longitude: doc.longitude, openTime: doc.openTime, closeTime: doc.closeTime,
        visitDurationMin: 'visitDurationMin' in doc ? doc.visitDurationMin : 30,
        costLevel: doc.costLevel, rating: doc.rating, sustainability: doc.sustainability,
      };
      return { doc, kind, item, score: computeScade(item, params).total };
    })
    .sort((a, b) => b.score - a.score);

  const speed = SPEED_KMH[travelMode] ?? SPEED_KMH.walking;
  let remaining = availableTimeMin;
  let lastLat = startLat, lastLng = startLng;
  const stops: IItineraryStop[] = [];
  let clockOffset = 0;

  for (const c of candidates) {
    const distKm = haversineKm(lastLat, lastLng, c.item.latitude, c.item.longitude);
    const travelMin = Math.round((distKm / speed) * 60);
    const need = travelMin + c.item.visitDurationMin;
    if (need > remaining) continue;
    stops.push({
      targetType: c.kind, targetId: c.doc._id, name: c.doc.name,
      arrivalOffsetMin: clockOffset + travelMin, visitDurationMin: c.item.visitDurationMin, travelMinFromPrev: travelMin,
    });
    remaining -= need;
    clockOffset += need;
    lastLat = c.item.latitude; lastLng = c.item.longitude;
    if (remaining < 15) break;
  }

  const itinerary = await Itinerary.create({
    user: req.user.userId, title: title || 'My itinerary', availableTimeMin,
    travelMode: travelMode ?? 'walking', budget: budget ?? 3, interests: interests ?? [],
    startLat, startLng, stops, totalMinutesUsed: availableTimeMin - remaining,
  });

  res.status(201).json({ success: true, itinerary });
});

export const listItineraries = asyncHandler(async (req: AuthedRequest, res: Response) => {
  if (!req.user) throw new ApiError(401, 'Authentication required.');
  const itineraries = await Itinerary.find({ user: req.user.userId }).sort({ createdAt: -1 });
  res.json({ success: true, count: itineraries.length, itineraries });
});

export const getItinerary = asyncHandler(async (req: AuthedRequest, res: Response) => {
  if (!req.user) throw new ApiError(401, 'Authentication required.');
  const itinerary = await Itinerary.findOne({ _id: req.params.id, user: req.user.userId });
  if (!itinerary) throw new ApiError(404, 'Itinerary not found.');
  res.json({ success: true, itinerary });
});

export const deleteItinerary = asyncHandler(async (req: AuthedRequest, res: Response) => {
  if (!req.user) throw new ApiError(401, 'Authentication required.');
  const result = await Itinerary.findOneAndDelete({ _id: req.params.id, user: req.user.userId });
  if (!result) throw new ApiError(404, 'Itinerary not found.');
  res.json({ success: true, message: 'Deleted.' });
});
