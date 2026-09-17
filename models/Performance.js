import mongoose from 'mongoose';

// One snapshot per (employee, month, year). Objective fields (task/goal/
// attendance-derived) are recomputed fresh every time the snapshot is
// viewed; subjective fields (quality/collaboration) and feedback persist
// once a manager sets them - see performance.service.js `getOrCreate`.
const performanceSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    period: {
      month: { type: Number, required: true, min: 1, max: 12 },
      year: { type: Number, required: true },
    },
    taskCompletionRate: { type: Number, default: null }, // 0-100, null = no tasks that period
    onTimeDeliveryRate: { type: Number, default: null },
    goalsAchievedRate: { type: Number, default: null },
    reliabilityScore: { type: Number, default: null }, // = attendance % for the period
    qualityScore: { type: Number, default: null }, // 0-100, set by a manager
    collaborationScore: { type: Number, default: null }, // 0-100, set by a manager
    contributionScore: { type: Number, default: null }, // weighted average of the above
    workloadLabel: { type: String, enum: ['low', 'balanced', 'high'], default: 'balanced' },
    managerFeedback: [
      {
        author: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
        comment: { type: String, trim: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

performanceSchema.index({ employee: 1, 'period.year': 1, 'period.month': 1 }, { unique: true });

export const Performance = mongoose.model('Performance', performanceSchema);
