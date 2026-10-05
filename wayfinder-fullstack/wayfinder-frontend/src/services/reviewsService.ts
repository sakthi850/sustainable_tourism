import { apiRequest } from './api';
import { Review, PlaceKind } from '../types';

export async function listReviews(targetType: PlaceKind, targetId: string): Promise<Review[]> {
  const params = new URLSearchParams({ targetType, targetId });
  const res = await apiRequest<{ success: true; reviews: Review[] }>(`/reviews?${params}`, { auth: false });
  return res.reviews;
}

export async function createReview(targetType: PlaceKind, targetId: string, rating: number, comment: string): Promise<Review> {
  const res = await apiRequest<{ success: true; review: Review }>('/reviews', { method: 'POST', body: { targetType, targetId, rating, comment } });
  return res.review;
}

export async function updateReview(id: string, rating: number, comment: string): Promise<Review> {
  const res = await apiRequest<{ success: true; review: Review }>(`/reviews/${id}`, { method: 'PUT', body: { rating, comment } });
  return res.review;
}

export async function deleteReview(id: string): Promise<void> {
  await apiRequest(`/reviews/${id}`, { method: 'DELETE' });
}

export async function voteHelpful(id: string, helpful: boolean): Promise<{ helpfulCount: number; notHelpfulCount: number }> {
  return apiRequest(`/reviews/${id}/vote`, { method: 'POST', body: { helpful } });
}
