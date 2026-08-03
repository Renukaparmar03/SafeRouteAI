import mongoose from 'mongoose';

const emergencyContactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  relation: { type: String }
});

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  avatar: {
    type: String
  },
  homeLocation: {
    address: String,
    coordinates: {
      type: [Number], // [longitude, latitude]
      index: '2dsphere'
    }
  },
  emergencyContacts: [emergencyContactSchema],
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Ensure at least email or phone is provided
userSchema.pre('validate', function() {
  if (!this.email && !this.phone) {
    throw new Error('Either email or phone must be provided.');
  }
});

const User = mongoose.model('User', userSchema);
export default User;
