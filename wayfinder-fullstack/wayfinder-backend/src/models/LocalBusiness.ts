import { Schema, model, Document, Types } from 'mongoose';

export interface ILocalBusiness extends Document {
  _id: Types.ObjectId;
  name: string;
  category: string[];
  description: string;
  latitude: number;
  longitude: number;
  address?: string;
  phone?: string;
  website?: string;
  openTime: string | null;
  closeTime: string | null;
  costLevel: number | null;
  rating: number | null;
  ratingCount: number;
  sustainability: number | null;
  localRelevance: number;
  popularity: number;
  verified: boolean; // per spec §23 — admin-controlled verification badge
  createdAt: Date;
}

const localBusinessSchema = new Schema<ILocalBusiness>({
  name: { type: String, required: true, trim: true },
  category: { type: [String], required: true, default: [] },
  description: { type: String, default: '' },
  latitude: { type: Number, required: true, min: -90, max: 90 },
  longitude: { type: Number, required: true, min: -180, max: 180 },
  address: { type: String },
  phone: { type: String },
  website: { type: String },
  openTime: { type: String, default: null },
  closeTime: { type: String, default: null },
  costLevel: { type: Number, default: null, min: 0, max: 3 },
  rating: { type: Number, default: null, min: 0, max: 5 },
  ratingCount: { type: Number, default: 0, min: 0 },
  sustainability: { type: Number, default: null, min: 0, max: 1 },
  localRelevance: { type: Number, default: 0.6, min: 0, max: 1 },
  popularity: { type: Number, default: 0.3, min: 0, max: 1 },
  verified: { type: Boolean, default: false }, // businesses start unverified until an admin checks them
  createdAt: { type: Date, default: Date.now },
});

localBusinessSchema.index({ latitude: 1, longitude: 1 });

export default model<ILocalBusiness>('LocalBusiness', localBusinessSchema);
