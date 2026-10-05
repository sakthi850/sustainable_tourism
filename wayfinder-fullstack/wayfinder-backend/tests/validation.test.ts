process.env.JWT_SECRET = 'test-secret-for-validation-tests-only';
process.env.CORS_ORIGIN = 'http://localhost:5173';

import request from 'supertest';
import { createApp } from '../src/server';

const app = createApp();
let pass = 0, fail = 0;
function assert(cond: boolean, msg: string) {
  if (cond) { pass++; console.log('  ✓', msg); }
  else { fail++; console.log('  ✗ FAILED:', msg); }
}

async function run() {
  console.log('--- Health check ---');
  const health = await request(app).get('/api/health');
  assert(health.status === 200 && health.body.success === true, 'GET /api/health returns 200 + success:true');

  console.log('\n--- 404 handling ---');
  const notFound = await request(app).get('/api/this-route-does-not-exist');
  assert(notFound.status === 404, 'unknown route returns 404, not a crash');

  console.log('\n--- Auth validation (fails before touching the DB) ---');
  let r = await request(app).post('/api/auth/register').send({});
  assert(r.status === 400, 'register with empty body -> 400');
  r = await request(app).post('/api/auth/register').send({ name: 'A', email: 'not-an-email', password: 'longenough123' });
  assert(r.status === 400, 'register with invalid email -> 400');
  r = await request(app).post('/api/auth/register').send({ name: 'A', email: '[email protected]', password: 'short' });
  assert(r.status === 400, 'register with too-short password -> 400');
  r = await request(app).post('/api/auth/login').send({ email: '[email protected]' });
  assert(r.status === 400, 'login with missing password -> 400');
  r = await request(app).get('/api/auth/me');
  assert(r.status === 401, 'GET /api/auth/me with no token -> 401');
  r = await request(app).get('/api/auth/me').set('Authorization', 'Bearer not-a-real-token');
  assert(r.status === 401, 'GET /api/auth/me with garbage token -> 401');

  console.log('\n--- Discovery validation (fails before calling Overpass) ---');
  r = await request(app).get('/api/discovery');
  assert(r.status === 400, 'discovery with no coordinates -> 400');
  r = await request(app).get('/api/discovery?latitude=999&longitude=76.9');
  assert(r.status === 400, 'discovery with out-of-range latitude is rejected before any Overpass call');
  r = await request(app).get('/api/discovery?latitude=11&longitude=76.9&radius=-5');
  assert(r.status === 400, 'discovery with negative radius -> 400');
  r = await request(app).get('/api/discovery?latitude=11&longitude=76.9&radius=50001');
  assert(r.status === 400, 'discovery rejects a radius above 50 km before any Overpass call');

  console.log('\n--- Recommendations validation (fails before touching the DB) ---');
  r = await request(app).get('/api/recommendations');
  assert(r.status === 400, 'recommendations with no coordinates -> 400');
  r = await request(app).get('/api/recommendations?latitude=11&longitude=77&radius=50001');
  assert(r.status === 400, 'recommendations reject a radius above 50 km before touching the DB');
  r = await request(app).get('/api/routing');
  assert(r.status === 400, 'routing with no coordinates -> 400 before external API call');
  r = await request(app).get('/api/reviews?targetType=place&targetId=invalid');
  assert(r.status === 400, 'typed review query rejects an invalid target id before touching the DB');

  console.log('\n--- Places/Businesses admin protection (fails before touching the DB) ---');
  r = await request(app).post('/api/places').send({ name: 'Test' });
  assert(r.status === 401, 'POST /api/places with no auth -> 401');
  r = await request(app).post('/api/businesses').send({ name: 'Test' });
  assert(r.status === 401, 'POST /api/businesses with no auth -> 401');
  r = await request(app).delete('/api/places/507f1f77bcf86cd799439011');
  assert(r.status === 401, 'DELETE /api/places/:id with no auth -> 401');

  console.log('\n--- Reviews/Favorites/Itineraries require auth (fails before touching the DB) ---');
  r = await request(app).post('/api/reviews').send({ targetType: 'place', targetId: 'x', rating: 5, comment: 'x' });
  assert(r.status === 401, 'POST /api/reviews with no auth -> 401');
  r = await request(app).get('/api/favorites');
  assert(r.status === 401, 'GET /api/favorites with no auth -> 401');
  r = await request(app).post('/api/itineraries').send({});
  assert(r.status === 401, 'POST /api/itineraries with no auth -> 401');

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail > 0 ? 1 : 0);
}

run();
