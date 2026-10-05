import { Response } from 'express';
import UserPreference from '../models/UserPreference';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthedRequest } from '../middleware/auth';
import { ApiError } from '../middleware/errorHandler';

export const getPreferences = asyncHandler(async (req: AuthedRequest, res: Response) => {
  if (!req.user) throw new ApiError(401, 'Authentication required.');
  let prefs = await UserPreference.findOne({ user: req.user.userId });
  if (!prefs) prefs = await UserPreference.create({ user: req.user.userId });
  res.json({ success: true, preferences: prefs });
});

export const updatePreferences = asyncHandler(async (req: AuthedRequest, res: Response) => {
  if (!req.user) throw new ApiError(401, 'Authentication required.');
  const { interests, travelMode, availableTimeMin, budget, sustainabilityPreference } = req.body ?? {};
  const prefs = await UserPreference.findOneAndUpdate(
    { user: req.user.userId },
    { interests, travelMode, availableTimeMin, budget, sustainabilityPreference, updatedAt: new Date() },
    { new: true, upsert: true, runValidators: true }
  );
  res.json({ success: true, preferences: prefs });
});
