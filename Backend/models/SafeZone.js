import mongoose from 'mongoose';

const safeZoneSchema = new mongoose.Schema({
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
  description: {
    type: String,
    required: true
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Usually an admin
  }
}, { timestamps: true });

safeZoneSchema.index({ location: '2dsphere' });

const SafeZone = mongoose.model('SafeZone', safeZoneSchema);
export default SafeZone;
