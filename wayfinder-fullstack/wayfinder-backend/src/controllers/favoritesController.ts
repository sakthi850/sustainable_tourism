import { Response } from 'express';
import Favorite, { IFavorite } from '../models/Favorite';
import TouristPlace, { ITouristPlace } from '../models/TouristPlace';
import LocalBusiness, { ILocalBusiness } from '../models/LocalBusiness';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthedRequest } from '../middleware/auth';
import { ApiError } from '../middleware/errorHandler';

export interface EnrichedFavorite {
  favoriteId: string;
  targetType: 'place' | 'business';
  targetId: string;
  createdAt: Date;
  item: { id: string; name: string; category: string[]; rating: number | null; sustainability: number | null; latitude: number; longitude: number } | null;
}

/** Pure merge logic, independently testable without a live database: joins each favorite to its
 *  actual place/business document. item is null (not thrown/skipped) if the original was deleted
 *  since being favorited — the frontend can show "no longer available" rather than the list just
 *  silently shrinking. */
export function enrichFavorites(
  favorites: IFavorite[], places: ITouristPlace[], businesses: ILocalBusiness[]
): EnrichedFavorite[] {
  const placeMap = new Map(places.map((p) => [p._id.toString(), p]));
  const businessMap = new Map(businesses.map((b) => [b._id.toString(), b]));
  return favorites.map((f) => {
    const doc = f.targetType === 'place' ? placeMap.get(f.targetId.toString()) : businessMap.get(f.targetId.toString());
    return {
      favoriteId: f._id.toString(), targetType: f.targetType, targetId: f.targetId.toString(), createdAt: f.createdAt,
      item: doc ? { id: doc._id.toString(), name: doc.name, category: doc.category, rating: doc.rating, sustainability: doc.sustainability, latitude: doc.latitude, longitude: doc.longitude } : null,
    };
  });
}

export const listFavorites = asyncHandler(async (req: AuthedRequest, res: Response) => {
  if (!req.user) throw new ApiError(401, 'Authentication required.');
  const favorites = await Favorite.find({ user: req.user.userId }).sort({ createdAt: -1 });

  const placeIds = favorites.filter((f) => f.targetType === 'place').map((f) => f.targetId);
  const businessIds = favorites.filter((f) => f.targetType === 'business').map((f) => f.targetId);
  const [places, businesses] = await Promise.all([
    TouristPlace.find({ _id: { $in: placeIds } }),
    LocalBusiness.find({ _id: { $in: businessIds } }),
  ]);

  const enriched = enrichFavorites(favorites, places, businesses);
  res.json({ success: true, count: enriched.length, favorites: enriched });
});

export const addFavorite = asyncHandler(async (req: AuthedRequest, res: Response) => {
  if (!req.user) throw new ApiError(401, 'Authentication required.');
  const { targetType } = req.body ?? {};
  if (targetType !== 'place' && targetType !== 'business') throw new ApiError(400, 'targetType must be "place" or "business".');
  try {
    const fav = await Favorite.create({ user: req.user.userId, targetType, targetId: req.params.placeId });
    res.status(201).json({ success: true, favorite: fav });
  } catch (err: any) {
    if (err.code === 11000) throw new ApiError(409, 'Already in favorites.');
    throw err;
  }
});

export const removeFavorite = asyncHandler(async (req: AuthedRequest, res: Response) => {
  if (!req.user) throw new ApiError(401, 'Authentication required.');
  const result = await Favorite.findOneAndDelete({ user: req.user.userId, targetId: req.params.placeId });
  if (!result) throw new ApiError(404, 'Favorite not found.');
  res.json({ success: true, message: 'Removed from favorites.' });
});
