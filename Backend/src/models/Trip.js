import mongoose from 'mongoose';

const placeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 300 },
    latitude: { type: Number, required: true, min: -90, max: 90 },
    longitude: { type: Number, required: true, min: -180, max: 180 },
  },
  { _id: false }
);

const lineStringSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['LineString'], required: true },
    coordinates: { type: [[Number]], required: true },
  },
  { _id: false }
);

const routeFactorSchema = new mongoose.Schema(
  { label: String, impact: Number, kind: { type: String, enum: ['positive', 'negative', 'neutral'] } },
  { _id: false }
);

const routeStepSchema = new mongoose.Schema(
  {
    instruction: String,
    distance: Number,
    duration: Number,
    name: String,
    maneuver: { type: { type: String }, modifier: String, location: [Number] },
  },
  { _id: false }
);

const selectedRouteSchema = new mongoose.Schema(
  {
    summary: String,
    geometry: lineStringSchema,
    distance: Number, // metres
    duration: Number, // seconds
    safetyScore: Number,
    riskLevel: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'] },
    factors: [routeFactorSchema],
    recommendation: String,
    riskZoneIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'RiskZone' }],
    steps: [routeStepSchema],
    profile: String,
  },
  { _id: false }
);

const tripSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    from: { type: placeSchema, required: true },
    destination: { type: placeSchema, required: true },
    travelDate: { type: Date, required: true },
    travelers: { type: Number, min: 1, max: 50, default: 1 },
    travelMode: { type: String, enum: ['car', 'bike', 'bus', 'train', 'walk'], default: 'car' },
    routePreference: {
      type: String,
      enum: ['safest', 'fastest', 'shortest', 'avoid-tolls', 'avoid-risk'],
      default: 'safest',
    },
    selectedRoute: selectedRouteSchema,
    distance: Number, // metres
    duration: Number, // seconds
    safetyScore: { type: Number, min: 0, max: 100 },
    weatherSummary: String,
    status: {
      type: String,
      enum: ['planned', 'active', 'completed', 'cancelled'],
      default: 'planned',
      index: true,
    },
    startedAt: Date,
    endedAt: Date,
    summary: {
      locationPoints: Number,
      alertsCount: Number,
      distanceTravelled: Number,
    },
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true }
);

tripSchema.index({ userId: 1, status: 1, travelDate: -1 });
tripSchema.index({ createdAt: -1 });

const Trip = mongoose.model('Trip', tripSchema);
export default Trip;
