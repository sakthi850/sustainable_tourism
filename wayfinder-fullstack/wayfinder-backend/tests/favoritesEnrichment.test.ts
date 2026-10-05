import { enrichFavorites } from '../src/controllers/favoritesController';

let pass = 0, fail = 0;
function assert(cond: boolean, msg: string) {
  if (cond) { pass++; console.log('  ✓', msg); }
  else { fail++; console.log('  ✗ FAILED:', msg); }
}

const favorites: any[] = [
  { _id: 'f1', targetType: 'place', targetId: 'p1', createdAt: new Date('2026-01-01') },
  { _id: 'f2', targetType: 'business', targetId: 'b1', createdAt: new Date('2026-01-02') },
  { _id: 'f3', targetType: 'place', targetId: 'p_deleted', createdAt: new Date('2026-01-03') }, // no longer exists
];
const places: any[] = [
  { _id: 'p1', name: 'Marudamalai Temple', category: ['Culture'], rating: 4.6, sustainability: 0.65, latitude: 11.07, longitude: 76.88 },
];
const businesses: any[] = [
  { _id: 'b1', name: 'Kovai Handloom Collective', category: ['Shopping'], rating: 4.5, sustainability: 0.85, latitude: 11.0, longitude: 76.9 },
];

const result = enrichFavorites(favorites, places, businesses);

console.log('--- enrichFavorites ---');
assert(result.length === 3, `returns one entry per favorite regardless of resolution (got ${result.length})`);
assert(result[0].item?.name === 'Marudamalai Temple', 'place favorite correctly resolved to its TouristPlace document');
assert(result[1].item?.name === 'Kovai Handloom Collective', 'business favorite correctly resolved to its LocalBusiness document, not confused with the place lookup');
assert(result[2].item === null, 'a favorite whose original was deleted resolves to item:null instead of throwing or vanishing');
assert(result[2].targetId === 'p_deleted', 'the deleted favorite still reports its targetId so the frontend can show something useful');
assert(typeof result[0].favoriteId === 'string' && typeof result[0].targetId === 'string', 'ids are normalized to strings for the API response');

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
