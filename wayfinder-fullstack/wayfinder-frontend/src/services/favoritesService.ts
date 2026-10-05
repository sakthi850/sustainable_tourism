import { apiRequest } from './api';
import { EnrichedFavorite, PlaceKind } from '../types';

export async function listFavorites(): Promise<EnrichedFavorite[]> {
  const res = await apiRequest<{ success: true; favorites: EnrichedFavorite[] }>('/favorites');
  return res.favorites;
}

export async function addFavorite(targetType: PlaceKind, targetId: string): Promise<void> {
  await apiRequest(`/favorites/${targetId}`, { method: 'POST', body: { targetType } });
}

export async function removeFavorite(targetId: string): Promise<void> {
  await apiRequest(`/favorites/${targetId}`, { method: 'DELETE' });
}
