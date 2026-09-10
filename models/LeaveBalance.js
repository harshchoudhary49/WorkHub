import mongoose from 'mongoose';

// One document per (employee, year, leave type) - deliberately separate
// from Leave itself so "how many casual days does this person have left"
// is an O(1) lookup instead of summing every Leave document every time.
const leaveBalanceSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    year: { type: Number, required: true },
    type: {
      type: String,
      enum: ['casual', 'sick', 'earned', 'wfh', 'emergency'],
      required: true,
    },
    allocated: { type: Number, required: true, min: 0 },
    used: { type: Number, required: true, min: 0, default: 0 },
  },
  { timestamps: true }
);

leaveBalanceSchema.index({ employee: 1, year: 1, type: 1 }, { unique: true });

// `remaining` is derived, not stored, so it can never drift out of sync
// with allocated/used.
leaveBalanceSchema.virtual('remaining').get(function remaining() {
  return this.allocated - this.used;
});
leaveBalanceSchema.set('toJSON', { virtuals: true });

export const LeaveBalance = mongoose.model('LeaveBalance', leaveBalanceSchema);
