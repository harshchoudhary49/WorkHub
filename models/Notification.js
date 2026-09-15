import mongoose from 'mongoose';

// Minimal notification model, expanded in Phase 8 with more types (task
// deadlines, announcements, recognition, etc.) and possibly real-time
// delivery. Built now because leave status changes need somewhere to land.
const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    type: { type: String, required: true }, // e.g. 'leave-approved', 'leave-rejected'
    title: { type: String, required: true, trim: true },
    message: { type: String, trim: true, default: '' },
    link: { type: String, trim: true, default: '' }, // frontend route to deep-link to
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

export const Notification = mongoose.model('Notification', notificationSchema);
