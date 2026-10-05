import { apiRequest } from './api';
export interface RouteResult{geometry:[number,number][];distanceKm:number;durationMin:number;mode:'driving'}
export async function getRoute(a:number,b:number,c:number,d:number){const p=new URLSearchParams({startLat:String(a),startLng:String(b),endLat:String(c),endLng:String(d)});return (await apiRequest<{route:RouteResult}>(`/routing?${p}`,{auth:false})).route}
