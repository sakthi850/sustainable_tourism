import { Response } from 'express';
import TouristPlace from '../models/TouristPlace';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../middleware/errorHandler';
import { isValidCoordinate } from '../utils/haversine';

export const listPlaces = asyncHandler(async (req, res: Response) => {
  const places = await TouristPlace.find().sort({ createdAt: -1 });
  res.json({ success: true, count: places.length, places });
});

export const getPlace = asyncHandler(async (req, res: Response) => {
  const place = await TouristPlace.findById(req.params.id);
  if (!place) throw new ApiError(404, 'Tourist place not found.');
  res.json({ success: true, place });
});

function validatePlaceBody(body: any) {
  if (!body.name || typeof body.name !== 'string') throw new ApiError(400, 'name is required.');
  if (!Array.isArray(body.category) || !body.category.length) throw new ApiError(400, 'category must be a non-empty array.');
  if (!isValidCoordinate(body.latitude, body.longitude)) throw new ApiError(400, 'Valid latitude/longitude are required.');
}

export const createPlace = asyncHandler(async (req, res: Response) => {
  validatePlaceBody(req.body);
  const place = await TouristPlace.create({ ...req.body, source: 'admin' });
  res.status(201).json({ success: true, place });
});

export const updatePlace = asyncHandler(async (req, res: Response) => {
  if (req.body.latitude !== undefined || req.body.longitude !== undefined) {
    const lat = req.body.latitude, lng = req.body.longitude;
    if (!isValidCoordinate(lat, lng)) throw new ApiError(400, 'Valid latitude/longitude are required.');
  }
  const place = await TouristPlace.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!place) throw new ApiError(404, 'Tourist place not found.');
  res.json({ success: true, place });
});

export const deletePlace = asyncHandler(async (req, res: Response) => {
  const place = await TouristPlace.findByIdAndDelete(req.params.id);
  if (!place) throw new ApiError(404, 'Tourist place not found.');
  res.json({ success: true, message: 'Deleted.' });
});
