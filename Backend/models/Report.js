import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['Danger Zone Verification', 'Emergency Incident', 'App Feedback', 'Other'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  location: {
    coordinates: [Number] // optional [lng, lat]
  },
  status: {
    type: String,
    enum: ['Pending', 'Reviewed', 'Resolved'],
    default: 'Pending'
  },
  adminNotes: {
    type: String
  }
}, { timestamps: true });

const Report = mongoose.model('Report', reportSchema);
export default Report;
