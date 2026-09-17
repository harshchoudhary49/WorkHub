import mongoose from 'mongoose';

// Organizational profile. 1:1 with User via the `user` ref.
// Department/Team/Office/manager refs are optional here because in Phase 2
// (auth only) those collections don't exist yet - HR/Admin will assign them
// in Phase 3. Keeping the full shape now means Phase 3 only adds data, not
// schema changes.
const employeeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    employeeId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    designation: {
      type: String,
      trim: true,
      default: '',
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
    },
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      default: null,
    },
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
    },
    office: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Office',
      default: null,
    },
    floor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Floor',
      default: null,
    },
    desk: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Desk',
      default: null,
    },
    joiningDate: {
      type: Date,
      default: Date.now,
    },
    skills: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'on-leave'],
      default: 'active',
    },
    avatarUrl: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

employeeSchema.index({ employeeId: 1 }, { unique: true });
employeeSchema.index({ department: 1, team: 1 });

export const Employee = mongoose.model('Employee', employeeSchema);
