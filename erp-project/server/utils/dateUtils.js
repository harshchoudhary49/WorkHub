import { env } from '../config/env.js';

// Normalizes any Date/string to midnight UTC of that calendar day - the
// canonical form stored in Attendance.date so (employee, date) is a stable
// unique key no matter what time of day an action happened.
export const startOfDay = (input = new Date()) => {
  const d = new Date(input);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

export const isWeekend = (date) => env.attendance.weekendDays.includes(new Date(date).getUTCDay());

export const isSameDay = (a, b) => startOfDay(a).getTime() === startOfDay(b).getTime();

// Every calendar day in [start, end], inclusive, as an array of Date.
export const eachDay = (start, end) => {
  const days = [];
  const cursor = startOfDay(start);
  const last = startOfDay(end);
  while (cursor <= last) {
    days.push(new Date(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
};

export const monthRange = (month, year) => {
  // month is 1-12 for readability at the call site.
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 0)); // day 0 of next month = last day of this month
  return { start, end };
};

// Builds a Date for "today" (or a given date) at the configured standard
// check-in time, e.g. 2026-09-09T09:30:00 local-shift-time - used to
// compute lateness.
export const standardCheckInDateTime = (referenceDate = new Date()) => {
  const [hours, minutes] = env.attendance.standardCheckInTime.split(':').map(Number);
  const d = new Date(referenceDate);
  d.setHours(hours, minutes, 0, 0);
  return d;
};
