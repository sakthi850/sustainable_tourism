import { apiRequest } from './api';
import { DiscoveryResponse } from '../types';

export function discoverNearby(latitude: number, longitude: number, radius = 5000, category?: string, accuracy?: number): Promise<DiscoveryResponse> {
  const params = new URLSearchParams({ latitude: String(latitude), longitude: String(longitude), radius: String(radius) });
  if (category) params.set('category', category);
  if (accuracy !== undefined) params.set('accuracy', String(accuracy));
  return apiRequest<DiscoveryResponse>(`/discovery?${params.toString()}`);
}
