import dotenv from 'dotenv';
dotenv.config();

import mongoose, { Model } from 'mongoose';
import { connectDB } from '../config/db';
import TouristPlace from '../models/TouristPlace';
import LocalBusiness from '../models/LocalBusiness';
import { haversineKm } from '../utils/haversine';
import { allTouristPlaces } from './places';
import { allLocalBusinesses } from './businesses';

type SeedRecord = { name: string; latitude: number; longitude: number };
export type SeedStats = { inserted: number; skipped: number; failed: number };

export function normalizeSeedName(name: string): string {
  return name.normalize('NFKD').toLocaleLowerCase().replace(/[^a-z0-9]/g, '');
}

export function sameSeedLocation(a: SeedRecord, b: SeedRecord): boolean {
  return normalizeSeedName(a.name) === normalizeSeedName(b.name)
    && haversineKm(a.latitude, a.longitude, b.latitude, b.longitude) <= 0.15;
}

async function seedCollection<T extends SeedRecord>(model: Model<any>, records: T[]): Promise<SeedStats> {
  const stats: SeedStats = { inserted: 0, skipped: 0, failed: 0 };
  const existing = await model.find({}, { name: 1, latitude: 1, longitude: 1 }).lean<SeedRecord[]>();
  for (const record of records) {
    if (existing.some((item) => sameSeedLocation(item, record))) { stats.skipped++; continue; }
    try {
      const document = new model(record);
      await document.validate();
      await document.save();
      existing.push(record);
      stats.inserted++;
    } catch (error) {
      stats.failed++;
      const message = error instanceof Error ? error.message.replace(process.env.MONGODB_URI ?? '', '[redacted]') : 'Unknown validation error';
      console.error(`Failed to insert ${record.name}: ${message}`);
    }
  }
  return stats;
}

export async function runSeed(): Promise<{ places: SeedStats; businesses: SeedStats }> {
  console.log('Connecting to MongoDB...');
  await connectDB();
  try {
    const places = await seedCollection(TouristPlace, allTouristPlaces);
    const accommodations = allLocalBusinesses.filter((item) => item.category.includes('Accommodation'));
    const cafesAndBakeries = allLocalBusinesses.filter((item) => item.category.includes('Food')
      && /cafe|bakery|bakes|cake|tea|coffee|falooda/i.test(`${item.name} ${item.description}`));
    const food = allLocalBusinesses.filter((item) => item.category.includes('Food')
      && !cafesAndBakeries.includes(item) && !accommodations.includes(item));
    const otherBusinesses = allLocalBusinesses.filter((item) => !accommodations.includes(item)
      && !cafesAndBakeries.includes(item) && !food.includes(item));
    const businessGroups = [
      { label: 'Accommodation', records: accommodations },
      { label: 'Food', records: food },
      { label: 'Cafes/bakeries', records: cafesAndBakeries },
      { label: 'Other businesses', records: otherBusinesses },
    ];
    const businessGroupStats: Array<{ label: string; count: number; stats: SeedStats }> = [];
    for (const group of businessGroups) {
      businessGroupStats.push({ label: group.label, count: group.records.length, stats: await seedCollection(LocalBusiness, group.records) });
    }
    const businesses = businessGroupStats.reduce<SeedStats>((total, group) => ({
      inserted: total.inserted + group.stats.inserted,
      skipped: total.skipped + group.stats.skipped,
      failed: total.failed + group.stats.failed,
    }), { inserted: 0, skipped: 0, failed: 0 });
    console.log('\nTourist places:');
    console.log(`Inserted: ${places.inserted}\nSkipped: ${places.skipped}\nFailed: ${places.failed}`);
    console.log('\nLocal businesses:');
    console.log(`Inserted: ${businesses.inserted}\nSkipped: ${businesses.skipped}\nFailed: ${businesses.failed}`);
    for (const group of businessGroupStats) {
      console.log(`${group.label} (${group.count} records): inserted ${group.stats.inserted}, skipped ${group.stats.skipped}, failed ${group.stats.failed}`);
    }
    console.log(`\nTotal seeded records: ${places.inserted + businesses.inserted}`);
    console.log('\nMongoDB seed completed successfully.');
    return { places, businesses };
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  runSeed().catch(async (error) => {
    const safeMessage = error instanceof Error ? error.message.replace(process.env.MONGODB_URI ?? '', '[redacted]') : 'MongoDB connection error';
    console.error(`Seed failed: ${safeMessage || 'MongoDB connection error'}`);
    await mongoose.disconnect().catch(() => undefined);
    process.exitCode = 1;
  });
}
