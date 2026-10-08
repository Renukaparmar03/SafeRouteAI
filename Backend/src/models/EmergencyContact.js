import mongoose from 'mongoose';

const emergencyContactSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    phone: { type: String, required: true, trim: true, maxlength: 20 },
    relationship: { type: String, trim: true, maxlength: 40, default: '' },
    priority: { type: Number, min: 1, max: 10, default: 1 },
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const EmergencyContact = mongoose.model('EmergencyContact', emergencyContactSchema);
export default EmergencyContact;
