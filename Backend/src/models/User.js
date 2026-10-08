import mongoose from 'mongoose';

const notificationPreferencesSchema = new mongoose.Schema(
  {
    push: { type: Boolean, default: true },
    riskAlerts: { type: Boolean, default: true },
    tripUpdates: { type: Boolean, default: true },
    weatherAlerts: { type: Boolean, default: true },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, unique: true, sparse: true, trim: true, lowercase: true, maxlength: 120 },
    phone: { type: String, unique: true, sparse: true, trim: true, maxlength: 20 },
    passwordHash: { type: String, required: true, select: false },
    profileImage: { type: String, trim: true, maxlength: 500 },
    role: { type: String, enum: ['user', 'admin'], default: 'user', index: true },
    // FCM registration tokens, one per browser/device (capped in the controller).
    notificationTokens: { type: [String], default: [], select: false },
    notificationPreferences: { type: notificationPreferencesSchema, default: () => ({}) },
    isActive: { type: Boolean, default: true },
    lastLoginAt: Date,
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

userSchema.virtual('emergencyContacts', {
  ref: 'EmergencyContact',
  localField: '_id',
  foreignField: 'userId',
  options: { sort: { priority: 1 } },
});

userSchema.pre('validate', function requireContact() {
  if (!this.email && !this.phone) {
    this.invalidate('email', 'Either email or phone must be provided.');
  }
});

userSchema.index({ createdAt: -1 });

userSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id.toString(),
    name: this.name,
    email: this.email || null,
    phone: this.phone || null,
    profileImage: this.profileImage || null,
    role: this.role,
    notificationPreferences: this.notificationPreferences,
    isActive: this.isActive,
    createdAt: this.createdAt,
  };
};

const User = mongoose.model('User', userSchema);
export default User;
