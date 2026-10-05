import { apiRequest } from './api';
import { PlaceDetail, PlaceKind, Review } from '../types';

export async function listCatalog(kind: PlaceKind): Promise<PlaceDetail[]> {
  const plural = kind === 'place' ? 'places' : 'businesses';
  const r = await apiRequest<any>(`/${plural}`, { auth: false });
  return r[plural];
}
export async function saveCatalog(kind: PlaceKind, item: Partial<PlaceDetail> & {name:string}, id?: string) {
  const plural = kind === 'place' ? 'places' : 'businesses';
  return apiRequest(`/${plural}${id ? `/${id}` : ''}`, {method:id?'PUT':'POST',body:item});
}
export async function deleteCatalog(kind: PlaceKind,id:string) { const p=kind==='place'?'places':'businesses'; await apiRequest(`/${p}/${id}`,{method:'DELETE'}); }
export async function verifyBusiness(id:string, verified:boolean) { await apiRequest(`/businesses/${id}/verify`,{method:'PATCH',body:{verified}}); }
export async function myReviews(): Promise<Review[]> { return (await apiRequest<{reviews:Review[]}>('/reviews/mine')).reviews; }
export async function adminReviews(): Promise<Review[]> { return (await apiRequest<{reviews:Review[]}>('/reviews/admin/all')).reviews; }
export async function adminFeedback(): Promise<any[]> { return (await apiRequest<{feedback:any[]}>('/feedback')).feedback; }
