import mongoose from 'mongoose';

const holidaySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    // null = applies company-wide, across all offices.
    office: { type: mongoose.Schema.Types.ObjectId, ref: 'Office', default: null },
  },
  { timestamps: true }
);

holidaySchema.index({ date: 1, office: 1 });

export const Holiday = mongoose.model('Holiday', holidaySchema);
