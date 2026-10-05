export type SeedCategory = 'Food' | 'Shopping' | 'Accommodation' | 'Nature' | 'Culture' | 'History';

export interface PlaceSeed {
  name: string; category: SeedCategory[]; description: string;
  latitude: number; longitude: number; address?: string;
  openTime: string | null; closeTime: string | null; visitDurationMin: number;
  costLevel: number | null; rating: number | null; ratingCount: number;
  sustainability: number | null; localRelevance: number; popularity: number;
  images: string[]; verified: boolean; source: 'seed';
}

export interface BusinessSeed {
  name: string; category: SeedCategory[]; description: string;
  latitude: number; longitude: number; address?: string; phone?: string; website?: string;
  openTime: string | null; closeTime: string | null; costLevel: number | null;
  rating: number | null; ratingCount: number; sustainability: number | null;
  localRelevance: number; popularity: number; verified: boolean;
}
