import { discoverNearby as discoverWithGeoapify } from './geoapifyService';
import {
  discoverNearby as discoverWithOverpass,
  DiscoveryCategory,
  DiscoveryDiagnostics,
  MAX_OVERPASS_RADIUS_METERS,
  NormalizedPlace,
} from './overpassService';

export type LiveProvider = 'geoapify' | 'osm';
export type LiveSource = LiveProvider | 'mixed';

export interface LiveDiscoveryResult {
  places: NormalizedPlace[];
  source: LiveSource;
  endpointUsed: string | null;
  rawCount: number;
  warnings: string[];
  diagnostics: DiscoveryDiagnostics;
  providers: Record<LiveProvider, { attempted: boolean; succeeded: boolean; count: number; error: string | null }>;
}

function emptyDiagnostics(): DiscoveryDiagnostics {
  return {
    overpassStatus: null, rawElements: 0, validCoordinates: 0, namedElements: 0,
    normalized: 0, deduplicated: 0, unnamedRemoved: 0, outsideRadiusRemoved: 0,
    duplicatesRemoved: 0, nodeCount: 0, wayCount: 0, relationCount: 0,
    invalidCoordinatesRemoved: 0, categoryFilteredRemoved: 0, responseLength: 0,
    perCategory: {},
  };
}

function samePlace(a: NormalizedPlace, b: NormalizedPlace): boolean {
  const normalizedA = a.name.trim().toLocaleLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
  const normalizedB = b.name.trim().toLocaleLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
  if (normalizedA !== normalizedB) return false;
  const latKm = (a.latitude - b.latitude) * 111;
  const lngKm = (a.longitude - b.longitude) * 111 * Math.cos(a.latitude * Math.PI / 180);
  return Math.hypot(latKm, lngKm) <= 0.15;
}

/**
 * Uses the configured commercial provider first, then falls back to keyless OSM.
 * An empty provider response is treated as a fallback condition, not an error.
 */
export async function discoverLiveNearby(
  lat: number,
  lng: number,
  radiusMeters: number,
  category?: DiscoveryCategory,
): Promise<LiveDiscoveryResult> {
  const apiKey = process.env.GEOAPIFY_API_KEY?.trim();
  const providers: LiveDiscoveryResult['providers'] = {
    geoapify: { attempted: false, succeeded: false, count: 0, error: null },
    osm: { attempted: false, succeeded: false, count: 0, error: null },
  };
  const warnings: string[] = [];

  let geoPlaces: NormalizedPlace[] = [];
  let osmPlaces: NormalizedPlace[] = [];
  let osmDiagnostics: DiscoveryDiagnostics | null = null;
  let osmEndpoint: string | null = null;
  let rawCount = 0;

  if (apiKey) {
    providers.geoapify.attempted = true;
    try {
      const discovered = await discoverWithGeoapify(lat, lng, radiusMeters, apiKey, category);
      const filtered = category ? discovered.filter((place) => place.ourCategory.includes(category)) : discovered;
      providers.geoapify.succeeded = true;
      providers.geoapify.count = filtered.length;
      if (filtered.length) {
        geoPlaces = filtered.map((place) => ({
          externalId: place.externalId,
          name: place.name,
          ourCategory: place.ourCategory,
          sourceCategories: place.sourceCategories,
          kind: place.kind,
          latitude: place.latitude,
          longitude: place.longitude,
          address: place.address,
          phone: null,
          website: null,
          openingHours: place.openingHours?.join('; ') ?? null,
          distanceKm: place.distanceKm,
          source: 'geoapify',
          sustainabilityEvidence: null,
          rating: place.rating ?? 3,
          hasRating: false,
        }));
        rawCount += discovered.length;
      }
      if (!filtered.length) warnings.push('Geoapify returned no matching places; OpenStreetMap results were used.');
    } catch (error) {
      providers.geoapify.error = error instanceof Error ? error.message : 'Geoapify discovery failed.';
      warnings.push(`Geoapify failed; OpenStreetMap fallback was used: ${providers.geoapify.error}`);
    }
  }

  providers.osm.attempted = true;
  const overpassRadiusMeters = Math.min(radiusMeters, MAX_OVERPASS_RADIUS_METERS);
  if (overpassRadiusMeters < radiusMeters) {
    warnings.push(`OpenStreetMap search radius was capped at ${MAX_OVERPASS_RADIUS_METERS} metres to avoid public API timeouts.`);
  }
  try {
    const result = await discoverWithOverpass(lat, lng, overpassRadiusMeters, category);
    providers.osm.succeeded = true;
    providers.osm.count = result.places.length;
    osmPlaces = result.places;
    osmDiagnostics = result.diagnostics;
    osmEndpoint = result.endpointUsed;
    rawCount += result.rawCount;
    warnings.push(...result.warnings);
  } catch (error) {
    providers.osm.error = error instanceof Error ? error.message : 'OpenStreetMap discovery failed.';
    warnings.push(`OpenStreetMap failed; returning any Geoapify results: ${providers.osm.error}`);
  }

  if (!providers.geoapify.succeeded && !providers.osm.succeeded) {
    const providerError = providers.geoapify.error ? `Geoapify: ${providers.geoapify.error} ` : '';
    throw new Error(`${providerError}OpenStreetMap: ${providers.osm.error}`.trim());
  }
  const places = [...geoPlaces];
  for (const place of osmPlaces) if (!places.some((existing) => samePlace(existing, place))) places.push(place);
  places.sort((a, b) => a.distanceKm - b.distanceKm);
  const diagnostics = osmDiagnostics ?? emptyDiagnostics();
  if (!osmDiagnostics) {
    diagnostics.rawElements = geoPlaces.length; diagnostics.validCoordinates = geoPlaces.length;
    diagnostics.namedElements = geoPlaces.length; diagnostics.normalized = geoPlaces.length; diagnostics.deduplicated = geoPlaces.length;
  }
  const source: LiveSource = geoPlaces.length && osmPlaces.length ? 'mixed' : geoPlaces.length ? 'geoapify' : 'osm';
  return { places, source, endpointUsed: [geoPlaces.length ? 'api.geoapify.com' : null, osmEndpoint].filter(Boolean).join(', ') || null, rawCount, warnings, diagnostics, providers };
}
