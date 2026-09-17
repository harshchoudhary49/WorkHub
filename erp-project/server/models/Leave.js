import mongoose from 'mongoose';

const leaveSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    type: {
      type: String,
      enum: ['casual', 'sick', 'earned', 'wfh', 'emergency'],
      required: true,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    // Working days requested (weekends/holidays excluded) - computed at
    // apply-time and stored so balance math never has to recompute it later.
    days: { type: Number, required: true, min: 0.5 },
    reason: { type: String, trim: true, default: '' },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled'],
      default: 'pending',
    },
    approver: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null },
    decisionReason: { type: String, trim: true, default: '' },
    decidedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

leaveSchema.index({ employee: 1, status: 1 });
leaveSchema.index({ startDate: 1, endDate: 1 });

export const Leave = mongoose.model('Leave', leaveSchema);
