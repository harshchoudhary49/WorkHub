import mongoose from 'mongoose';

const teamSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    manager: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }],
  },
  { timestamps: true }
);

teamSchema.index({ name: 1, department: 1 }, { unique: true });

export const Team = mongoose.model('Team', teamSchema);
