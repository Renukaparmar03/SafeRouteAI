import mongoose from 'mongoose';

export const NOTIFICATION_TYPES = ['RISK_ALERT', 'TRIP_UPDATE', 'WEATHER_ALERT', 'ADMIN_ALERT', 'SOS', 'SYSTEM'];

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, maxlength: 200 },
    message: { type: String, required: true, maxlength: 2000 },
    type: { type: String, enum: NOTIFICATION_TYPES, default: 'SYSTEM' },
    severity: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'LOW' },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
    read: { type: Boolean, default: false },
    delivered: { type: Boolean, default: false }, // pushed via FCM
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
notificationSchema.index({ createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
