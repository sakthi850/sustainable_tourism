export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
}

export interface AuthResponse {
  success: true;
  token: string;
  user: User;
}

export type PlaceKind = 'place' | 'business';

export interface Recommendation {
  id: string;
  kind: PlaceKind;
  name: string;
  category: string[];
  rating: number | null;
  ratingSource: 'wayfinder' | 'unavailable';
  hasRating: boolean; // false for live OSM discoveries with no Wayfinder review data
  sustainability: number | null; // null when OSM has no explicit sustainability data
  ecoFriendly: boolean | 'unknown';
  osmId?: string | null;
  osmType?: 'node' | 'way' | 'relation' | null;
  subtype?: string | null;
  address?: string | null;
  phone?: string | null;
  website?: string | null;
  openingHours?: string | null;
  locationLabel?: 'Map location';
  popularity?: number | null;
  localRelevance?: number | null;
  sustainabilityEvidence?: string[] | null;
  source: 'platform' | 'osm' | 'geoapify';
  sourceLabel: 'OpenStreetMap' | 'Geoapify' | 'Wayfinder';
  sources: Array<'platform' | 'osm' | 'geoapify'>;
  verified?: boolean;
  scadeScore: number; // normalized S-CADE recommendation score, not a place rating
  recommendationScore: number;
  distanceKm: number;
  latitude: number;
  longitude: number;
  matchedFactors: string[];
  explanation: string;
}

export interface DiscoveryMeta {
  state: 'LIVE_SUCCESS' | 'LIVE_EMPTY' | 'LIVE_FAILED' | 'PARTIAL';
  source: 'osm' | 'geoapify' | 'mixed';
  attempted: boolean;
  succeeded: boolean;
  liveResultsIncluded: number;
  radiusMeters: number;
  error: string | null;
  warnings: string[];
  endpointUsed: string | null;
  selectedCategory: string;
  osmResultCount: number;
  normalizedOsmCount: number;
  afterDeduplication: number;
  platformCandidates: number;
  totalCandidates: number;
  afterScade: number;
  providers: Record<'osm' | 'geoapify', { attempted: boolean; succeeded: boolean; count: number; error: string | null }>;
  diagnostics?: {
    overpassStatus: number | null; rawElements: number; validCoordinates: number; namedElements: number;
    normalized: number; deduplicated: number; unnamedRemoved: number; outsideRadiusRemoved: number; duplicatesRemoved: number;
    nodeCount: number; wayCount: number; relationCount: number; invalidCoordinatesRemoved: number; categoryFilteredRemoved: number; responseLength: number;
    perCategory: Partial<Record<(typeof CATEGORIES)[number], { success: boolean; status: number | null; raw: number; final: number; error: string | null }>>;
    gpsAccuracy: number | null; mongodb: number; afterMongoMerge: number; afterNameFilter: number;
    afterCategoryFilter: number; afterRatingFilter: number; afterBudgetFilter: number;
    afterEcoFilter: number; scadeCount: number; finalLiveResults: number;
  };
}

export interface RecommendationsResponse {
  success: true;
  count: number;
  recommendations: Recommendation[];
  location: { latitude: number; longitude: number };
  discovery: DiscoveryMeta;
  weather: {
    current: { temperature: number; rain: number; weatherCode: number; timestamp: string; rainy: boolean } | null;
    error: string | null;
  };
}

export interface DiscoveredPlace {
  externalId: string;
  name: string;
  ourCategory: string[];
  sourceCategories: string[];
  kind: PlaceKind;
  latitude: number;
  longitude: number;
  address: string | null;
  phone: string | null;
  website: string | null;
  openingHours: string | null;
  distanceKm: number;
  source: 'osm' | 'geoapify';
  sustainabilityEvidence: string[] | null;
}

export interface DiscoveryResponse {
  success: true;
  source: 'osm' | 'geoapify' | 'mixed';
  live: true;
  userLocation: { latitude: number; longitude: number };
  radius: number;
  category: string;
  endpointUsed: string;
  rawCount: number;
  afterDeduplication: number;
  warnings: string[];
  count: number;
  places: DiscoveredPlace[];
}

export interface UserPreferences {
  interests: string[];
  travelMode: 'walking' | 'cycling' | 'driving' | 'public_transport';
  availableTimeMin: number;
  budget: number;
  sustainabilityPreference: number;
}

export interface PlaceDetail {
  _id: string;
  name: string;
  category: string[];
  description: string;
  latitude: number;
  longitude: number;
  address?: string;
  phone?: string;
  website?: string;
  openTime: string;
  closeTime: string;
  visitDurationMin?: number; // places only
  costLevel: number;
  rating: number;
  ratingCount: number;
  sustainability: number;
  verified: boolean;
  images?: string[];
}

export interface Review {
  _id: string;
  user: { _id: string; name: string } | string;
  targetType: PlaceKind;
  targetId: string;
  rating: number;
  comment: string;
  helpfulUpVotes: string[];
  helpfulDownVotes: string[];
  createdAt: string;
}

export interface EnrichedFavorite {
  favoriteId: string;
  targetType: PlaceKind;
  targetId: string;
  createdAt: string;
  item: { id: string; name: string; category: string[]; rating: number; sustainability: number; latitude: number; longitude: number } | null;
}

export const CATEGORIES = ['Nature', 'Food', 'Shopping', 'Accommodation', 'Culture', 'History'] as const;

export interface ApiErrorBody {
  success: false;
  message: string;
}
