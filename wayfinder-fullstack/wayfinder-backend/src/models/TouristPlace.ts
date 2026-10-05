import { Schema, model, Document, Types } from 'mongoose';

export interface ITouristPlace extends Document {
  _id: Types.ObjectId;
  name: string;
  category: string[];
  description: string;
  latitude: number;
  longitude: number;
  address?: string;
  openTime: string | null;   // "HH:MM", null when not reliably published
  closeTime: string | null;  // "HH:MM", null when not reliably published
  visitDurationMin: number;
  costLevel: number | null;  // 0 free .. 3 high; null means unknown
  rating: number | null;
  ratingCount: number;
  sustainability: number | null; // 0-1; null means no verified claim
  localRelevance: number; // 0-1
  popularity: number;     // 0-1 — used by Hidden Gems
  images: string[];
  verified: boolean;
  source: 'seed' | 'admin' | 'geoapify';
  createdAt: Date;
}

const touristPlaceSchema = new Schema<ITouristPlace>({
  name: { type: String, required: true, trim: true },
  category: { type: [String], required: true, default: [] },
  description: { type: String, default: '' },
  latitude: { type: Number, required: true, min: -90, max: 90 },
  longitude: { type: Number, required: true, min: -180, max: 180 },
  address: { type: String },
  openTime: { type: String, default: null },
  closeTime: { type: String, default: null },
  visitDurationMin: { type: Number, default: 45, min: 5 },
  costLevel: { type: Number, default: null, min: 0, max: 3 },
  rating: { type: Number, default: null, min: 0, max: 5 },
  ratingCount: { type: Number, default: 0, min: 0 },
  sustainability: { type: Number, default: null, min: 0, max: 1 },
  localRelevance: { type: Number, default: 0.5, min: 0, max: 1 },
  popularity: { type: Number, default: 0.5, min: 0, max: 1 },
  images: { type: [String], default: [] },
  verified: { type: Boolean, default: true },
  source: { type: String, enum: ['seed', 'admin', 'geoapify'], default: 'admin' },
  createdAt: { type: Date, default: Date.now },
});

touristPlaceSchema.index({ latitude: 1, longitude: 1 });

export default model<ITouristPlace>('TouristPlace', touristPlaceSchema);
