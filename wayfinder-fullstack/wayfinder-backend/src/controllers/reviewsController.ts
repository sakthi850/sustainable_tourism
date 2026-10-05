import { Response } from 'express';
import { Types } from 'mongoose';
import Review from '../models/Review';
import TouristPlace from '../models/TouristPlace';
import LocalBusiness from '../models/LocalBusiness';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthedRequest } from '../middleware/auth';
import { ApiError } from '../middleware/errorHandler';

async function recalcRating(targetType: 'place' | 'business', targetId: Types.ObjectId) {
  const reviews = await Review.find({ targetType, targetId });
  const rating = reviews.length ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10 : 0;
  const ratingCount = reviews.length;
  if (targetType === 'place') {
    await TouristPlace.findByIdAndUpdate(targetId, { rating, ratingCount });
  } else {
    await LocalBusiness.findByIdAndUpdate(targetId, { rating, ratingCount });
  }
}

export const createReview = asyncHandler(async (req: AuthedRequest, res: Response) => {
  if (!req.user) throw new ApiError(401, 'Authentication required.');
  const { targetType, targetId, rating, comment } = req.body ?? {};
  if (targetType !== 'place' && targetType !== 'business') throw new ApiError(400, 'targetType must be "place" or "business".');
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) throw new ApiError(400, 'rating must be between 1 and 5.');
  if (!comment || typeof comment !== 'string' || !comment.trim()) throw new ApiError(400, 'comment is required.');

  const review = await Review.create({ user: req.user.userId, targetType, targetId, rating, comment: comment.trim() });
  await recalcRating(targetType, targetId);
  res.status(201).json({ success: true, review });
});

export const listReviewsForTarget = asyncHandler(async (req, res: Response) => {
  const { placeId } = req.params;
  const reviews = await Review.find({ targetId: placeId }).populate('user', 'name').sort({ createdAt: -1 });
  res.json({ success: true, count: reviews.length, reviews });
});

export const listReviewsByTarget = asyncHandler(async (req, res: Response) => {
  const { targetType, targetId } = req.query;
  if (targetType !== 'place' && targetType !== 'business') throw new ApiError(400, 'targetType must be "place" or "business".');
  if (typeof targetId !== 'string' || !Types.ObjectId.isValid(targetId)) throw new ApiError(400, 'A valid targetId is required.');
  const reviews = await Review.find({ targetType, targetId }).populate('user', 'name').sort({ createdAt: -1 });
  res.json({ success: true, count: reviews.length, reviews });
});

export const listMyReviews = asyncHandler(async (req: AuthedRequest, res: Response) => {
  if (!req.user) throw new ApiError(401, 'Authentication required.');
  const reviews = await Review.find({ user: req.user.userId }).sort({ createdAt: -1 });
  res.json({ success: true, count: reviews.length, reviews });
});

export const listAllReviews = asyncHandler(async (_req, res: Response) => {
  const reviews = await Review.find().populate('user', 'name email').sort({ createdAt: -1 }).limit(500);
  res.json({ success: true, count: reviews.length, reviews });
});

export const updateReview = asyncHandler(async (req: AuthedRequest, res: Response) => {
  if (!req.user) throw new ApiError(401, 'Authentication required.');
  const review = await Review.findById(req.params.id);
  if (!review) throw new ApiError(404, 'Review not found.');
  if (review.user.toString() !== req.user.userId) throw new ApiError(403, 'You can only edit your own reviews.');
  if (req.body.comment) review.comment = String(req.body.comment).trim();
  if (Number.isFinite(req.body.rating)) review.rating = req.body.rating;
  await review.save();
  await recalcRating(review.targetType, review.targetId);
  res.json({ success: true, review });
});

export const deleteReview = asyncHandler(async (req: AuthedRequest, res: Response) => {
  if (!req.user) throw new ApiError(401, 'Authentication required.');
  const review = await Review.findById(req.params.id);
  if (!review) throw new ApiError(404, 'Review not found.');
  if (review.user.toString() !== req.user.userId && req.user.role !== 'ADMIN') {
    throw new ApiError(403, 'You can only delete your own reviews.');
  }
  await review.deleteOne();
  await recalcRating(review.targetType, review.targetId);
  res.json({ success: true, message: 'Deleted.' });
});

export const voteHelpful = asyncHandler(async (req: AuthedRequest, res: Response) => {
  if (!req.user) throw new ApiError(401, 'Authentication required.');
  const { helpful } = req.body ?? {}; // true | false
  if (typeof helpful !== 'boolean') throw new ApiError(400, 'helpful must be true or false.');

  const review = await Review.findById(req.params.id);
  if (!review) throw new ApiError(404, 'Review not found.');

  const uid = new Types.ObjectId(req.user.userId);
  // Remove any prior vote from this user on this review (either direction) before applying the new one —
  // this is what makes "a user should not be able to vote both ways" actually true, not just documented.
  review.helpfulUpVotes = review.helpfulUpVotes.filter((id) => !id.equals(uid));
  review.helpfulDownVotes = review.helpfulDownVotes.filter((id) => !id.equals(uid));
  (helpful ? review.helpfulUpVotes : review.helpfulDownVotes).push(uid);
  await review.save();

  res.json({ success: true, helpfulCount: review.helpfulUpVotes.length, notHelpfulCount: review.helpfulDownVotes.length });
});
