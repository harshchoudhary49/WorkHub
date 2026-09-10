import mongoose from 'mongoose';

// Auth-only model. Organizational/profile data lives on Employee.
// Kept separate so login/password/security concerns never mix with
// HR data that HR/Admin edit through completely different flows.
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false, // never returned by default on queries
    },
    role: {
      type: String,
      enum: ['employee', 'manager', 'hr', 'admin'],
      required: true,
      default: 'employee',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
    // Store only a hash of the current valid refresh token, so a leaked DB
    // dump can't be used to forge sessions, and we can invalidate on logout.
    refreshTokenHash: {
      type: String,
      select: false,
    },
  },
  { timestamps: true }
);

userSchema.index({ email: 1 }, { unique: true });

export const User = mongoose.model('User', userSchema);
