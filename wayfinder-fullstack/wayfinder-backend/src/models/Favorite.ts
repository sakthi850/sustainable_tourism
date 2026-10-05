import { Schema, model, Document, Types } from 'mongoose';

export interface IFavorite extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  targetType: 'place' | 'business';
  targetId: Types.ObjectId;
  createdAt: Date;
}

const favoriteSchema = new Schema<IFavorite>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  targetType: { type: String, enum: ['place', 'business'], required: true },
  targetId: { type: Schema.Types.ObjectId, required: true },
  createdAt: { type: Date, default: Date.now },
});

favoriteSchema.index({ user: 1, targetType: 1, targetId: 1 }, { unique: true }); // can't favorite the same thing twice

export default model<IFavorite>('Favorite', favoriteSchema);
