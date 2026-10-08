import mongoose from 'mongoose';
import { env } from '../config/env.js';

const locationPointSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true, index: true },
  latitude: { type: Number, required: true, min: -90, max: 90 },
  longitude: { type: Number, required: true, min: -180, max: 180 },
  accuracy: Number,
  speed: Number,
  heading: Number,
  timestamp: { type: Date, default: Date.now },
});

locationPointSchema.index({ tripId: 1, timestamp: 1 });
// Location history is personal data: MongoDB deletes points automatically after the retention window.
locationPointSchema.index({ timestamp: 1 }, { expireAfterSeconds: env.tracking.retentionDays * 24 * 60 * 60 });

const LocationPoint = mongoose.model('LocationPoint', locationPointSchema);
export default LocationPoint;
