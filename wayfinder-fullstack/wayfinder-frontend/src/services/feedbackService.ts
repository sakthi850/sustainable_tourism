import { apiRequest } from './api';
import { PlaceKind } from '../types';

export async function submitRecommendationFeedback(targetType: PlaceKind, targetId: string, score: number, useful: boolean) {
  return apiRequest('/feedback', {
    method: 'POST', body: { targetType, targetId, scadeScoreAtFeedback: score, useful },
  });
}
