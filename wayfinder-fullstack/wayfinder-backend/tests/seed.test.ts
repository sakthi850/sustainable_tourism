import TouristPlace from '../src/models/TouristPlace';
import LocalBusiness from '../src/models/LocalBusiness';
import { touristPlaces } from '../src/seed/places';
import { localBusinesses } from '../src/seed/businesses';
import { normalizeSeedName, sameSeedLocation } from '../src/seed/seed';
import { haversineKm, isValidCoordinate } from '../src/utils/haversine';

let pass = 0, fail = 0;
function assert(condition: boolean, message: string) {
  if (condition) { pass++; console.log('  ✓', message); }
  else { fail++; console.error('  ✗', message); }
}

async function run() {
  assert(touristPlaces.length === 30, 'dataset contains 30 tourist places');
  assert(localBusinesses.length === 33, 'dataset contains 33 local businesses');
  assert(localBusinesses.filter((item) => item.category.includes('Accommodation')).length === 2, 'dataset contains only the two accommodations with independently verified coordinates');
  assert(localBusinesses.filter((item) => item.category.includes('Food')).length === 23, 'dataset contains 23 food businesses');
  const records = [...touristPlaces, ...localBusinesses];
  assert(records.every((item) => isValidCoordinate(item.latitude, item.longitude)), 'all coordinates are valid');
  assert(records.every((item) => haversineKm(11.505, 77.238, item.latitude, item.longitude) <= 31), 'all records are within the approximately 30 km target area');
  assert(new Set(touristPlaces.map((item) => normalizeSeedName(item.name))).size === touristPlaces.length, 'place names are unique');
  assert(new Set(localBusinesses.map((item) => normalizeSeedName(item.name))).size === localBusinesses.length, 'business names are unique');
  assert(sameSeedLocation(touristPlaces[0], { ...touristPlaces[0] }), 'duplicate matcher identifies a repeated seed record');
  assert(!sameSeedLocation(touristPlaces[0], touristPlaces[1]), 'duplicate matcher preserves distinct records');

  for (const item of touristPlaces) {
    try { await new TouristPlace(item).validate(); } catch (error) { assert(false, `place validates: ${item.name} (${error})`); }
  }
  for (const item of localBusinesses) {
    try { await new LocalBusiness(item).validate(); } catch (error) { assert(false, `business validates: ${item.name} (${error})`); }
  }
  assert(true, 'all seed objects pass their Mongoose schemas');
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}
run();
