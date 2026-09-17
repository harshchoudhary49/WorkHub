import { Employee } from '../models/Employee.js';
import { Department } from '../models/Department.js';
import { Attendance } from '../models/Attendance.js';
import { Leave } from '../models/Leave.js';
import { Task } from '../models/Task.js';
import { Holiday } from '../models/Holiday.js';
import { startOfDay, eachDay } from '../utils/dateUtils.js';

// Org-wide "as of right now" snapshot for the HR/Admin dashboard's top
// cards. Kept as one call so the dashboard doesn't need to fire five
// separate requests just to render its header.
export const getOverview = async () => {
  const today = startOfDay(new Date());

  const activeEmployees = await Employee.find({ status: { $ne: 'inactive' } }).select('_id');
  const totalEmployees = activeEmployees.length;

  const todayRecords = await Attendance.find({ date: today, employee: { $in: activeEmployees.map((e) => e._id) } });
  const byStatus = { present: 0, absent: 0, leave: 0, remote: 0, 'half-day': 0, holiday: 0, weekend: 0 };
  todayRecords.forEach((r) => {
    byStatus[r.status] = (byStatus[r.status] || 0) + 1;
  });
  const notCheckedIn = totalEmployees - todayRecords.length;

  const pendingLeaves = await Leave.countDocuments({ status: 'pending' });
  const overdueTasks = await Task.countDocuments({ status: { $ne: 'COMPLETED' }, dueDate: { $lt: today } });

  const in30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
  const upcomingHolidays = await Holiday.find({ date: { $gte: today, $lte: in30Days } })
    .populate('office', 'name')
    .sort({ date: 1 })
    .limit(5);

  return {
    totalEmployees,
    todayAttendance: { ...byStatus, notCheckedIn },
    pendingLeaves,
    overdueTasks,
    upcomingHolidays,
  };
};

// Daily present/absent/leave/remote counts over the last N days, for a
// trend chart. Reads only Attendance records that actually exist (i.e.
// days that have been through check-in or the end-of-day absentee sweep) -
// a day nobody has processed yet just won't show a bar, which is more
// honest than guessing.
export const getAttendanceTrend = async (days = 14) => {
  const end = startOfDay(new Date());
  const start = startOfDay(new Date(end.getTime() - (days - 1) * 24 * 60 * 60 * 1000));

  const records = await Attendance.find({ date: { $gte: start, $lte: end } }).select('date status');

  const byDate = new Map();
  eachDay(start, end).forEach((d) => {
    byDate.set(d.getTime(), { date: d, present: 0, absent: 0, leave: 0, remote: 0, 'half-day': 0 });
  });

  records.forEach((r) => {
    const bucket = byDate.get(startOfDay(r.date).getTime());
    if (bucket && bucket[r.status] !== undefined) bucket[r.status] += 1;
  });

  return [...byDate.values()];
};

// Task completion rate per department - fetches tasks with just enough
// populated to bucket by department, then reduces in JS (simpler to follow
// than a multi-hop aggregation pipeline, and fine at this scale).
export const getTaskCompletionByDepartment = async () => {
  const tasks = await Task.find()
    .select('status assignee')
    .populate({ path: 'assignee', select: 'department', populate: { path: 'department', select: 'name' } });

  const byDept = new Map();
  tasks.forEach((t) => {
    const dept = t.assignee?.department;
    const key = dept?._id?.toString() || 'unassigned';
    const label = dept?.name || 'No department';
    if (!byDept.has(key)) byDept.set(key, { department: label, total: 0, completed: 0 });
    const bucket = byDept.get(key);
    bucket.total += 1;
    if (t.status === 'COMPLETED') bucket.completed += 1;
  });

  return [...byDept.values()].map((b) => ({
    ...b,
    completionPercentage: b.total ? Math.round((b.completed / b.total) * 1000) / 10 : 0,
  }));
};

export const getHeadcountByDepartment = async () => {
  const departments = await Department.find().select('name');
  const employees = await Employee.find({ status: { $ne: 'inactive' } }).select('department');

  const counts = new Map(departments.map((d) => [d._id.toString(), 0]));
  let unassigned = 0;
  employees.forEach((e) => {
    if (e.department && counts.has(e.department.toString())) {
      counts.set(e.department.toString(), counts.get(e.department.toString()) + 1);
    } else {
      unassigned += 1;
    }
  });

  const result = departments.map((d) => ({ department: d.name, count: counts.get(d._id.toString()) }));
  if (unassigned > 0) result.push({ department: 'Unassigned', count: unassigned });
  return result;
};
