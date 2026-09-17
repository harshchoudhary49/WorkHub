import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED', 'BLOCKED'],
      default: 'TODO',
    },
    dueDate: { type: Date, required: true },
    estimatedHours: { type: Number, default: 0, min: 0 },
    actualHours: { type: Number, default: 0, min: 0 },
    completedAt: { type: Date, default: null },
    // Set when a deadline-approaching reminder has been sent, so the sweep
    // in notification.service.js doesn't re-notify the same task every run.
    reminderSentAt: { type: Date, default: null },
  },
  { timestamps: true }
);

taskSchema.index({ assignee: 1, status: 1 });
taskSchema.index({ team: 1 });
taskSchema.index({ dueDate: 1 });

export const Task = mongoose.model('Task', taskSchema);
