export type WayfinderCategory = 'Nature' | 'Food' | 'Shopping' | 'Accommodation' | 'Culture' | 'History';
export type LiveSource = 'geoapify' | 'google';
export interface LiveDiscoveryPlace {
  externalId: string; name: string; ourCategory: WayfinderCategory[]; sourceCategories: string[];
  kind: 'place' | 'business'; latitude: number; longitude: number; address: string | null;
  openingHours: string[] | null; distanceKm: number; source: LiveSource; sources: LiveSource[];
  rating: number | null; hasRating: boolean; userRatingCount: number | null;
  costLevel: number | null; sustainability: null;
}
export interface ProviderStatus { attempted: boolean; success: boolean; count: number; error: string | null }
