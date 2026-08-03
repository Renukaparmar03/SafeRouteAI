import mongoose from 'mongoose';

const emergencyServiceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['Hospital', 'Police Station', 'Pharmacy', 'Fire Station', 'Other'],
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
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
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

emergencyServiceSchema.index({ location: '2dsphere' });

const EmergencyService = mongoose.model('EmergencyService', emergencyServiceSchema);
export default EmergencyService;
