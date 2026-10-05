import { haversineKm, isValidCoordinate } from '../utils/haversine';

export type DiscoveryCategory = 'Food' | 'Shopping' | 'Accommodation' | 'Nature' | 'Culture' | 'History';

export interface NormalizedPlace {
  externalId: string;
  name: string;
  ourCategory: string[];
  sourceCategories: string[];
  kind: 'place' | 'business';
  latitude: number;
  longitude: number;
  address: string | null;
  phone: string | null;
  website: string | null;
  openingHours: string | null;
  distanceKm: number;
  source: 'osm' | 'geoapify';
  sustainabilityEvidence: string[] | null;
  rating?: number;
  hasRating?: false;
}

export interface OverpassElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat?: number; lon?: number };
  tags?: Record<string, string>;
}

export interface DiscoveryResult {
  places: NormalizedPlace[];
  endpointUsed: string;
  rawCount: number;
  afterDeduplication: number;
  warnings: string[];
  diagnostics: DiscoveryDiagnostics;
}

export interface DiscoveryDiagnostics {
  overpassStatus: number | null;
  rawElements: number;
  validCoordinates: number;
  namedElements: number;
  normalized: number;
  deduplicated: number;
  unnamedRemoved: number;
  outsideRadiusRemoved: number;
  duplicatesRemoved: number;
  nodeCount: number;
  wayCount: number;
  relationCount: number;
  invalidCoordinatesRemoved: number;
  categoryFilteredRemoved: number;
  responseLength: number;
  perCategory: Partial<Record<DiscoveryCategory, { success: boolean; status: number | null; raw: number; final: number; error: string | null }>>;
}

interface CachedDiscovery { expiresAt: number; result: DiscoveryResult }
const cache = new Map<string, CachedDiscovery>();
const inFlight = new Map<string, Promise<DiscoveryResult>>();
const endpointCooldown = new Map<string, number>();
const CACHE_TTL_MS = 60_000;
const MAX_REQUESTED_RADIUS_METERS = 50_000;
export const MAX_OVERPASS_RADIUS_METERS = 3_000;
const RETRYABLE_STATUSES = new Set([408, 429, 500, 502, 503, 504]);
const DEFAULT_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
];

export class OverpassError extends Error {
  constructor(message: string, public readonly status?: number) { super(message); }
}

export function getElementCoordinates(element: OverpassElement): { latitude: number; longitude: number } | null {
  const latitude = element.type === 'node' ? element.lat : element.center?.lat;
  const longitude = element.type === 'node' ? element.lon : element.center?.lon;
  return isValidCoordinate(latitude, longitude) ? { latitude: latitude as number, longitude: longitude as number } : null;
}

function normalizeName(name: string): string {
  return name.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]/g, '');
}

export function classifyOsmTags(tags: Record<string, string>): { ourCategory: string[]; kind: 'place' | 'business'; sourceCategories: string[] } | null {
  const categories = new Set<string>();
  const sourceCategories = new Set<string>();
  const add = (key: string, values: string[] | '*', category: string) => {
    const value = tags[key];
    if (value && (values === '*' || values.includes(value))) {
      categories.add(category); sourceCategories.add(`${key}=${value}`);
    }
  };
  add('amenity', ['restaurant', 'cafe', 'fast_food', 'food_court', 'ice_cream', 'pub'], 'Food');
  add('shop', ['bakery', 'confectionery'], 'Food');
  add('shop', ['supermarket', 'mall', 'department_store', 'convenience', 'clothes', 'shoes', 'gift', 'marketplace'], 'Shopping');
  add('tourism', ['hotel', 'guest_house', 'hostel', 'motel', 'resort', 'chalet', 'camp_site'], 'Accommodation');
  add('leisure', ['park', 'garden', 'nature_reserve'], 'Nature');
  add('tourism', ['museum'], 'Culture'); add('tourism', ['museum'], 'History');
  add('tourism', ['gallery', 'attraction', 'theme_park', 'information', 'viewpoint'], 'Culture');
  add('tourism', ['attraction'], 'History');
  add('tourism', ['viewpoint', 'zoo'], 'Nature');
  add('tourism', ['aquarium'], 'Nature'); add('tourism', ['aquarium'], 'Culture');
  add('historic', '*', 'History'); add('heritage', '*', 'History');
  // Broader regional fallback mapping. Only named features with valid coordinates
  // reach this classifier, which avoids losing rural temples, dams, lakes, and shops.
  if (!categories.size && tags.shop) { categories.add('Shopping'); sourceCategories.add(`shop=${tags.shop}`); }
  if (!categories.size && tags.amenity) { categories.add('Culture'); sourceCategories.add(`amenity=${tags.amenity}`); }
  if (!categories.size && tags.tourism) { categories.add('Culture'); sourceCategories.add(`tourism=${tags.tourism}`); }
  if (!categories.size && tags.leisure) { categories.add('Nature'); sourceCategories.add(`leisure=${tags.leisure}`); }
  if (tags.natural) { categories.add('Nature'); sourceCategories.add(`natural=${tags.natural}`); }
  if (tags.waterway) { categories.add('Nature'); sourceCategories.add(`waterway=${tags.waterway}`); }
  if (!categories.size) return null;
  return {
    ourCategory: [...categories],
    kind: categories.has('Food') || categories.has('Shopping') || categories.has('Accommodation') ? 'business' : 'place',
    sourceCategories: [...sourceCategories],
  };
}

function getSustainabilityEvidence(tags: Record<string, string>): string[] | null {
  const evidence: string[] = [];
  for (const key of ['organic', 'diet:vegan', 'diet:vegetarian', 'recycling_type', 'eco', 'environmental']) {
    const value = tags[key]?.toLowerCase();
    if (value && !['no', 'none', 'unknown'].includes(value)) evidence.push(`${key}=${tags[key]}`);
  }
  return evidence.length ? evidence : null;
}

function buildAddress(tags: Record<string, string>): string | null {
  const street = [tags['addr:housenumber'], tags['addr:street']].filter(Boolean).join(' ');
  const parts = [street, tags['addr:suburb'], tags['addr:district'], tags['addr:city'], tags['addr:postcode']].filter(Boolean);
  return parts.length ? parts.join(', ') : null;
}

export function analyzeOverpassElements(elements: OverpassElement[], userLat: number, userLng: number, radiusMeters: number): { places: NormalizedPlace[]; validCoordinates: number; namedElements: number; normalized: number; unnamedRemoved: number; outsideRadiusRemoved: number; duplicatesRemoved: number; invalidCoordinatesRemoved: number; categoryFilteredRemoved: number } {
  const ids = new Set<string>();
  const results: NormalizedPlace[] = [];
  let validCoordinates = 0; let namedElements = 0; let normalized = 0; let unnamedRemoved = 0; let outsideRadiusRemoved = 0; let duplicatesRemoved = 0; let invalidCoordinatesRemoved = 0; let categoryFilteredRemoved = 0;
  for (const element of elements) {
    const externalId = `${element.type}/${element.id}`;
    if (ids.has(externalId)) { duplicatesRemoved++; continue; }
    ids.add(externalId);
    const tags = element.tags ?? {};
    const coordinates = getElementCoordinates(element);
    if (!coordinates) { invalidCoordinatesRemoved++; continue; }
    validCoordinates++;
    const name = (element.tags?.name ?? element.tags?.['name:en'] ?? element.tags?.['name:ta'])?.trim();
    if (!name) { unnamedRemoved++; continue; }
    namedElements++;
    const { latitude, longitude } = coordinates;
    const distanceKm = haversineKm(userLat, userLng, latitude, longitude);
    if (distanceKm * 1000 > radiusMeters) { outsideRadiusRemoved++; continue; }
    const classified = classifyOsmTags(tags);
    if (!classified) { categoryFilteredRemoved++; continue; }
    normalized++;
    if (results.some((place) => normalizeName(place.name) === normalizeName(name)
      && haversineKm(place.latitude, place.longitude, latitude, longitude) <= 0.15)) { duplicatesRemoved++; continue; }
    results.push({
      externalId, name, ...classified, latitude, longitude,
      address: buildAddress(tags), phone: tags.phone ?? tags['contact:phone'] ?? null,
      website: tags.website ?? tags['contact:website'] ?? null, openingHours: tags.opening_hours ?? null,
      distanceKm, source: 'osm', sustainabilityEvidence: getSustainabilityEvidence(tags), rating: 3, hasRating: false,
    });
  }
  return { places: results.sort((a, b) => a.distanceKm - b.distanceKm), validCoordinates, namedElements, normalized, unnamedRemoved, outsideRadiusRemoved, duplicatesRemoved, invalidCoordinatesRemoved, categoryFilteredRemoved };
}

export function parseOverpassElements(elements: OverpassElement[], userLat: number, userLng: number, radiusMeters: number): NormalizedPlace[] {
  return analyzeOverpassElements(elements, userLat, userLng, radiusMeters).places;
}

function selectorsFor(categories: DiscoveryCategory[]): string[] {
  const selectors = new Set<string>();
  if (categories.includes('Food')) { selectors.add('["amenity"~"^(restaurant|fast_food|cafe|food_court|ice_cream|pub)$"]'); selectors.add('["shop"~"^(bakery|confectionery)$"]'); }
  if (categories.includes('Shopping')) selectors.add('["shop"]');
  if (categories.includes('Accommodation')) selectors.add('["tourism"~"^(hotel|guest_house|hostel|motel|resort|chalet|camp_site)$"]');
  if (categories.includes('Nature')) {
    selectors.add('["leisure"]'); selectors.add('["natural"]'); selectors.add('["waterway"]'); selectors.add('["tourism"~"^(viewpoint|zoo|aquarium)$"]');
  }
  if (categories.includes('Culture')) { selectors.add('["tourism"]'); selectors.add('["amenity"="place_of_worship"]'); selectors.add('["leisure"]'); }
  if (categories.includes('History')) {
    selectors.add('["tourism"~"^(museum|attraction)$"]'); selectors.add('["historic"]'); selectors.add('["heritage"]');
  }
  return [...selectors];
}

export function buildOverpassQuery(lat: number, lng: number, radiusMeters: number, categories: DiscoveryCategory[]): string {
  const overpassRadius = Math.min(radiusMeters, MAX_OVERPASS_RADIUS_METERS);
  const around = `(around:${overpassRadius},${lat},${lng})`;
  const statements = selectorsFor(categories).map((selector) => `nwr${around}${selector};`).join('');
  return `[out:json][timeout:25];(${statements});out center;`;
}

export function buildQueryBatches(category?: DiscoveryCategory): DiscoveryCategory[][] {
  if (category) return [[category]];
  return [['Food'], ['Shopping'], ['Accommodation'], ['Nature'], ['Culture'], ['History']];
}

function configuredEndpoints(): string[] {
  const configured = process.env.OVERPASS_API_URLS ?? process.env.OVERPASS_API_URL;
  const values = configured?.split(',').map((value) => value.trim()).filter(Boolean);
  return values?.length ? [...new Set(values)] : DEFAULT_ENDPOINTS;
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function requestBatch(query: string, preferredEndpoint?: string): Promise<{ elements: OverpassElement[]; endpoint: string; status: number; responseLength: number }> {
  const endpoints = configuredEndpoints();
  if (preferredEndpoint && endpoints.includes(preferredEndpoint)) {
    endpoints.splice(endpoints.indexOf(preferredEndpoint), 1); endpoints.unshift(preferredEndpoint);
  }
  let lastError: Error | null = null;
  for (let index = 0; index < endpoints.length; index++) {
    const endpoint = endpoints[index];
    const cooldownKey = `${endpoint}:${query}`;
    if ((endpointCooldown.get(cooldownKey) ?? 0) > Date.now()) continue;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30_000);
    try {
      if (process.env.NODE_ENV !== 'production') console.log('[OVERPASS] requesting', { endpoint });
      const response = await fetch(endpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'Wayfinder-College-Project/1.0' },
        body: new URLSearchParams({ data: query }), signal: controller.signal,
      });
      if (!response.ok) {
        const error = new OverpassError(response.status === 429
          ? 'OpenStreetMap live discovery is rate limited. Please try again later.'
          : `OpenStreetMap live discovery failed with HTTP ${response.status}.`, response.status);
        if (!RETRYABLE_STATUSES.has(response.status)) throw error;
        endpointCooldown.set(cooldownKey, Date.now() + (response.status === 429 ? 120_000 : 15_000));
        lastError = error;
      } else {
        let data: unknown;
        try { data = await response.json(); } catch { throw new OverpassError('OpenStreetMap returned a malformed response.'); }
        if (!data || !Array.isArray((data as { elements?: unknown }).elements)) throw new OverpassError('OpenStreetMap returned a malformed response.');
        const elements = (data as { elements: OverpassElement[] }).elements;
        if (process.env.NODE_ENV !== 'production') console.log('[OVERPASS] response', { status: response.status, elementCount: elements.length, sample: elements.slice(0, 3) });
        return { elements, endpoint, status: response.status, responseLength: JSON.stringify(data).length };
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        lastError = new OverpassError('OpenStreetMap live discovery timed out.', 408);
        endpointCooldown.set(cooldownKey, Date.now() + 15_000);
      } else if (error instanceof OverpassError && (error.status === undefined || RETRYABLE_STATUSES.has(error.status))) {
        lastError = error; endpointCooldown.set(cooldownKey, Date.now() + 15_000);
      } else if (error instanceof Error) {
        lastError = new OverpassError(`Could not connect to ${new URL(endpoint).host}: ${error.message}`);
        endpointCooldown.set(cooldownKey, Date.now() + 15_000);
      } else throw error;
    } finally { clearTimeout(timer); }
    if (index < endpoints.length - 1) await delay(350);
  }
  throw lastError ?? new OverpassError('All OpenStreetMap discovery endpoints are temporarily cooling down.');
}

function cacheKey(lat: number, lng: number, radius: number, category?: DiscoveryCategory): string {
  return `${lat.toFixed(4)}:${lng.toFixed(4)}:${Math.round(radius)}:${category ?? 'All'}`;
}

function rebase(result: DiscoveryResult, lat: number, lng: number, radiusMeters: number): DiscoveryResult {
  const places = result.places.map((place) => ({ ...place, distanceKm: haversineKm(lat, lng, place.latitude, place.longitude) }))
    .filter((place) => place.distanceKm * 1000 <= radiusMeters).sort((a, b) => a.distanceKm - b.distanceKm);
  return { ...result, places, afterDeduplication: places.length, diagnostics: { ...result.diagnostics, deduplicated: places.length } };
}

export async function discoverNearby(lat: number, lng: number, radiusMeters: number, category?: DiscoveryCategory): Promise<DiscoveryResult> {
  if (!isValidCoordinate(lat, lng)) throw new Error('Invalid coordinates supplied to discovery.');
  if (!Number.isFinite(radiusMeters) || radiusMeters <= 0 || radiusMeters > MAX_REQUESTED_RADIUS_METERS) throw new Error('Radius must be a positive number, at most 50000 meters.');
  const effectiveRadiusMeters = Math.min(radiusMeters, MAX_OVERPASS_RADIUS_METERS);
  const key = cacheKey(lat, lng, effectiveRadiusMeters, category);
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) return rebase(cached.result, lat, lng, effectiveRadiusMeters);
  const pending = inFlight.get(key);
  if (pending) return pending.then((result) => rebase(result, lat, lng, effectiveRadiusMeters));

  const request = (async () => {
    const allElements: OverpassElement[] = [];
    let endpointUsed: string | undefined;
    let overpassStatus: number | null = null;
    const warnings: string[] = [];
    const perCategory: Partial<Record<DiscoveryCategory, { success: boolean; status: number | null; raw: number; final: number; error: string | null }>> = {};
    let responseLength = 0;
    let successfulBatches = 0;
    for (const batch of buildQueryBatches(category)) {
      try {
        const response = await requestBatch(buildOverpassQuery(lat, lng, effectiveRadiusMeters, batch), endpointUsed);
        endpointUsed = response.endpoint; overpassStatus = response.status; responseLength += response.responseLength; allElements.push(...response.elements); successfulBatches++;
        const batchAnalysis = analyzeOverpassElements(response.elements, lat, lng, effectiveRadiusMeters);
        for (const batchCategory of batch) perCategory[batchCategory] = { success: true, status: response.status, raw: response.elements.length, final: batchAnalysis.places.filter((place) => place.ourCategory.includes(batchCategory)).length, error: null };
      } catch (error) {
        if (category) throw error;
        const message = error instanceof Error ? error.message : 'Unknown error.';
        warnings.push(`${batch.join('/')} discovery failed: ${message}`);
        for (const batchCategory of batch) perCategory[batchCategory] = { success: false, status: error instanceof OverpassError ? error.status ?? null : null, raw: 0, final: 0, error: message };
      }
    }
    if (!successfulBatches) throw new OverpassError(warnings.join(' '));
    const analyzed = analyzeOverpassElements(allElements, lat, lng, effectiveRadiusMeters);
    const places = category ? analyzed.places.filter((place) => place.ourCategory.includes(category)) : analyzed.places;
    const result = { places, endpointUsed: endpointUsed!, rawCount: allElements.length, afterDeduplication: places.length, warnings,
      diagnostics: { overpassStatus, rawElements: allElements.length, validCoordinates: analyzed.validCoordinates, namedElements: analyzed.namedElements, normalized: analyzed.normalized, deduplicated: places.length,
        unnamedRemoved: analyzed.unnamedRemoved, outsideRadiusRemoved: analyzed.outsideRadiusRemoved, duplicatesRemoved: analyzed.duplicatesRemoved,
        nodeCount: allElements.filter((element) => element.type === 'node').length, wayCount: allElements.filter((element) => element.type === 'way').length,
        relationCount: allElements.filter((element) => element.type === 'relation').length, invalidCoordinatesRemoved: analyzed.invalidCoordinatesRemoved,
        categoryFilteredRemoved: analyzed.categoryFilteredRemoved, responseLength, perCategory } };
    cache.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, result });
    return result;
  })().finally(() => inFlight.delete(key));
  inFlight.set(key, request);
  return request;
}
