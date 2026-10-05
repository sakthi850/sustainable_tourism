import mongoose from 'mongoose';
import dns from 'node:dns';

export async function connectDB(): Promise<void> {
  // Some networks (school/corporate Wi-Fi, certain ISPs) refuse DNS SRV lookups, which the
  // mongodb+srv:// connection string needs — there's also a known Node-on-Windows DNS resolver
  // quirk that causes the same symptom. Forcing a public resolver here sidesteps both without
  // requiring any OS-level network changes. Must run before mongoose.connect() is called.
  dns.setServers(['8.8.8.8', '1.1.1.1']);

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI is not set. Copy .env.example to .env and fill in your Atlas connection string.');
    process.exit(1);
  }
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
    console.log('✅ MongoDB connected:', mongoose.connection.host);
  } catch (err) {
    console.error('❌ MongoDB connection failed. Check MONGODB_URI, your Atlas IP allowlist (Network Access), and your credentials.');
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  }
}
