import { haversineKm, isValidCoordinate } from '../utils/haversine';
import { LiveDiscoveryPlace, WayfinderCategory } from './liveDiscoveryTypes';
export const QUERY_CATEGORIES = 'catering,commercial,tourism,leisure,entertainment,service,building,heritage,natural';
export const DEFAULT_LIVE_RATING = 3;
export function geoapifyCategoriesFor(category?: WayfinderCategory): string {
  switch (category) {
    case 'Food': return 'catering.restaurant,catering.fast_food,catering.cafe';
    case 'Culture':
    case 'History': return 'tourism,heritage,entertainment.culture';
    case 'Shopping': return 'commercial.shopping_mall,commercial.supermarket,commercial';
    case 'Accommodation': return 'accommodation';
    case 'Nature': return 'natural,leisure.park,leisure.garden';
    default: return 'catering,commercial,accommodation,tourism,leisure,entertainment,service,natural';
  }
}
interface GeoapifyFeature { properties: { place_id?: string; name?: string; categories?: string[]; formatted?: string; lat?: number; lon?: number; opening_hours?: string }; geometry?: { coordinates?: number[] } }
export function classifyGeoapifyCategories(categories: string[]): { ourCategory: WayfinderCategory[]; kind: 'place' | 'business' } {
  const has = (prefix: string) => categories.some((category) => category === prefix || category.startsWith(`${prefix}.`));
  const mapped = new Set<WayfinderCategory>(); let kind: 'place' | 'business' = 'place';
  if (has('natural') || has('leisure')) mapped.add('Nature');
  if (has('tourism')) mapped.add('Culture');
  if (has('entertainment')) { mapped.add('Culture'); if (categories.some((category) => category.includes('museum') || category.includes('heritage'))) mapped.add('History'); }
  if (has('heritage')) mapped.add('History');
  if (has('building')) mapped.add('Culture');
  if (has('catering')) { mapped.add('Food'); kind = 'business'; }
  if (has('commercial')) { mapped.add('Shopping'); kind = 'business'; }
  if (has('service')) { mapped.add('Shopping'); kind = 'business'; }
  if (has('accommodation')) { mapped.add('Accommodation'); kind = 'business'; }
  // Geoapify can return useful named regional POIs under provider-specific
  // subcategories. Keep them with a broad fallback instead of silently dropping them.
  if (!mapped.size) mapped.add('Culture');
  return { ourCategory: [...mapped], kind };
}
export async function discoverNearby(lat: number, lng: number, radiusMeters: number, apiKey = process.env.GEOAPIFY_API_KEY?.trim() ?? '', category?: WayfinderCategory): Promise<LiveDiscoveryPlace[]> {
  if (!isValidCoordinate(lat, lng)) throw new Error('Invalid coordinates supplied to discovery.');
  if (!Number.isFinite(radiusMeters) || radiusMeters <= 0 || radiusMeters > 50000) throw new Error('Radius must be a positive number, at most 50000 meters.');
  if (!apiKey) throw new Error('GEOAPIFY_API_KEY is not configured on the server.');
  const params = new URLSearchParams({
    categories: geoapifyCategoriesFor(category),
    filter: `circle:${lng},${lat},${radiusMeters}`,
    bias: `proximity:${lng},${lat}`,
    limit: '50',
    apiKey,
  });
  const url = `https://api.geoapify.com/v2/places?${params.toString()}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  let response: Response;
  try {
    response = await fetch(url, { signal: controller.signal });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw new Error('Geoapify request timed out.');
    throw new Error(`Could not connect to Geoapify: ${error instanceof Error ? error.message : 'network error'}`);
  } finally {
    clearTimeout(timeout);
  }
  if (!response.ok) throw new Error(`Geoapify request failed with HTTP ${response.status}.`);
  const data = await response.json() as { features?: GeoapifyFeature[] }; const seen = new Set<string>(); const results: LiveDiscoveryPlace[] = [];
  for (const feature of data.features ?? []) {
    const p = feature.properties; const latitude = p.lat ?? feature.geometry?.coordinates?.[1]; const longitude = p.lon ?? feature.geometry?.coordinates?.[0];
    if (!p.name || !isValidCoordinate(latitude, longitude)) continue;
    const classified = classifyGeoapifyCategories(p.categories ?? []);
    const distanceKm = haversineKm(lat, lng, latitude as number, longitude as number); if (distanceKm * 1000 > radiusMeters) continue;
    const externalId = p.place_id ?? `${p.name.toLowerCase()}|${(latitude as number).toFixed(4)}|${(longitude as number).toFixed(4)}`; if (seen.has(externalId)) continue; seen.add(externalId);
    results.push({ externalId, name: p.name, ...classified, sourceCategories: p.categories ?? [], latitude: latitude as number, longitude: longitude as number, address: p.formatted ?? null, openingHours: p.opening_hours ? [p.opening_hours] : null, distanceKm, source: 'geoapify', sources: ['geoapify'], rating: DEFAULT_LIVE_RATING, hasRating: false, userRatingCount: null, costLevel: null, sustainability: null });
  }
  return results.sort((a, b) => a.distanceKm - b.distanceKm);
}
