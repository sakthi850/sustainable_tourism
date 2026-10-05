export interface RouteResult { geometry: [number, number][]; distanceKm: number; durationMin: number; mode: 'driving' }
export async function calculateRoute(startLat:number,startLng:number,endLat:number,endLng:number):Promise<RouteResult>{
  const url=`https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;
  const response=await fetch(url,{headers:{'User-Agent':'Wayfinder-academic-project'},signal:AbortSignal.timeout(8000)});
  if(!response.ok)throw new Error(`Route service returned HTTP ${response.status}.`);
  const data=await response.json() as any; const route=data.routes?.[0];
  if(!route?.geometry?.coordinates)throw new Error('No route was found.');
  return {geometry:route.geometry.coordinates.map(([lng,lat]:[number,number])=>[lat,lng]),distanceKm:Number((route.distance/1000).toFixed(2)),durationMin:Math.round(route.duration/60),mode:'driving'};
}
