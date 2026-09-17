import mongoose from 'mongoose';

const goalSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    progress: { type: Number, min: 0, max: 100, default: 0 },
    status: {
      type: String,
      enum: ['not-started', 'in-progress', 'completed', 'cancelled'],
      default: 'not-started',
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    dueDate: { type: Date, default: null },
    reviewComment: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

goalSchema.index({ employee: 1, status: 1 });

export const Goal = mongoose.model('Goal', goalSchema);
