import { apiRequest } from './api';
import { PlaceDetail, PlaceKind } from '../types';

export async function getPlaceDetail(kind: PlaceKind, id: string): Promise<PlaceDetail> {
  const path = kind === 'place' ? `/places/${id}` : `/businesses/${id}`;
  const res = await apiRequest<{ success: true; place?: PlaceDetail; business?: PlaceDetail }>(path);
  const detail = res.place ?? res.business;
  if (!detail) throw new Error('Unexpected response shape from the backend.');
  return detail;
}
