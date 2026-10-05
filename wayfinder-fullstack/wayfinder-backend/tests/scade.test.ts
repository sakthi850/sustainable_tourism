import { haversineKm, haversineMeters, isValidCoordinate } from '../src/utils/haversine';
import { computeScade, ScoreableItem, SCADE_WEIGHTS } from '../src/services/scadeService';

let pass = 0, fail = 0;
function assert(cond: boolean, msg: string) {
  if (cond) { pass++; console.log('  ✓', msg); }
  else { fail++; console.log('  ✗ FAILED:', msg); }
}

console.log('--- Haversine ---');
// Coimbatore city centre to Marudamalai temple — real-world distance is roughly 11-12km
const d1 = haversineKm(11.0168, 76.9558, 11.0733, 76.8845);
assert(d1 > 8 && d1 < 15, `Coimbatore->Marudamalai distance is plausible (got ${d1.toFixed(2)}km)`);
assert(haversineKm(10, 76, 10, 76) === 0, 'distance from a point to itself is 0');
assert(haversineMeters(10, 76, 10, 76) === 0, 'distance in meters from a point to itself is 0');
assert(isValidCoordinate(11.5, 77.2), 'valid coordinate accepted');
assert(!isValidCoordinate(200, 77.2), 'out-of-range latitude rejected');
assert(!isValidCoordinate(NaN, 77.2), 'NaN rejected');
assert(!isValidCoordinate('11.5' as any, 77.2), 'string coordinate rejected');

console.log('\n--- S-CADE scoring ---');
const baseItem: ScoreableItem = {
  id: 'p1', kind: 'place', name: 'Test Temple', category: ['Culture', 'History'],
  latitude: 11.0733, longitude: 76.8845, openTime: '06:00', closeTime: '20:00',
  visitDurationMin: 60, costLevel: 0, rating: 4.5, sustainability: 0.7, outdoor: false,
};
const baseParams = {
  userLat: 11.0168, userLng: 76.9558, interests: ['Culture'], budget: 3,
  travelMode: 'walking' as const, availableTimeMin: 180, sustainabilityPreference: 0.5,
  now: new Date('2026-01-15T10:00:00'),
};

const r1 = computeScade(baseItem, baseParams);
assert(r1.pct >= 0 && r1.pct <= 100, `score is a valid percentage (got ${r1.pct})`);
assert(r1.matchedInterests.includes('Culture'), 'matched interest correctly identified');
assert(r1.explanation.toLowerCase().includes('culture'), 'explanation mentions the matched interest');
assert(r1.distanceKm > 8 && r1.distanceKm < 15, 'distanceKm matches haversine result');

// Sustainability preference should meaningfully change the score
const rLowSust = computeScade(baseItem, { ...baseParams, sustainabilityPreference: 0 });
const rHighSust = computeScade(baseItem, { ...baseParams, sustainabilityPreference: 1 });
assert(rHighSust.pct > rLowSust.pct, `sustainability preference changes score (low=${rLowSust.pct}, high=${rHighSust.pct})`);

// A far-away item should score lower on distance than a nearby one, all else equal
const nearItem: ScoreableItem = { ...baseItem, id: 'p2', latitude: 11.02, longitude: 76.96 };
const farItem: ScoreableItem = { ...baseItem, id: 'p3', latitude: 12.5, longitude: 78.5 };
const rNear = computeScade(nearItem, baseParams);
const rFar = computeScade(farItem, baseParams);
assert(rNear.contrib.distance > rFar.contrib.distance, 'nearer item scores higher on distance factor');
const unknownOsmItem: ScoreableItem = { ...baseItem, id: 'osm', rating: null, sustainability: null, costLevel: null, openTime: null, closeTime: null };
const unknownResult = computeScade(unknownOsmItem, baseParams);
assert(unknownResult.contrib.rating === 0 && unknownResult.contrib.sustainability === 0 && unknownResult.contrib.budget === 0 && unknownResult.contrib.openingHours === 0,
  'missing OSM fields earn no fabricated scoring contribution');
const osm22 = computeScade({ ...unknownOsmItem, latitude: 11.960, longitude: 77.3304 }, { ...baseParams, userLat: 11.7605, userLng: 77.3304 });
const osm25 = computeScade({ ...unknownOsmItem, latitude: 11.985, longitude: 77.3304 }, { ...baseParams, userLat: 11.7605, userLng: 77.3304 });
assert(osm22.pct > osm25.pct, `distance differentiates incomplete OSM records (${osm22.pct} > ${osm25.pct})`);

// An item costing more than the user's budget should score lower on budget than one within budget
const cheapItem: ScoreableItem = { ...baseItem, id: 'p4', costLevel: 0 };
const pricyItem: ScoreableItem = { ...baseItem, id: 'p5', costLevel: 3 };
const rCheap = computeScade(cheapItem, { ...baseParams, budget: 0 });
const rPricy = computeScade(pricyItem, { ...baseParams, budget: 0 });
assert(rCheap.contrib.budget > rPricy.contrib.budget, 'over-budget item scores lower on budget factor');

// Rain should lower the context score for an outdoor place
const outdoorItem: ScoreableItem = { ...baseItem, id: 'p6', outdoor: true };
const rClear = computeScade(outdoorItem, { ...baseParams, weather: { rainy: false } });
const rRainy = computeScade(outdoorItem, { ...baseParams, weather: { rainy: true } });
assert(rClear.contrib.context > rRainy.contrib.context, 'rain lowers context score for outdoor place');

// A visit that doesn't fit the available time should score lower on time
const longVisit: ScoreableItem = { ...baseItem, id: 'p7', visitDurationMin: 500 };
const rShortTime = computeScade(longVisit, { ...baseParams, availableTimeMin: 60 });
const rLongTime = computeScade(longVisit, { ...baseParams, availableTimeMin: 600 });
assert(rLongTime.contrib.time > rShortTime.contrib.time, 'insufficient available time lowers time-compatibility score');

// Weights really do all live in one place
assert(Object.keys(SCADE_WEIGHTS).length === 9, `exactly 9 named weights exist (got ${Object.keys(SCADE_WEIGHTS).length})`);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
