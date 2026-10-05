import { Schema, model, Document, Types } from 'mongoose';

export interface IRecommendationFeedback extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  targetType: 'place' | 'business';
  targetId: Types.ObjectId;
  scadeScoreAtFeedback: number; // the score the item had when the user reacted — useful for later tuning
  useful: boolean;
  createdAt: Date;
}

const recommendationFeedbackSchema = new Schema<IRecommendationFeedback>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  targetType: { type: String, enum: ['place', 'business'], required: true },
  targetId: { type: Schema.Types.ObjectId, required: true, refPath: 'targetType' },
  scadeScoreAtFeedback: { type: Number, required: true },
  useful: { type: Boolean, required: true },
  createdAt: { type: Date, default: Date.now },
});

// One feedback per user per target — voting again updates rather than duplicates
recommendationFeedbackSchema.index({ user: 1, targetType: 1, targetId: 1 }, { unique: true });

export default model<IRecommendationFeedback>('RecommendationFeedback', recommendationFeedbackSchema);
