import { Attendance } from '../models/Attendance.js';
import { Employee } from '../models/Employee.js';
import { Team } from '../models/Team.js';
import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';
import { getHolidayDateSet } from './holiday.service.js';
import {
  startOfDay,
  isWeekend,
  isSameDay,
  eachDay,
  monthRange,
  standardCheckInDateTime,
} from '../utils/dateUtils.js';
import { getDistanceInMeters } from '../utils/locationUtils.js';

const round2 = (n) => Math.round(n * 100) / 100;

const findEmployeeOrThrow = async (userId) => {
  const employee = await Employee.findOne({ user: userId });
  if (!employee) throw ApiError.notFound('Employee profile not found');
  return employee;
};

// --- Check in / check out -------------------------------------------------

export const checkIn = async (userId, { mode = 'office', lat, lng } = {}) => {
  const employee = await findEmployeeOrThrow(userId);

  if (mode === 'office') {
    if (lat == null || lng == null) {
      throw ApiError.badRequest('Location is required for office check-in. Please enable location services.');
    }

    const distance = getDistanceInMeters(
      lat,
      lng,
      env.attendance.officeLatitude,
      env.attendance.officeLongitude
    );
    if (distance > env.attendance.geofenceRadiusMeters) {
      throw ApiError.badRequest(
        `You are too far from the office to check in (Distance: ${Math.round(distance)}m, Limit: ${env.attendance.geofenceRadiusMeters}m)`
      );
    }
  }

  const today = startOfDay(new Date());
  const now = new Date();

  const existing = await Attendance.findOne({ employee: employee._id, date: today });
  if (existing?.checkIn) {
    throw ApiError.conflict('You have already checked in today');
  }

  const threshold = new Date(standardCheckInDateTime(now).getTime() + env.attendance.lateGraceMinutes * 60000);
  const lateByMinutes = now > threshold ? Math.round((now - threshold) / 60000) : 0;

  const status = mode === 'remote' ? 'remote' : 'present';

  const attendance = existing
    ? Object.assign(existing, { checkIn: now, checkInLocation: { lat, lng }, mode, status, lateByMinutes, markedBy: 'self' })
    : new Attendance({
        employee: employee._id,
        date: today,
        checkIn: now,
        checkInLocation: { lat, lng },
        mode,
        status,
        lateByMinutes,
        markedBy: 'self',
      });

  await attendance.save();
  return attendance;
};

export const checkOut = async (userId, { notes, lat, lng } = {}) => {
  const employee = await findEmployeeOrThrow(userId);
  const today = startOfDay(new Date());
  const now = new Date();

  const attendance = await Attendance.findOne({ employee: employee._id, date: today });
  if (!attendance || !attendance.checkIn) {
    throw ApiError.badRequest('You need to check in before checking out');
  }
  if (attendance.checkOut) {
    throw ApiError.conflict('You have already checked out today');
  }

  if (attendance.mode === 'office') {
    if (lat == null || lng == null) {
      throw ApiError.badRequest('Location is required for office check-out. Please enable location services.');
    }
    const distance = getDistanceInMeters(
      lat,
      lng,
      env.attendance.officeLatitude,
      env.attendance.officeLongitude
    );
    if (distance > env.attendance.geofenceRadiusMeters) {
      throw ApiError.badRequest(
        `You are too far from the office to check out (Distance: ${Math.round(distance)}m, Limit: ${env.attendance.geofenceRadiusMeters}m)`
      );
    }
  }

  const workingHours = round2((now - attendance.checkIn) / 3600000);
  const overtimeMinutes = Math.max(0, Math.round((workingHours - env.attendance.standardWorkHours) * 60));
  const isHalfDay = workingHours < env.attendance.halfDayThresholdHours;

  attendance.checkOut = now;
  attendance.checkOutLocation = { lat, lng };
  attendance.workingHours = workingHours;
  attendance.overtimeMinutes = overtimeMinutes;
  attendance.status = isHalfDay ? 'half-day' : attendance.mode === 'remote' ? 'remote' : 'present';
  if (notes) attendance.notes = notes;

  await attendance.save();
  return attendance;
};

// --- Stats / percentage calculation ---------------------------------------

// Pure function, unit-testable in isolation from the DB: given how many
// "present-equivalent" days someone has out of how many working days have
// elapsed, works out the current percentage and how many more consecutive
// present working days would be needed to hit the target.
export const calculateAttendanceStats = ({
  presentEquivalent,
  workingDays,
  targetPercentage = env.attendance.targetPercentage,
}) => {
  const percentage = workingDays === 0 ? 0 : (presentEquivalent / workingDays) * 100;

  let additionalDaysNeeded = 0;
  if (workingDays > 0 && percentage < targetPercentage) {
    const targetFraction = targetPercentage / 100;
    if (targetFraction >= 1) {
      // Mathematically unreachable again once a single day has been missed.
      additionalDaysNeeded = null;
    } else {
      const raw = (targetFraction * workingDays - presentEquivalent) / (1 - targetFraction);
      additionalDaysNeeded = Math.max(0, Math.ceil(raw));
    }
  }

  return {
    percentage: round2(percentage),
    targetPercentage,
    additionalDaysNeeded,
  };
};

const PRESENT_WEIGHT = { present: 1, remote: 1, 'half-day': 0.5 };

// Builds the full attendance picture for one employee over [start, end]:
// the raw records, the list of working days that have elapsed, and the
// percentage/target-gap stats. Used by both "my attendance" and
// "HR viewing someone's attendance" - the only difference is authorization,
// which lives in the controller, not here.
export const getEmployeeAttendanceSummary = async (employeeId, { month, year } = {}) => {
  const employee = await Employee.findById(employeeId);
  if (!employee) throw ApiError.notFound('Employee not found');

  const now = new Date();
  const targetMonth = month || now.getMonth() + 1;
  const targetYear = year || now.getFullYear();
  const { start, end: monthEnd } = monthRange(targetMonth, targetYear);

  // Don't count future days, and don't count days before the employee joined.
  const today = startOfDay(now);
  const effectiveEnd = monthEnd > today ? today : monthEnd;
  const effectiveStart = employee.joiningDate && startOfDay(employee.joiningDate) > start
    ? startOfDay(employee.joiningDate)
    : start;

  const records = await Attendance.find({
    employee: employeeId,
    date: { $gte: start, $lte: monthEnd },
  }).sort({ date: 1 });

  const recordByDate = new Map(records.map((r) => [startOfDay(r.date).getTime(), r]));

  let workingDays = 0;
  let presentEquivalent = 0;
  const breakdown = { present: 0, absent: 0, 'half-day': 0, leave: 0, holiday: 0, weekend: 0, remote: 0 };

  if (effectiveStart <= effectiveEnd) {
    const holidaySet = await getHolidayDateSet(employee.office, effectiveStart, effectiveEnd);

    for (const day of eachDay(effectiveStart, effectiveEnd)) {
      const key = day.getTime();
      const record = recordByDate.get(key);

      if (isWeekend(day) && !record) {
        breakdown.weekend += 1;
        continue;
      }
      if (holidaySet.has(key) && !record) {
        breakdown.holiday += 1;
        continue;
      }

      // It's a working day - it counts toward the denominator whether or
      // not the employee has a record for it yet (no record = not yet
      // marked, treated as not-present until `markAbsentees` or check-in
      // fills it in).
      workingDays += 1;
      const status = record?.status;
      if (status) breakdown[status] = (breakdown[status] || 0) + 1;
      if (status && PRESENT_WEIGHT[status]) presentEquivalent += PRESENT_WEIGHT[status];
    }
  }

  const stats = calculateAttendanceStats({ presentEquivalent, workingDays });

  return {
    employeeId,
    month: targetMonth,
    year: targetYear,
    records,
    breakdown,
    workingDaysElapsed: workingDays,
    presentEquivalent,
    ...stats,
  };
};

// --- HR/Admin bulk + manual operations -------------------------------------

// Marks anyone active without an attendance record for `date` as absent.
// Skips weekends/holidays. Intended to be run once per day - manually via
// this endpoint for now; Phase 12 can wire it to a real scheduler (e.g.
// node-cron) so it runs automatically at end-of-day instead.
export const markAbsentees = async (date = new Date()) => {
  const day = startOfDay(date);
  if (isWeekend(day)) return { marked: 0, reason: 'Weekend - nothing to mark' };

  const activeEmployees = await Employee.find({ status: { $ne: 'inactive' } }).select('office');
  const holidaySet = await getHolidayDateSet(null, day, day);
  if (holidaySet.has(day.getTime())) {
    return { marked: 0, reason: 'Company holiday - nothing to mark' };
  }

  const existing = await Attendance.find({ date: day }).select('employee');
  const alreadyMarked = new Set(existing.map((r) => r.employee.toString()));

  const toMark = activeEmployees.filter((e) => !alreadyMarked.has(e._id.toString()));
  if (toMark.length === 0) return { marked: 0, reason: 'Everyone already has a record' };

  await Attendance.insertMany(
    toMark.map((e) => ({
      employee: e._id,
      date: day,
      status: 'absent',
      markedBy: 'system',
    }))
  );

  return { marked: toMark.length };
};

// HR/Admin correcting or backfilling a single record.
export const manualMark = async (payload) => {
  const { employee, date, status, checkIn, checkOut, notes } = payload;
  const day = startOfDay(date);

  let workingHours = 0;
  let overtimeMinutes = 0;
  if (checkIn && checkOut) {
    workingHours = round2((new Date(checkOut) - new Date(checkIn)) / 3600000);
    overtimeMinutes = Math.max(0, Math.round((workingHours - env.attendance.standardWorkHours) * 60));
  }

  const attendance = await Attendance.findOneAndUpdate(
    { employee, date: day },
    {
      employee,
      date: day,
      status,
      checkIn: checkIn || null,
      checkOut: checkOut || null,
      workingHours,
      overtimeMinutes,
      notes: notes || '',
      markedBy: 'hr-admin',
    },
    { upsert: true, new: true, runValidators: true }
  );

  return attendance;
};

// --- Manager: team roster for a given day -----------------------------------

export const getTeamAttendanceForDate = async (managerUserId, date = new Date()) => {
  const managerEmployee = await findEmployeeOrThrow(managerUserId);
  const teams = await Team.find({ manager: managerEmployee._id }).populate(
    'members',
    'name employeeId designation status'
  );

  const memberMap = new Map();
  teams.forEach((team) => team.members.forEach((m) => memberMap.set(m._id.toString(), m)));
  const members = Array.from(memberMap.values());

  const day = startOfDay(date);
  const isToday = isSameDay(day, new Date());
  const records = await Attendance.find({
    employee: { $in: members.map((m) => m._id) },
    date: day,
  });
  const recordByEmployee = new Map(records.map((r) => [r.employee.toString(), r]));

  const weekend = isWeekend(day);
  const holidaySet = weekend ? new Set() : await getHolidayDateSet(null, day, day);
  const isHoliday = holidaySet.has(day.getTime());

  const roster = members.map((member) => {
    const record = recordByEmployee.get(member._id.toString());
    let status;
    if (record) status = record.status;
    else if (weekend) status = 'weekend';
    else if (isHoliday) status = 'holiday';
    else if (isToday) status = 'not-checked-in';
    else status = 'absent';

    return {
      employee: member,
      status,
      checkIn: record?.checkIn || null,
      checkOut: record?.checkOut || null,
      workingHours: record?.workingHours || 0,
    };
  });

  return { date: day, roster };
};
