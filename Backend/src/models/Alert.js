import mongoose from 'mongoose';

export const ALERT_TYPES = ['RISK_ZONE', 'ROUTE_DEVIATION', 'WEATHER', 'SOS', 'ADMIN', 'TRIP'];

const alertSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', index: true },
    type: { type: String, enum: ALERT_TYPES, required: true },
    title: { type: String, required: true, maxlength: 200 },
    message: { type: String, required: true, maxlength: 2000 },
    severity: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'MEDIUM' },
    latitude: Number,
    longitude: Number,
    riskZoneId: { type: mongoose.Schema.Types.ObjectId, ref: 'RiskZone' },
    // Lifecycle, mainly used for SOS events.
    status: { type: String, enum: ['active', 'resolved', 'cancelled'], default: 'active' },
    resolvedAt: Date,
    meta: { type: mongoose.Schema.Types.Mixed },
    read: { type: Boolean, default: false },
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true }
);

alertSchema.index({ createdAt: -1 });
alertSchema.index({ userId: 1, riskZoneId: 1, type: 1, createdAt: -1 });
alertSchema.index({ type: 1, status: 1, createdAt: -1 });

const Alert = mongoose.model('Alert', alertSchema);
export default Alert;
