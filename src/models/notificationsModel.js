import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  message: { type: String, required: true },
  type: { type: String, enum: ['info', 'warning', 'error', 'support'], default: 'info' },
  isRead: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now },
  userRole: { type: String, default: 'admin' },
  productId: { type: String }, // Optional: if linked to a device
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'users' } // Refers to user who sent it
});

export default mongoose.model('Notification', notificationSchema);
