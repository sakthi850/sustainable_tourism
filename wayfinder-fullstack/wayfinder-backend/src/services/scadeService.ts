import { haversineKm } from '../utils/haversine';

/**
 * S-CADE weighted scoring model. All weights live here — nowhere else in the codebase
 * should a magic scoring number appear (per spec §10: "stored in one configuration/service
 * instead of being scattered throughout the code").
 *
 * Note: the spec lists "user interests" and "category match" as separate factors, but they are
 * the same underlying signal (does this item's category overlap the user's stated interests) —
 * scoring it twice would double-count one signal rather than add real information, so this
 * service combines them into a single `preference` factor and documents that decision here.
 */
export const SCADE_WEIGHTS = {
  distance: 30,
  preference: 25,      // covers both "user interests" and "category match"
  rating: 10,
  sustainability: 12,  // scaled per-user by their sustainability preference slider, see below
  budget: 8,
  time: 8,
  openingHours: 5,
  travelMode: 4,
  context: 3,
};

export interface ScoreableItem {
  id: string;
  kind: 'place' | 'business';
  name: string;
  category: string[];
  latitude: number;
  longitude: number;
  openTime: string | null;
  closeTime: string | null;
  visitDurationMin: number;
  costLevel: number | null;
  rating: number | null;
  sustainability: number | null;
  outdoor?: boolean;
}

export interface ScadeParams {
  userLat: number;
  userLng: number;
  interests: string[];
  budget: number;             // 0-3, user's max acceptable cost level
  travelMode: 'walking' | 'cycling' | 'driving' | 'public_transport';
  availableTimeMin: number;
  sustainabilityPreference: number; // 0-1
  now?: Date;
  weather?: { rainy: boolean } | null;
}

export interface ScadeResult {
  total: number;
  pct: number; // 0-100, normalized
  distanceKm: number;
  contrib: Record<string, number>;
  matchedInterests: string[];
  explanation: string;
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function isOpenAt(item: ScoreableItem, now: Date): boolean {
  if (!item.openTime || !item.closeTime) return false;
  const mins = now.getHours() * 60 + now.getMinutes();
  return mins >= toMinutes(item.openTime) && mins <= toMinutes(item.closeTime);
}

function opensLaterToday(item: ScoreableItem, now: Date): boolean {
  if (!item.openTime) return false;
  const mins = now.getHours() * 60 + now.getMinutes();
  return mins < toMinutes(item.openTime);
}

function scoreDistance(distanceKm: number): number {
  // Smooth decay keeps nearby places strongly preferred while still differentiating
  // valid results at larger user-selected radii.
  return 1 / (1 + distanceKm / 5);
}

function scorePreference(item: ScoreableItem, interests: string[]): { score: number; matched: string[] } {
  if (!interests.length) return { score: 0.5, matched: [] };
  const matched = item.category.filter((c) => interests.includes(c));
  return { score: Math.min(1, 0.25 + 0.35 * matched.length), matched };
}

function scoreBudget(item: ScoreableItem, budget: number): number {
  if (item.costLevel === null) return 0.5;
  if (item.costLevel <= budget) return 1;
  return Math.max(0, 1 - (item.costLevel - budget) * 0.4);
}

function scoreTime(item: ScoreableItem, availableTimeMin: number): number {
  if (item.visitDurationMin <= availableTimeMin) return 1;
  // Visiting would eat all (or more than) the available time — not a hard blocker, just a lower score.
  return Math.max(0, availableTimeMin / item.visitDurationMin);
}

function scoreOpeningHours(item: ScoreableItem, now: Date): number {
  if (!item.openTime || !item.closeTime) return 0.5;
  if (isOpenAt(item, now)) return 1;
  if (opensLaterToday(item, now)) return 0.4;
  return 0.1;
}

function scoreTravelMode(distanceKm: number, mode: ScadeParams['travelMode']): number {
  const comfortableRangeKm: Record<ScadeParams['travelMode'], number> = {
    walking: 2, cycling: 8, public_transport: 12, driving: 30,
  };
  const range = comfortableRangeKm[mode] ?? 10;
  return Math.max(0.2, 1 - Math.max(0, distanceKm - range) / range);
}

function scoreContext(item: ScoreableItem, weather?: { rainy: boolean } | null): number {
  if (weather?.rainy && item.outdoor) return 0.3; // outdoor place + rain -> lower context score, per spec §19
  if (weather && !weather.rainy && item.outdoor) return 0.95;
  return 0.75; // indoor places, or no weather signal available — never let weather be the *only* factor
}

export function computeScade(item: ScoreableItem, params: ScadeParams): ScadeResult {
  const now = params.now ?? new Date();
  const distanceKm = haversineKm(params.userLat, params.userLng, item.latitude, item.longitude);
  const pref = scorePreference(item, params.interests);

  // The user's own sustainability-preference slider scales that weight for THEM specifically —
  // 0.5 (default) reproduces a fixed-weight baseline; 0 and 1 meaningfully shift results.
  const sustWeight = SCADE_WEIGHTS.sustainability * (0.4 + 1.2 * params.sustainabilityPreference);

  const contrib: Record<string, number> = {
    distance: scoreDistance(distanceKm) * SCADE_WEIGHTS.distance,
    preference: pref.score * SCADE_WEIGHTS.preference,
    rating: (item.rating === null ? 0 : item.rating / 5) * SCADE_WEIGHTS.rating,
    sustainability: (item.sustainability === null ? 0 : item.sustainability) * sustWeight,
    budget: (item.costLevel === null ? 0 : scoreBudget(item, params.budget)) * SCADE_WEIGHTS.budget,
    time: scoreTime(item, params.availableTimeMin) * SCADE_WEIGHTS.time,
    openingHours: (!item.openTime || !item.closeTime ? 0 : scoreOpeningHours(item, now)) * SCADE_WEIGHTS.openingHours,
    travelMode: scoreTravelMode(distanceKm, params.travelMode) * SCADE_WEIGHTS.travelMode,
    context: scoreContext(item, params.weather) * SCADE_WEIGHTS.context,
  };

  const total = Object.values(contrib).reduce((a, b) => a + b, 0);
  // Normalize against the FIXED baseline weights, not the per-user-adjusted sustWeight — otherwise
  // scaling one factor's weight also scales the denominator by the same factor, which can cancel out
  // almost entirely in the final percentage even though the raw score clearly moved. (Caught by a test:
  // sustainabilityPreference 0 vs 1 produced the same 69% until this was fixed.)
  // Unknown optional fields neither earn points nor lower the score: their weights are
  // removed from the available-information denominator. This is neutral without rewarding
  // missing data, and prevents OSM's absent commercial metadata from becoming a fake signal.
  const availableMaxTotal = SCADE_WEIGHTS.distance + SCADE_WEIGHTS.preference + SCADE_WEIGHTS.time +
    SCADE_WEIGHTS.travelMode + SCADE_WEIGHTS.context +
    (item.rating === null ? 0 : SCADE_WEIGHTS.rating) +
    (item.sustainability === null ? 0 : SCADE_WEIGHTS.sustainability) +
    (item.costLevel === null ? 0 : SCADE_WEIGHTS.budget) +
    (!item.openTime || !item.closeTime ? 0 : SCADE_WEIGHTS.openingHours);
  const pct = Math.max(0, Math.min(100, Math.round((100 * total) / availableMaxTotal)));

  return {
    total, pct, distanceKm, contrib, matchedInterests: pref.matched,
    explanation: buildExplanation(item, contrib, pref.matched, distanceKm, isOpenAt(item, now)),
  };
}

function buildExplanation(
  item: ScoreableItem, contrib: Record<string, number>, matched: string[], distanceKm: number, openNow: boolean
): string {
  const top = Object.entries(contrib).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([key]) => {
    switch (key) {
      case 'preference': return matched.length ? `matches your ${matched[0]} interest` : 'broadly matches your profile';
      case 'distance': return `${distanceKm.toFixed(1)} km away`;
      case 'rating': return item.rating === null ? 'has neutral weight for an unknown rating' : `rated ${item.rating}★`;
      case 'sustainability': return item.sustainability === null ? 'has neutral weight for unknown sustainability' : 'has a strong sustainability score';
      case 'budget': return item.costLevel === null ? 'has neutral weight for unknown cost' : 'fits your selected budget';
      case 'time': return 'fits within your available time';
      case 'openingHours': return !item.openTime ? 'has neutral weight for unknown opening hours' : openNow ? 'open now' : 'opens later today';
      case 'travelMode': return 'reasonably reachable by your travel mode';
      case 'context': return 'well-suited to current conditions';
      default: return key;
    }
  });
  return `Recommended because it ${top.join(', ')}.`;
}
