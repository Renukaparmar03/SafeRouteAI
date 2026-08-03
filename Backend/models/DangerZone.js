import mongoose from 'mongoose';

const dangerZoneSchema = new mongoose.Schema({
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  radius: {
    type: Number, // in meters
    required: true,
    default: 500
  },
  severity: {
    type: String,
    enum: ['High', 'Medium'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Usually an admin
  }
}, { timestamps: true });

dangerZoneSchema.index({ location: '2dsphere' });

const DangerZone = mongoose.model('DangerZone', dangerZoneSchema);
export default DangerZone;
