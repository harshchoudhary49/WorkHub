import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    office: { type: mongoose.Schema.Types.ObjectId, ref: 'Office', required: true },
    head: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null },
  },
  { timestamps: true }
);

// A department name should be unique within its office, not globally -
// two different offices can each have an "Engineering" department.
departmentSchema.index({ name: 1, office: 1 }, { unique: true });

export const Department = mongoose.model('Department', departmentSchema);
