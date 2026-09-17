import { Leave } from '../models/Leave.js';
import { LeaveBalance } from '../models/LeaveBalance.js';
import { Employee } from '../models/Employee.js';
import { Attendance } from '../models/Attendance.js';
import { Team } from '../models/Team.js';
import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';
import { getHolidayDateSet } from './holiday.service.js';
import { notify } from './notification.service.js';
import { startOfDay, isWeekend, eachDay } from '../utils/dateUtils.js';

const findEmployeeOrThrow = async (userId) => {
  const employee = await Employee.findOne({ user: userId });
  if (!employee) throw ApiError.notFound('Employee profile not found');
  return employee;
};

// Working days (weekends + company holidays excluded) within [start, end] -
// this is what a leave request actually "costs" and what gets marked on
// Attendance once approved.
const workingDaysInRange = async (officeId, start, end) => {
  const holidaySet = await getHolidayDateSet(officeId, start, end);
  return eachDay(start, end).filter((day) => !isWeekend(day) && !holidaySet.has(day.getTime()));
};

const ensureBalance = async (employeeId, year, type) => {
  let balance = await LeaveBalance.findOne({ employee: employeeId, year, type });
  if (!balance) {
    balance = await LeaveBalance.create({
      employee: employeeId,
      year,
      type,
      allocated: env.leave.allocations[type],
      used: 0,
    });
  }
  return balance;
};

// Pending requests reserve balance too, so two overlapping pending requests
// for the same bucket can't both later be approved past the allocation.
const getPendingDays = async (employeeId, type, year) => {
  const pending = await Leave.find({
    employee: employeeId,
    type,
    status: 'pending',
    startDate: { $gte: new Date(Date.UTC(year, 0, 1)), $lte: new Date(Date.UTC(year, 11, 31)) },
  }).select('days');
  return pending.reduce((sum, l) => sum + l.days, 0);
};

// --- Apply -------------------------------------------------------------

export const applyForLeave = async (userId, { type, startDate, endDate, reason }) => {
  const employee = await findEmployeeOrThrow(userId);
  const start = startOfDay(startDate);
  const end = startOfDay(endDate);
  const today = startOfDay(new Date());

  if (start < today) {
    throw ApiError.badRequest('Cannot apply for leave that starts in the past');
  }

  const workingDays = await workingDaysInRange(employee.office, start, end);
  if (workingDays.length === 0) {
    throw ApiError.badRequest('The selected range has no working days (all weekends/holidays)');
  }
  const days = workingDays.length;

  const overlapping = await Leave.exists({
    employee: employee._id,
    status: { $in: ['pending', 'approved'] },
    startDate: { $lte: end },
    endDate: { $gte: start },
  });
  if (overlapping) {
    throw ApiError.conflict('You already have a leave request that overlaps these dates');
  }

  const year = start.getUTCFullYear();
  if (type !== 'wfh') {
    const balance = await ensureBalance(employee._id, year, type);
    const pendingDays = await getPendingDays(employee._id, type, year);
    const remaining = balance.allocated - balance.used - pendingDays;
    if (remaining < days) {
      throw ApiError.badRequest(
        `Insufficient ${type} leave balance: ${remaining} day(s) remaining, ${days} requested`
      );
    }
  }

  const leave = await Leave.create({
    employee: employee._id,
    type,
    startDate: start,
    endDate: end,
    days,
    reason: reason || '',
  });

  // Best-effort: let the direct manager know a request is waiting. HR/Admin
  // see it regardless via the org-wide leave list, so no broadcast needed.
  if (employee.manager) {
    await notify(employee.manager, {
      type: 'leave-applied',
      title: `${employee.name} requested ${type} leave`,
      message: `${days} day(s), ${start.toLocaleDateString()} - ${end.toLocaleDateString()}`,
      link: '/manager/leaves',
    });
  }

  return leave;
};

// --- Approve / reject / cancel ------------------------------------------

const assertCanDecide = async (approverUserId, approverRole, targetEmployeeId) => {
  if (approverRole === 'hr' || approverRole === 'admin') return;
  if (approverRole === 'manager') {
    const managerEmployee = await Employee.findOne({ user: approverUserId });
    const targetEmployee = await Employee.findById(targetEmployeeId);
    if (managerEmployee && targetEmployee && String(targetEmployee.manager) === String(managerEmployee._id)) {
      return;
    }
  }
  throw ApiError.forbidden('You are not authorized to decide on this leave request');
};

// Marks each working day of an approved leave on Attendance, so the two
// systems never disagree about why someone wasn't at their desk.
const syncAttendanceForLeave = async (leave, employee) => {
  const workingDays = await workingDaysInRange(employee.office, leave.startDate, leave.endDate);
  const status = leave.type === 'wfh' ? 'remote' : 'leave';
  await Promise.all(
    workingDays.map((day) =>
      Attendance.findOneAndUpdate(
        { employee: employee._id, date: day },
        { employee: employee._id, date: day, status, markedBy: 'system' },
        { upsert: true, setDefaultsOnInsert: true }
      )
    )
  );
};

// Undoes the Attendance side-effect for days that haven't happened yet -
// past days of an already-approved leave stay as "leave" for history.
const revertFutureAttendanceForLeave = async (leave, employee) => {
  const today = startOfDay(new Date());
  const revertStart = leave.startDate > today ? leave.startDate : today;
  if (revertStart > leave.endDate) return;
  await Attendance.deleteMany({
    employee: employee._id,
    date: { $gte: revertStart, $lte: leave.endDate },
    markedBy: 'system',
    status: { $in: ['leave', 'remote'] },
  });
};

export const approveLeave = async (approverUserId, approverRole, leaveId) => {
  const leave = await Leave.findById(leaveId);
  if (!leave) throw ApiError.notFound('Leave request not found');
  if (leave.status !== 'pending') throw ApiError.conflict('Only pending requests can be approved');

  await assertCanDecide(approverUserId, approverRole, leave.employee);

  const employee = await Employee.findById(leave.employee);
  const approverEmployee = await Employee.findOne({ user: approverUserId });

  leave.status = 'approved';
  leave.approver = approverEmployee?._id || null;
  leave.decidedAt = new Date();
  await leave.save();

  if (leave.type !== 'wfh') {
    const year = leave.startDate.getUTCFullYear();
    const balance = await ensureBalance(employee._id, year, leave.type);
    balance.used += leave.days;
    await balance.save();
  }

  await syncAttendanceForLeave(leave, employee);

  await notify(employee._id, {
    type: 'leave-approved',
    title: 'Your leave request was approved',
    message: `${leave.type} leave, ${leave.startDate.toLocaleDateString()} - ${leave.endDate.toLocaleDateString()}`,
    link: '/leaves',
  });

  return leave;
};

export const rejectLeave = async (approverUserId, approverRole, leaveId, { reason } = {}) => {
  const leave = await Leave.findById(leaveId);
  if (!leave) throw ApiError.notFound('Leave request not found');
  if (leave.status !== 'pending') throw ApiError.conflict('Only pending requests can be rejected');

  await assertCanDecide(approverUserId, approverRole, leave.employee);

  const approverEmployee = await Employee.findOne({ user: approverUserId });

  leave.status = 'rejected';
  leave.approver = approverEmployee?._id || null;
  leave.decisionReason = reason || '';
  leave.decidedAt = new Date();
  await leave.save();

  await notify(leave.employee, {
    type: 'leave-rejected',
    title: 'Your leave request was rejected',
    message: reason || `${leave.type} leave, ${leave.startDate.toLocaleDateString()} - ${leave.endDate.toLocaleDateString()}`,
    link: '/leaves',
  });

  return leave;
};

export const cancelLeave = async (userId, leaveId) => {
  const employee = await findEmployeeOrThrow(userId);
  const leave = await Leave.findById(leaveId);
  if (!leave) throw ApiError.notFound('Leave request not found');
  if (String(leave.employee) !== String(employee._id)) {
    throw ApiError.forbidden('You can only cancel your own leave requests');
  }
  if (['cancelled', 'rejected'].includes(leave.status)) {
    throw ApiError.conflict('This request is already closed');
  }
  const today = startOfDay(new Date());
  if (leave.endDate < today) {
    throw ApiError.badRequest('Cannot cancel a leave that has already ended');
  }

  if (leave.status === 'approved') {
    if (leave.type !== 'wfh') {
      const year = leave.startDate.getUTCFullYear();
      const balance = await ensureBalance(employee._id, year, leave.type);
      balance.used = Math.max(0, balance.used - leave.days);
      await balance.save();
    }
    await revertFutureAttendanceForLeave(leave, employee);
  }

  leave.status = 'cancelled';
  await leave.save();
  return leave;
};

// --- Reads ---------------------------------------------------------------

const LEAVE_POPULATE = [
  { path: 'employee', select: 'name employeeId department team' },
  { path: 'approver', select: 'name employeeId' },
];

export const listMyLeaves = async (userId, filter = {}) => {
  const employee = await findEmployeeOrThrow(userId);
  const query = { employee: employee._id, ...filter };
  return Leave.find(query).populate(LEAVE_POPULATE).sort({ createdAt: -1 });
};

export const listTeamLeaves = async (managerUserId, filter = {}) => {
  const managerEmployee = await findEmployeeOrThrow(managerUserId);
  const teams = await Team.find({ manager: managerEmployee._id }).select('members');
  const memberIds = [...new Set(teams.flatMap((t) => t.members.map((m) => m.toString())))];

  return Leave.find({ employee: { $in: memberIds }, ...filter })
    .populate(LEAVE_POPULATE)
    .sort({ createdAt: -1 });
};

export const listAllLeaves = (filter = {}) =>
  Leave.find(filter).populate(LEAVE_POPULATE).sort({ createdAt: -1 });

export const getMyBalances = async (userId) => {
  const employee = await findEmployeeOrThrow(userId);
  const year = new Date().getFullYear();

  const types = Object.keys(env.leave.allocations);
  const balances = await Promise.all(
    types.map(async (type) => {
      const balance = await ensureBalance(employee._id, year, type);
      const pending = await getPendingDays(employee._id, type, year);
      return {
        type,
        allocated: balance.allocated,
        used: balance.used,
        pending,
        remaining: balance.allocated - balance.used - pending,
      };
    })
  );

  return balances;
};
