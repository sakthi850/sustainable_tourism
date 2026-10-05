import { buildOverpassQuery, buildQueryBatches, classifyOsmTags, discoverNearby, parseOverpassElements, OverpassElement } from '../src/services/overpassService';

let failures = 0;
function check(label: string, condition: boolean) {
  console.log(condition ? 'PASS' : 'FAIL', label);
  if (!condition) failures++;
}

const elements: OverpassElement[] = [
  { type: 'node', id: 1, lat: 11, lon: 77, tags: { name: 'Cafe One', amenity: 'cafe' } },
  { type: 'way', id: 2, center: { lat: 11.001, lon: 77 }, tags: { name: 'City Park', leisure: 'park' } },
  { type: 'relation', id: 3, center: { lat: 11.002, lon: 77 }, tags: { name: 'History Museum', tourism: 'museum' } },
  { type: 'node', id: 4, lat: 11.003, lon: 77, tags: { name: 'Local Shop', shop: 'supermarket' } },
  { type: 'node', id: 5, lat: 11.004, lon: 77, tags: { name: 'Old Fort', historic: 'fort' } },
  { type: 'node', id: 6, lat: 11.005, lon: 77, tags: { amenity: 'restaurant' } },
  { type: 'node', id: 7, lat: 999, lon: 77, tags: { name: 'Bad', natural: 'peak' } },
  { type: 'node', id: 1, lat: 11, lon: 77, tags: { name: 'Cafe One', amenity: 'cafe' } },
  { type: 'node', id: 8, lat: 11.0001, lon: 77, tags: { name: 'Cafe-One', amenity: 'cafe' } },
  { type: 'node', id: 9, lat: 11.006, lon: 77, tags: { name: 'Large Reservoir', natural: 'water' } },
  { type: 'node', id: 10, lat: 11.007, lon: 77, tags: { 'name:en': 'English Name Cafe', amenity: 'cafe' } },
  { type: 'node', id: 11, lat: 11.2, lon: 77, tags: { name: 'Far Park', leisure: 'park' } },
];

async function main() {
  const parsed = parseOverpassElements(elements, 11, 77, 5000);
  check('node coordinates parsed', parsed.some((p) => p.externalId === 'node/1'));
  check('way center parsed', parsed.some((p) => p.externalId === 'way/2'));
  check('relation center parsed', parsed.some((p) => p.externalId === 'relation/3'));
  check('missing name discarded', !parsed.some((p) => p.externalId === 'node/6'));
  check('invalid coordinates discarded', !parsed.some((p) => p.externalId === 'node/7'));
  check('duplicate OSM id removed', parsed.filter((p) => p.externalId === 'node/1').length === 1);
  check('nearby normalized-name duplicate removed', !parsed.some((p) => p.externalId === 'node/8'));
  check('results sorted by distance', parsed.every((p, i) => i === 0 || parsed[i - 1].distanceKm <= p.distanceKm));
  check('restaurant maps to Food', classifyOsmTags({ amenity: 'restaurant' })?.ourCategory.includes('Food') === true);
  check('cafe maps to Food', classifyOsmTags({ amenity: 'cafe' })?.ourCategory.includes('Food') === true);
  check('supported shop maps to Shopping', classifyOsmTags({ shop: 'supermarket' })?.ourCategory.includes('Shopping') === true);
  check('bakery maps to Food', classifyOsmTags({ shop: 'bakery' })?.ourCategory.includes('Food') === true);
  check('regional shop types receive a Shopping fallback', classifyOsmTags({ shop: 'books' })?.ourCategory.includes('Shopping') === true);
  check('park maps to Nature', classifyOsmTags({ leisure: 'park' })?.ourCategory.includes('Nature') === true);
  const museum = classifyOsmTags({ tourism: 'museum' });
  check('museum maps to Culture and History', museum?.ourCategory.includes('Culture') === true && museum.ourCategory.includes('History'));
  check('historic maps to History', classifyOsmTags({ historic: 'fort' })?.ourCategory.includes('History') === true);
  check('regional amenities receive a Culture fallback', classifyOsmTags({ amenity: 'bank' })?.ourCategory.includes('Culture') === true);
  check('named natural features are retained as Nature POIs', classifyOsmTags({ natural: 'water' })?.ourCategory.includes('Nature') === true && parsed.some((p) => p.externalId === 'node/9'));
  check('localized English name is used when name is absent', parsed.some((p) => p.externalId === 'node/10' && p.name === 'English Name Cafe'));
  check('Haversine radius validation removes distant results', !parsed.some((p) => p.externalId === 'node/11'));
  const query = buildOverpassQuery(11, 77, 5000, ['Food']);
  check('Overpass query caps a requested 5 km radius at 3 km', query.includes('(around:3000,11,77)'));
  check('Overpass query keeps the server-side 25 second timeout', query.startsWith('[out:json][timeout:25];'));
  check('query restricts radius and requests centers without an arbitrary output limit', query.includes('around:3000,11,77') && query.endsWith('out center;') && !query.includes('out center 150'));
  check('Food query targets restaurant/cafe amenities and food shops', query.includes('["amenity"~') && query.includes('restaurant') && query.includes('["shop"~') && query.includes('bakery'));
  const natureQuery = buildOverpassQuery(11, 77, 5000, ['Nature']);
  check('Nature query includes regional natural, waterway, leisure, and tourism tags', natureQuery.includes('["leisure"]') && natureQuery.includes('["tourism"~') && natureQuery.includes('["natural"]') && natureQuery.includes('["waterway"]'));
  const allBatches = buildQueryBatches();
  check('All discovery uses independent category batches', allBatches.length === 6 && allBatches.every((batch) => batch.length === 1));
  check('Accommodation has its own discovery batch', allBatches.some((batch) => batch[0] === 'Accommodation'));
  check('query uses nwr selectors so nodes, ways, and relations are returned', query.includes('nwr(around:'));

  let threw = false;
  try { await discoverNearby(91, 77, 5000); } catch { threw = true; }
  check('invalid latitude rejected', threw);
  threw = false;
  try { await discoverNearby(11, 181, 5000); } catch { threw = true; }
  check('invalid longitude rejected', threw);
  threw = false;
  try { await discoverNearby(11, 77, 50001); } catch { threw = true; }
  check('excessive radius rejected', threw);

  const oldFetch = global.fetch;
  process.env.OVERPASS_API_URLS = 'https://test-one.invalid,https://test-two.invalid';
  global.fetch = async () => ({ ok: true, status: 200, json: async () => ({ elements: [] }) } as Response);
  check('zero live results is successful', (await discoverNearby(10.5, 76.5, 1234, 'Food')).places.length === 0);
  process.env.OVERPASS_API_URLS = 'https://partial.invalid';
  let partialCalls = 0;
  global.fetch = async () => {
    partialCalls++;
    return partialCalls === 1
      ? ({ ok: false, status: 503, json: async () => ({}) } as Response)
      : ({ ok: true, status: 200, json: async () => ({ elements: [{ type: 'node', id: 900 + partialCalls, lat: 10.51, lon: 76.51, tags: { name: `Place ${partialCalls}`, leisure: 'park' } }] }) } as Response);
  };
  const partial = await discoverNearby(10.51, 76.51, 1234);
  check('one failed All-category batch does not discard successful batches', partial.warnings.length === 1 && partial.places.length > 0);
  check('partial failure diagnostics preserve category error and successful counts', partial.diagnostics.perCategory.Food?.success === false && partial.diagnostics.perCategory.Nature?.success === true);
  process.env.OVERPASS_API_URLS = 'https://primary.invalid,https://secondary.invalid';
  let fallbackCalls = 0;
  global.fetch = async () => {
    fallbackCalls++;
    return fallbackCalls === 1
      ? ({ ok: false, status: 504, json: async () => ({}) } as Response)
      : ({ ok: true, status: 200, json: async () => ({ elements: [] }) } as Response);
  };
  const fallbackResult = await discoverNearby(10.55, 76.55, 1234, 'Food');
  check('504 falls back sequentially to the secondary endpoint', fallbackCalls === 2 && fallbackResult.endpointUsed === 'https://secondary.invalid');
  process.env.OVERPASS_API_URLS = 'https://rate-one.invalid,https://rate-two.invalid';
  global.fetch = async () => ({ ok: false, status: 429, json: async () => ({}) } as Response);
  threw = false;
  try { await discoverNearby(10.6, 76.6, 1235, 'Food'); } catch (error) { threw = error instanceof Error && error.message.includes('rate limited'); }
  check('HTTP 429 has a clear error', threw);
  process.env.OVERPASS_API_URLS = 'https://fail-one.invalid,https://fail-two.invalid';
  global.fetch = async () => ({ ok: false, status: 503, json: async () => ({}) } as Response);
  threw = false;
  try { await discoverNearby(10.7, 76.7, 1236, 'Food'); } catch (error) { threw = error instanceof Error && error.message.includes('503'); }
  check('HTTP 5xx has a clear error', threw);
  process.env.OVERPASS_API_URLS = 'https://bad-one.invalid,https://bad-two.invalid';
  global.fetch = async () => ({ ok: true, status: 200, json: async () => { throw new Error('bad json'); } } as unknown as Response);
  threw = false;
  try { await discoverNearby(10.8, 76.8, 1237, 'Food'); } catch (error) { threw = error instanceof Error && error.message.includes('malformed'); }
  check('malformed response rejected', threw);
  global.fetch = oldFetch;
  delete process.env.OVERPASS_API_URLS;

  console.log(`${failures === 0 ? 'ALL PASSED' : `${failures} FAILED`}`);
  process.exit(failures ? 1 : 0);
}
main();
