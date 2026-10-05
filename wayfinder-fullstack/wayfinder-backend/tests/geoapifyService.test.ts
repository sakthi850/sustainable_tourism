// Mock global fetch before importing the service under test
const mockResponse = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', properties: { place_id: 'a1', name: 'Test Cafe', categories: ['catering.cafe'], formatted: '1 Main St' }, geometry: { type: 'Point', coordinates: [76.96, 11.02] } },
    { type: 'Feature', properties: { place_id: 'a2', name: 'Test Forest Park', categories: ['natural.forest', 'leisure.park'], formatted: 'Forest Rd' }, geometry: { type: 'Point', coordinates: [76.95, 11.03] } },
    { type: 'Feature', properties: { place_id: 'a3', name: 'Test Museum', categories: ['entertainment.museum'], formatted: 'Museum Ave' }, geometry: { type: 'Point', coordinates: [76.955, 11.017] } },
    { type: 'Feature', properties: { place_id: 'a4', name: 'Test Supermarket', categories: ['commercial.supermarket'], formatted: 'Market St' }, geometry: { type: 'Point', coordinates: [76.957, 11.018] } },
    { type: 'Feature', properties: { place_id: 'a5', name: 'Test Hotel', categories: ['accommodation.hotel'], formatted: 'Hotel Rd' }, geometry: { type: 'Point', coordinates: [76.96, 11.02] } },
    { type: 'Feature', properties: { place_id: 'a6', name: 'Unknown Weird Category', categories: ['some.made_up_category'], formatted: 'Nowhere' }, geometry: { type: 'Point', coordinates: [76.96, 11.02] } }, // should be dropped, not defaulted to Nature
    { type: 'Feature', properties: { place_id: 'a1', name: 'Test Cafe', categories: ['catering.cafe'], formatted: '1 Main St' }, geometry: { type: 'Point', coordinates: [76.96, 11.02] } }, // exact duplicate place_id -> should be deduped
    { type: 'Feature', properties: { name: 'No coords place', categories: ['natural.forest'] }, geometry: { type: 'Point', coordinates: [] as any } }, // invalid coords -> dropped
  ],
};

let requestedUrl = '';
(global as any).fetch = async (url: string) => {
  requestedUrl = url;
  if (!url.includes('api.geoapify.com')) throw new Error('unexpected URL: ' + url);
  return { ok: true, json: async () => mockResponse } as any;
};

import { discoverNearby, geoapifyCategoriesFor } from '../src/services/geoapifyService';

let failures = 0;
function check(label: string, cond: boolean) {
  console.log((cond ? '✅' : '❌'), label);
  if (!cond) failures++;
}

async function main() {
  check('All-category mapping uses broad live POI groups', geoapifyCategoriesFor() === 'catering,commercial,accommodation,tourism,leisure,entertainment,service,natural');
  check('Food mapping uses dedicated Geoapify categories', geoapifyCategoriesFor('Food') === 'catering.restaurant,catering.fast_food,catering.cafe');
  check('Culture mapping uses dedicated Geoapify categories', geoapifyCategoriesFor('Culture') === 'tourism,heritage,entertainment.culture');
  check('Shopping mapping uses dedicated Geoapify categories', geoapifyCategoriesFor('Shopping') === 'commercial.shopping_mall,commercial.supermarket,commercial');
  check('Nature mapping uses dedicated Geoapify categories', geoapifyCategoriesFor('Nature') === 'natural,leisure.park,leisure.garden');
  check('Accommodation mapping uses dedicated Geoapify categories', geoapifyCategoriesFor('Accommodation') === 'accommodation');
  const results = await discoverNearby(11.02, 76.96, 4000, 'fake-key-for-test');
  const request = new URL(requestedUrl);
  check('Geoapify request uses limit=50', request.searchParams.get('limit') === '50');
  check('Geoapify request includes the circle filter', request.searchParams.get('filter') === 'circle:76.96,11.02,4000');
  check('Geoapify request includes proximity bias', request.searchParams.get('bias') === 'proximity:76.96,11.02');
  check('Geoapify request includes the API key', request.searchParams.get('apiKey') === 'fake-key-for-test');

  check('Returns all valid, deduped, named places with category fallbacks (6)', results.length === 6);
  check('Cafe classified as Food, not Nature', !!results.find(r => r.name === 'Test Cafe' && r.ourCategory.includes('Food') && !r.ourCategory.includes('Nature')));
  check('Forest+park classified as Nature', !!results.find(r => r.name === 'Test Forest Park' && r.ourCategory.includes('Nature')));
  check('Museum classified as Culture/History, not Nature', !!results.find(r => r.name === 'Test Museum' && !r.ourCategory.includes('Nature')));
  check('Supermarket classified as Shopping, not Nature', !!results.find(r => r.name === 'Test Supermarket' && r.ourCategory.includes('Shopping')));
  check('Hotel is classified as Accommodation', results.find(r => r.name === 'Test Hotel')?.ourCategory.includes('Accommodation') === true);
  check('Unrecognized named POI receives a Culture fallback', results.find(r => r.name.includes('Unknown Weird'))?.ourCategory.includes('Culture') === true);
  check('Duplicate place_id was deduped to one entry', results.filter(r => r.name === 'Test Cafe').length === 1);
  check('Source categories are preserved verbatim', !!results.find(r => r.sourceCategories?.includes('catering.cafe')));
  check('Distance is calculated and positive', results.every(r => r.distanceKm >= 0));

  // Input validation
  let threw = false;
  try { await discoverNearby(999, 999, 4000, 'k'); } catch { threw = true; }
  check('Rejects invalid coordinates', threw);

  threw = false;
  try { await discoverNearby(11, 77, -5, 'k'); } catch { threw = true; }
  check('Rejects invalid (negative) radius', threw);

  console.log(`\n${failures === 0 ? '✅ ALL PASSED' : `❌ ${failures} CHECK(S) FAILED`}`);
  process.exit(failures === 0 ? 0 : 1);
}
main();
