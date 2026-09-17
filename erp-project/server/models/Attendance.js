import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    // Always stored as midnight UTC of the calendar day this record is for,
    // so (employee, date) can be a reliable unique key regardless of what
    // time check-in/check-out happened.
    date: { type: Date, required: true },
    checkIn: { type: Date, default: null },
    checkInLocation: {
      lat: { type: Number },
      lng: { type: Number }
    },
    checkOut: { type: Date, default: null },
    checkOutLocation: {
      lat: { type: Number },
      lng: { type: Number }
    },
    workingHours: { type: Number, default: 0 }, // decimal hours, e.g. 8.25
    lateByMinutes: { type: Number, default: 0 },
    overtimeMinutes: { type: Number, default: 0 },
    mode: { type: String, enum: ['office', 'remote'], default: 'office' },
    status: {
      type: String,
      enum: ['present', 'absent', 'half-day', 'leave', 'holiday', 'weekend', 'remote'],
      required: true,
      default: 'present',
    },
    // Set by the leave-approval flow in Phase 5, or manually by HR/Admin.
    markedBy: { type: String, enum: ['self', 'system', 'hr-admin'], default: 'self' },
    notes: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

export const Attendance = mongoose.model('Attendance', attendanceSchema);
