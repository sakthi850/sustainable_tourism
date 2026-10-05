import { Response } from 'express';
import RecommendationFeedback from '../models/RecommendationFeedback';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthedRequest } from '../middleware/auth';
import { ApiError } from '../middleware/errorHandler';

export const submitFeedback = asyncHandler(async (req: AuthedRequest, res: Response) => {
  if (!req.user) throw new ApiError(401, 'Authentication required.');
  const { targetType, targetId, scadeScoreAtFeedback, useful } = req.body ?? {};
  if (targetType !== 'place' && targetType !== 'business') throw new ApiError(400, 'targetType must be "place" or "business".');
  if (typeof useful !== 'boolean') throw new ApiError(400, 'useful must be true or false.');

  const feedback = await RecommendationFeedback.findOneAndUpdate(
    { user: req.user.userId, targetType, targetId },
    { scadeScoreAtFeedback: scadeScoreAtFeedback ?? 0, useful, createdAt: new Date() },
    { new: true, upsert: true }
  );
  res.json({ success: true, feedback });
});

export const listFeedbackForAdmin = asyncHandler(async (req, res: Response) => {
  const feedback = await RecommendationFeedback.find().populate('user', 'name email').sort({ createdAt: -1 }).limit(500);
  res.json({ success: true, count: feedback.length, feedback });
});
