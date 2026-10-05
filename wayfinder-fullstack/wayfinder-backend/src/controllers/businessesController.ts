import { Response } from 'express';
import LocalBusiness from '../models/LocalBusiness';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../middleware/errorHandler';
import { isValidCoordinate } from '../utils/haversine';

export const listBusinesses = asyncHandler(async (req, res: Response) => {
  const businesses = await LocalBusiness.find().sort({ createdAt: -1 });
  res.json({ success: true, count: businesses.length, businesses });
});

export const getBusiness = asyncHandler(async (req, res: Response) => {
  const business = await LocalBusiness.findById(req.params.id);
  if (!business) throw new ApiError(404, 'Business not found.');
  res.json({ success: true, business });
});

function validateBusinessBody(body: any) {
  if (!body.name || typeof body.name !== 'string') throw new ApiError(400, 'name is required.');
  if (!Array.isArray(body.category) || !body.category.length) throw new ApiError(400, 'category must be a non-empty array.');
  if (!isValidCoordinate(body.latitude, body.longitude)) throw new ApiError(400, 'Valid latitude/longitude are required.');
}

export const createBusiness = asyncHandler(async (req, res: Response) => {
  validateBusinessBody(req.body);
  // Businesses can be created even with minimal info (no phone/website) — per spec §7,
  // "manually registered by admins even when they have limited online presence".
  const business = await LocalBusiness.create({ ...req.body, verified: false });
  res.status(201).json({ success: true, business });
});

export const updateBusiness = asyncHandler(async (req, res: Response) => {
  if (req.body.latitude !== undefined || req.body.longitude !== undefined) {
    if (!isValidCoordinate(req.body.latitude, req.body.longitude)) throw new ApiError(400, 'Valid latitude/longitude are required.');
  }
  const business = await LocalBusiness.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!business) throw new ApiError(404, 'Business not found.');
  res.json({ success: true, business });
});

export const deleteBusiness = asyncHandler(async (req, res: Response) => {
  const business = await LocalBusiness.findByIdAndDelete(req.params.id);
  if (!business) throw new ApiError(404, 'Business not found.');
  res.json({ success: true, message: 'Deleted.' });
});

export const setVerified = asyncHandler(async (req, res: Response) => {
  const { verified } = req.body ?? {};
  if (typeof verified !== 'boolean') throw new ApiError(400, 'verified must be true or false.');
  const business = await LocalBusiness.findByIdAndUpdate(req.params.id, { verified }, { new: true });
  if (!business) throw new ApiError(404, 'Business not found.');
  res.json({ success: true, business });
});
