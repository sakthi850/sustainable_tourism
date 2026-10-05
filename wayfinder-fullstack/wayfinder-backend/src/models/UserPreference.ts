import { Schema, model, Document, Types } from 'mongoose';

export interface IUserPreference extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId; // ref User, one-to-one
  interests: string[];
  travelMode: 'walking' | 'cycling' | 'driving' | 'public_transport';
  availableTimeMin: number;
  budget: number; // 0 free .. 3 high
  sustainabilityPreference: number; // 0-1
  updatedAt: Date;
}

const userPreferenceSchema = new Schema<IUserPreference>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  interests: { type: [String], default: [] },
  travelMode: { type: String, enum: ['walking', 'cycling', 'driving', 'public_transport'], default: 'walking' },
  availableTimeMin: { type: Number, default: 180, min: 15 },
  budget: { type: Number, default: 3, min: 0, max: 3 },
  sustainabilityPreference: { type: Number, default: 0.5, min: 0, max: 1 },
  updatedAt: { type: Date, default: Date.now },
});

export default model<IUserPreference>('UserPreference', userPreferenceSchema);
