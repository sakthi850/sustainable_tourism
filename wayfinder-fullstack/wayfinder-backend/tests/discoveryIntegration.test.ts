import { osmToScoreable, dedupeAgainstPlatform, isWithinRecommendationRadius } from '../src/controllers/recommendationsController';
import { NormalizedPlace } from '../src/services/overpassService';

let pass = 0, fail = 0;
function assert(cond: boolean, msg: string) {
  if (cond) { pass++; console.log('  ✓', msg); }
  else { fail++; console.log('  ✗ FAILED:', msg); }
}

console.log('--- osmToScoreable ---');
const geoPlace: NormalizedPlace = {
  externalId: 'x1', name: 'Test Cafe', ourCategory: ['Food'], sourceCategories: ['catering.cafe'],
  kind: 'business', latitude: 11.02, longitude: 76.96, distanceKm: 1.2, source: 'osm',
  address: null, phone: null, website: null, openingHours: null, sustainabilityEvidence: null,
};
const scoreable = osmToScoreable(geoPlace);
assert(scoreable.id === 'osm:x1', 'id is prefixed to distinguish it from a platform ObjectId');
assert(scoreable.rating === 3, 'unrated live item receives the neutral fallback used only for ranking');
assert(scoreable.sustainability === null, 'unknown OSM sustainability remains null');
assert(scoreable.costLevel === null, 'unknown OSM cost remains null');
assert(scoreable.openTime === null && scoreable.closeTime === null, 'unknown opening hours remain null');

const naturePlace: NormalizedPlace = { ...geoPlace, ourCategory: ['Nature'], kind: 'place' };
assert(osmToScoreable(naturePlace).outdoor === true, 'Nature category is correctly flagged outdoor');
assert(osmToScoreable(naturePlace).costLevel === null, 'unknown place cost is not presented as free');

console.log('\n--- dedupeAgainstPlatform ---');
const platformDocs: any[] = [
  { name: 'Marudamalai Murugan Temple', latitude: 11.0733, longitude: 76.8845 },
];
const geoResults: NormalizedPlace[] = [
  { ...geoPlace, externalId: 'a', name: 'Marudamalai Murugan Temple', ourCategory: ['Culture'], sourceCategories: [], kind: 'place', latitude: 11.0734, longitude: 76.8846, distanceKm: 0 },
  { ...geoPlace, externalId: 'b', name: 'Marudamalai Murugan Temple', ourCategory: ['Culture'], sourceCategories: [], kind: 'place', latitude: 11.20, longitude: 77.10, distanceKm: 0 },
  { ...geoPlace, externalId: 'c', name: 'Some Other Cafe', ourCategory: ['Food'], sourceCategories: [], kind: 'business', latitude: 11.0735, longitude: 76.8847, distanceKm: 0 },
];
const deduped = dedupeAgainstPlatform(geoResults, platformDocs);
assert(deduped.length === 2, `exactly the true duplicate is removed (got ${deduped.length} of 3)`);
assert(!deduped.some((d) => d.externalId === 'a'), 'the close same-name match (a) was correctly dropped');
assert(deduped.some((d) => d.externalId === 'b'), 'the far same-name place (b) was correctly kept — same name doesn\'t always mean same place');
assert(deduped.some((d) => d.externalId === 'c'), 'the different-name nearby business (c) was correctly kept');

console.log('\n--- location-sensitive radius filtering ---');
const platformLat = 11.0168, platformLng = 76.9558;
assert(isWithinRecommendationRadius(11.0168, 76.9558, platformLat, platformLng, 5000), 'Location A retains its nearby platform candidate');
assert(!isWithinRecommendationRadius(11.3410, 77.7172, platformLat, platformLng, 5000), 'Location B excludes the distant Location A candidate');

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
