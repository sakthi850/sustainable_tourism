import { Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../middleware/errorHandler';
import { isValidCoordinate } from '../utils/haversine';
import { calculateRoute } from '../services/routingService';
export const route=asyncHandler(async(req,res:Response)=>{const a=Number(req.query.startLat),b=Number(req.query.startLng),c=Number(req.query.endLat),d=Number(req.query.endLng);if(!isValidCoordinate(a,b)||!isValidCoordinate(c,d))throw new ApiError(400,'Valid start and destination coordinates are required.');const result=await calculateRoute(a,b,c,d);res.json({success:true,route:result})});
