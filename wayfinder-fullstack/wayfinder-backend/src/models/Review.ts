import { Schema, model, Document, Types } from 'mongoose';

export interface IReview extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;          // ref User
  targetType: 'place' | 'business';
  targetId: Types.ObjectId;      // ref TouristPlace or LocalBusiness
  rating: number;
  comment: string;
  helpfulUpVotes: Types.ObjectId[];   // user ids who voted helpful — prevents duplicate voting
  helpfulDownVotes: Types.ObjectId[]; // user ids who voted not-helpful
  createdAt: Date;
}

const reviewSchema = new Schema<IReview>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  targetType: { type: String, enum: ['place', 'business'], required: true },
  targetId: { type: Schema.Types.ObjectId, required: true, refPath: 'targetType' },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true, trim: true, maxlength: 2000 },
  helpfulUpVotes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  helpfulDownVotes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now },
});

reviewSchema.index({ targetType: 1, targetId: 1 });

export default model<IReview>('Review', reviewSchema);
