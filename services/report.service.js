import { Employee } from '../models/Employee.js';
import { Attendance } from '../models/Attendance.js';
import { Leave } from '../models/Leave.js';
import { Task } from '../models/Task.js';
import { startOfDay } from '../utils/dateUtils.js';
import { getManagedEmployeeIds } from './employee.service.js';
import { getOrCreateSnapshot } from './performance.service.js';
import { computeTaskStats } from './task.service.js';

// Every report accepts the same base filter shape and resolves it to a
// concrete Employee query - shared here so "manager only sees their team"
// is enforced in exactly one place rather than once per report.
const resolveEmployeeScope = async (viewerUserId, viewerRole, filters) => {
  const query = {};
  if (filters.department) query.department = filters.department;
  if (filters.team) query.team = filters.team;
  if (filters.employee) query._id = filters.employee;
  if (filters.status) query.status = filters.status;

  if (viewerRole === 'manager') {
    const managerEmployee = await Employee.findOne({ user: viewerUserId });
    const managedIds = [...(await getManagedEmployeeIds(managerEmployee._id))];
    // Always intersect with the manager's own team, even if a specific
    // employee was requested - a manager can't pull another team's report
    // just by passing a different employee id.
    query._id = filters.employee && managedIds.includes(filters.employee) ? filters.employee : { $in: managedIds };
  }

  return Employee.find(query).populate('department', 'name').populate('team', 'name');
};

const defaultRange = (filters) => ({
  start: filters.startDate ? startOfDay(filters.startDate) : startOfDay(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
  end: filters.endDate ? startOfDay(filters.endDate) : startOfDay(new Date()),
});

// --- Attendance report ---------------------------------------------------
// One row per employee: raw status counts within the date range. Kept
// simple/countable rather than re-deriving working-day-percentage math -
// that nuance already lives in the live Attendance pages (Phase 4); a
// report is for scanning totals at a glance.
export const getAttendanceReport = async (viewerUserId, viewerRole, filters) => {
  const employees = await resolveEmployeeScope(viewerUserId, viewerRole, filters);
  const { start, end } = defaultRange(filters);

  const records = await Attendance.find({
    employee: { $in: employees.map((e) => e._id) },
    date: { $gte: start, $lte: end },
  });
  const byEmployee = new Map();
  records.forEach((r) => {
    const key = r.employee.toString();
    if (!byEmployee.has(key)) byEmployee.set(key, { present: 0, absent: 0, leave: 0, remote: 0, 'half-day': 0 });
    const bucket = byEmployee.get(key);
    if (bucket[r.status] !== undefined) bucket[r.status] += 1;
  });

  return employees.map((emp) => {
    const counts = byEmployee.get(emp._id.toString()) || { present: 0, absent: 0, leave: 0, remote: 0, 'half-day': 0 };
    const totalRecorded = Object.values(counts).reduce((s, n) => s + n, 0);
    const presentEquivalent = counts.present + counts.remote + counts['half-day'] * 0.5;
    return {
      employeeId: emp.employeeId,
      name: emp.name,
      department: emp.department?.name || '',
      team: emp.team?.name || '',
      present: counts.present,
      remote: counts.remote,
      halfDay: counts['half-day'],
      leave: counts.leave,
      absent: counts.absent,
      recordedDays: totalRecorded,
      attendancePercentage: totalRecorded ? Math.round((presentEquivalent / totalRecorded) * 1000) / 10 : 0,
    };
  });
};

// --- Leave report ----------------------------------------------------
export const getLeaveReport = async (viewerUserId, viewerRole, filters) => {
  const employees = await resolveEmployeeScope(viewerUserId, viewerRole, filters);
  const { start, end } = defaultRange(filters);

  const query = {
    employee: { $in: employees.map((e) => e._id) },
    startDate: { $lte: end },
    endDate: { $gte: start },
  };
  if (filters.status) query.status = filters.status;
  if (filters.type) query.type = filters.type;

  const leaves = await Leave.find(query)
    .populate('employee', 'name employeeId department team')
    .populate({ path: 'employee', populate: [{ path: 'department', select: 'name' }, { path: 'team', select: 'name' }] })
    .populate('approver', 'name')
    .sort({ startDate: -1 });

  return leaves.map((l) => ({
    employeeId: l.employee?.employeeId,
    name: l.employee?.name,
    department: l.employee?.department?.name || '',
    team: l.employee?.team?.name || '',
    type: l.type,
    startDate: l.startDate,
    endDate: l.endDate,
    days: l.days,
    status: l.status,
    approver: l.approver?.name || '',
  }));
};

// --- Employee directory report ----------------------------------------
export const getEmployeeReport = async (viewerUserId, viewerRole, filters) => {
  const employees = await resolveEmployeeScope(viewerUserId, viewerRole, filters);
  return employees.map((emp) => ({
    employeeId: emp.employeeId,
    name: emp.name,
    designation: emp.designation,
    department: emp.department?.name || '',
    team: emp.team?.name || '',
    status: emp.status,
    joiningDate: emp.joiningDate,
    skills: (emp.skills || []).join('; '),
  }));
};

// --- Task report -------------------------------------------------------
export const getTaskReport = async (viewerUserId, viewerRole, filters) => {
  const employees = await resolveEmployeeScope(viewerUserId, viewerRole, filters);
  const { start, end } = defaultRange(filters);

  const query = { assignee: { $in: employees.map((e) => e._id) }, dueDate: { $gte: start, $lte: end } };
  if (filters.status) query.status = filters.status;

  const tasks = await Task.find(query)
    .populate('assignee', 'name employeeId')
    .populate('team', 'name')
    .sort({ dueDate: 1 });

  const today = startOfDay(new Date());
  return tasks.map((t) => ({
    title: t.title,
    assignee: t.assignee?.name,
    employeeId: t.assignee?.employeeId,
    team: t.team?.name || '',
    priority: t.priority,
    status: t.status,
    dueDate: t.dueDate,
    overdue: t.status !== 'COMPLETED' && startOfDay(t.dueDate) < today,
    estimatedHours: t.estimatedHours,
    actualHours: t.actualHours,
  }));
};

// --- Team performance report -------------------------------------------
// Reuses the exact same snapshot logic the live Performance pages use
// (Phase 7), so a report and the on-screen number for the same employee/
// period can never disagree.
export const getPerformanceReport = async (viewerUserId, viewerRole, filters) => {
  const employees = await resolveEmployeeScope(viewerUserId, viewerRole, filters);
  const now = new Date();
  const month = filters.month || now.getMonth() + 1;
  const year = filters.year || now.getFullYear();

  const snapshots = await Promise.all(employees.map((emp) => getOrCreateSnapshot(emp._id, month, year)));

  return employees.map((emp, i) => {
    const s = snapshots[i];
    return {
      employeeId: emp.employeeId,
      name: emp.name,
      department: emp.department?.name || '',
      team: emp.team?.name || '',
      taskCompletionRate: s.taskCompletionRate,
      onTimeDeliveryRate: s.onTimeDeliveryRate,
      goalsAchievedRate: s.goalsAchievedRate,
      reliabilityScore: s.reliabilityScore,
      qualityScore: s.qualityScore,
      collaborationScore: s.collaborationScore,
      contributionScore: s.contributionScore,
      workloadLabel: s.workloadLabel,
    };
  });
};

// --- Workload report -----------------------------------------------------
// Reuses computeTaskStats from Phase 6 - the same neutral low/balanced/
// high labeling shown everywhere else, not a report-specific reinvention.
export const getWorkloadReport = async (viewerUserId, viewerRole, filters) => {
  const employees = await resolveEmployeeScope(viewerUserId, viewerRole, filters);
  const tasks = await Task.find({ assignee: { $in: employees.map((e) => e._id) } }).select('assignee status dueDate');

  const byEmployee = new Map();
  tasks.forEach((t) => {
    const key = t.assignee.toString();
    if (!byEmployee.has(key)) byEmployee.set(key, []);
    byEmployee.get(key).push(t);
  });

  return employees.map((emp) => {
    const stats = computeTaskStats(byEmployee.get(emp._id.toString()) || []);
    return {
      employeeId: emp.employeeId,
      name: emp.name,
      department: emp.department?.name || '',
      team: emp.team?.name || '',
      totalTasks: stats.total,
      activeTasks: stats.active,
      completedTasks: stats.completed,
      overdueTasks: stats.overdue,
      completionPercentage: stats.completionPercentage,
      workloadLabel: stats.workloadLabel,
    };
  });
};
