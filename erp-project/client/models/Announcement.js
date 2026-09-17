import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['company', 'holiday', 'policy', 'event', 'notice'],
      default: 'notice',
    },
    audience: {
      scope: { type: String, enum: ['company', 'department', 'team'], required: true },
      // refId is the Department/Team id when scope isn't 'company', else null.
      refId: { type: mongoose.Schema.Types.ObjectId, default: null },
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    publishedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

announcementSchema.index({ 'audience.scope': 1, 'audience.refId': 1 });

export const Announcement = mongoose.model('Announcement', announcementSchema);
