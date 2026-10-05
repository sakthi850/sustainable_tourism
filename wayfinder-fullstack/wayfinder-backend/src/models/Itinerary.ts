import { Schema, model, Document, Types } from 'mongoose';

export interface IItineraryStop {
  targetType: 'place' | 'business';
  targetId: Types.ObjectId;
  name: string;         // denormalized snapshot so the itinerary still reads fine if the source item changes later
  arrivalOffsetMin: number;
  visitDurationMin: number;
  travelMinFromPrev: number;
}

export interface IItinerary extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  title: string;
  availableTimeMin: number;
  travelMode: string;
  budget: number;
  interests: string[];
  startLat: number;
  startLng: number;
  stops: IItineraryStop[];
  totalMinutesUsed: number;
  createdAt: Date;
}

const stopSchema = new Schema<IItineraryStop>({
  targetType: { type: String, enum: ['place', 'business'], required: true },
  targetId: { type: Schema.Types.ObjectId, required: true },
  name: { type: String, required: true },
  arrivalOffsetMin: { type: Number, required: true },
  visitDurationMin: { type: Number, required: true },
  travelMinFromPrev: { type: Number, required: true },
}, { _id: false });

const itinerarySchema = new Schema<IItinerary>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, default: 'My itinerary' },
  availableTimeMin: { type: Number, required: true },
  travelMode: { type: String, required: true },
  budget: { type: Number, required: true },
  interests: { type: [String], default: [] },
  startLat: { type: Number, required: true },
  startLng: { type: Number, required: true },
  stops: { type: [stopSchema], default: [] },
  totalMinutesUsed: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

export default model<IItinerary>('Itinerary', itinerarySchema);
