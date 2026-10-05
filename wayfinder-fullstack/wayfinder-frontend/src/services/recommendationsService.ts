import { apiRequest } from './api';
import { RecommendationsResponse } from '../types';

export interface RecommendationFilters {
  latitude: number;
  longitude: number;
  category?: string;
  budget?: number;
  travelMode?: string;
  availableTime?: number;
  ecoFriendly?: boolean;
  radius?: number;
  accuracy?: number;
  search?: string;
}

export async function getRecommendations(filters: RecommendationFilters): Promise<RecommendationsResponse> {
  const params = new URLSearchParams();
  params.set('latitude', String(filters.latitude));
  params.set('longitude', String(filters.longitude));
  if (filters.category) params.set('category', filters.category);
  if (filters.budget !== undefined) params.set('budget', String(filters.budget));
  if (filters.travelMode) params.set('travelMode', filters.travelMode);
  if (filters.availableTime !== undefined) params.set('availableTime', String(filters.availableTime));
  if (filters.ecoFriendly) params.set('ecoFriendly', 'true');
  if (filters.radius !== undefined) params.set('radius', String(filters.radius));
  if (filters.accuracy !== undefined) params.set('accuracy', String(filters.accuracy));
  if (filters.search) params.set('search', filters.search);

  return apiRequest<RecommendationsResponse>(`/recommendations?${params.toString()}`);
}
