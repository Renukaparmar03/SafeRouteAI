import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema({
  address: { type: String, required: true },
  coordinates: {
    type: [Number], // [longitude, latitude]
    required: true,
    index: '2dsphere'
  }
});

const tripSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  source: locationSchema,
  destination: locationSchema,
  travelDate: {
    type: Date,
    required: true
  },
  travelMode: {
    type: String,
    enum: ['car', 'bike', 'bus', 'train', 'walking'],
    required: true
  },
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
    default: 'upcoming'
  },
  routeDetails: {
    distance: String,
    duration: String,
    polyline: String // Encoded route path
  },
  safetyScore: {
    type: String,
    enum: ['Low Risk', 'Medium Risk', 'High Risk', 'Safe'],
    default: 'Safe'
  },
  aiInsights: [{
    type: String
  }]
}, { timestamps: true });

const Trip = mongoose.model('Trip', tripSchema);
export default Trip;
