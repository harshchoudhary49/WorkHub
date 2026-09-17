import dotenv from 'dotenv';
dotenv.config();

// Centralized env loading + validation so the app fails fast with a clear
// error instead of crashing later with a confusing "undefined" bug.
const required = ['MONGO_URI', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];

const missing = required.filter((key) => !process.env[key]);
if (missing.length > 0) {
  // eslint-disable-next-line no-console
  console.error(`Missing required environment variables: ${missing.join(', ')}`);
  console.error('Copy server/.env.example to server/.env and fill in the values.');
  process.exit(1);
}

export const env = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGO_URI,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  attendance: {
    // "HH:mm" 24-hour shift start; check-ins after this + grace count as late.
    standardCheckInTime: process.env.STANDARD_CHECKIN_TIME || '09:30',
    lateGraceMinutes: Number(process.env.LATE_GRACE_MINUTES || 10),
    standardWorkHours: Number(process.env.STANDARD_WORK_HOURS || 9),
    halfDayThresholdHours: Number(process.env.HALF_DAY_THRESHOLD_HOURS || 4),
    // Company-defined attendance target, e.g. 75%. Used to compute "how many
    // more present days you need" on the employee dashboard.
    targetPercentage: Number(process.env.ATTENDANCE_TARGET_PERCENTAGE || 75),
    // 0 = Sunday ... 6 = Saturday (JS Date.getDay() convention).
    weekendDays: (process.env.WEEKEND_DAYS || '0,6').split(',').map(Number),
  },
  leave: {
    // Default annual allocations per type, in days. WFH is set high because
    // it's tracked for approval/visibility but isn't meant to be a scarce
    // resource the way casual/sick/earned leave are.
    allocations: {
      casual: Number(process.env.LEAVE_ALLOCATION_CASUAL || 12),
      sick: Number(process.env.LEAVE_ALLOCATION_SICK || 10),
      earned: Number(process.env.LEAVE_ALLOCATION_EARNED || 15),
      wfh: Number(process.env.LEAVE_ALLOCATION_WFH || 60),
      emergency: Number(process.env.LEAVE_ALLOCATION_EMERGENCY || 5),
    },
  },
};
