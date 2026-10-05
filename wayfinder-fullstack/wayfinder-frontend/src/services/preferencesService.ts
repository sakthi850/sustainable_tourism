import { apiRequest } from './api';
import { UserPreferences } from '../types';

export async function getMyPreferences(): Promise<UserPreferences> {
  const res = await apiRequest<{ success: true; preferences: UserPreferences }>('/preferences');
  return res.preferences;
}

export async function saveMyPreferences(prefs: UserPreferences): Promise<UserPreferences> {
  const res = await apiRequest<{ success: true; preferences: UserPreferences }>('/preferences', { method: 'PUT', body: prefs });
  return res.preferences;
}
