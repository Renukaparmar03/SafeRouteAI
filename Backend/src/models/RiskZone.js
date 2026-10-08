import mongoose from 'mongoose';

const geometrySchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['Polygon', 'MultiPolygon'], required: true },
    coordinates: { type: Array, required: true },
  },
  { _id: false }
);

const riskZoneSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 150 },
    description: { type: String, trim: true, maxlength: 1000, default: '' },
    riskLevel: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], required: true, index: true },
    geometry: { type: geometrySchema, required: true },
    center: {
      latitude: { type: Number, required: true, min: -90, max: 90 },
      longitude: { type: Number, required: true, min: -180, max: 180 },
    },
    radius: { type: Number, min: 0 }, // metres, when the zone was created as a circle
    // When the zone applies: always, only at night, or only during the day.
    activeHours: { type: String, enum: ['ALWAYS', 'NIGHT', 'DAY'], default: 'ALWAYS' },
    sourceType: { type: String, enum: ['OFFICIAL', 'ADMIN', 'COMMUNITY', 'DEMO'], required: true },
    sourceName: { type: String, trim: true, maxlength: 200, default: '' },
    confidence: { type: Number, min: 0, max: 1, default: 0.5 },
    active: { type: Boolean, default: true, index: true },
    validFrom: Date,
    validUntil: Date,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

riskZoneSchema.index({ geometry: '2dsphere' });
riskZoneSchema.index({ createdAt: -1 });

/** Filter for zones that are currently in force. */
riskZoneSchema.statics.activeFilter = function activeFilter(now = new Date()) {
  return {
    active: true,
    $and: [
      { $or: [{ validFrom: null }, { validFrom: { $lte: now } }] },
      { $or: [{ validUntil: null }, { validUntil: { $gte: now } }] },
    ],
  };
};

riskZoneSchema.methods.toFeature = function toFeature(extra = {}) {
  return {
    type: 'Feature',
    id: this._id.toString(),
    geometry: this.geometry,
    properties: {
      id: this._id.toString(),
      name: this.name,
      description: this.description,
      riskLevel: this.riskLevel,
      activeHours: this.activeHours,
      sourceType: this.sourceType,
      sourceName: this.sourceName,
      confidence: this.confidence,
      isDemo: this.sourceType === 'DEMO',
      center: this.center,
      radius: this.radius,
      active: this.active,
      validFrom: this.validFrom,
      validUntil: this.validUntil,
      updatedAt: this.updatedAt,
      ...extra,
    },
  };
};

const RiskZone = mongoose.model('RiskZone', riskZoneSchema);
export default RiskZone;
