import { Performance } from '../models/Performance.js';
import { Employee } from '../models/Employee.js';
import { Team } from '../models/Team.js';
import { Task } from '../models/Task.js';
import { Goal } from '../models/Goal.js';
import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';
import { monthRange } from '../utils/dateUtils.js';
import { getEmployeeAttendanceSummary } from './attendance.service.js';
import { computeTaskStats } from './task.service.js';
import { notify } from './notification.service.js';

const findEmployeeOrThrow = async (userId) => {
  const employee = await Employee.findOne({ user: userId });
  if (!employee) throw ApiError.notFound('Employee profile not found');
  return employee;
};

const getManagedEmployeeIds = async (managerEmployeeId) => {
  const teams = await Team.find({ manager: managerEmployeeId }).select('members');
  return new Set(teams.flatMap((t) => t.members.map((m) => m.toString())));
};

const assertManagerOwns = async (managerEmployeeId, employeeId) => {
  const managed = await getManagedEmployeeIds(managerEmployeeId);
  if (!managed.has(employeeId.toString())) {
    throw ApiError.forbidden('You can only view/review performance for your own team members');
  }
};

// Drops any factor with no data for the period and renormalizes the
// remaining weights, so a new hire with zero goals this month isn't
// penalized for a metric that simply doesn't apply yet.
const weightedAverage = (parts) => {
  const usable = parts.filter((p) => p.value !== null && p.value !== undefined);
  if (usable.length === 0) return null;
  const totalWeight = usable.reduce((sum, p) => sum + p.weight, 0);
  const weightedSum = usable.reduce((sum, p) => sum + p.value * p.weight, 0);
  return Math.round((weightedSum / totalWeight) * 10) / 10;
};

// Recomputes everything derived from Task/Goal/Attendance for one period.
// Pure with respect to the database read pattern - always safe to re-run,
// never mutates anything itself (the caller decides what to persist).
const computeObjectiveMetrics = async (employee, month, year) => {
  const { start, end } = monthRange(month, year);

  const tasksDue = await Task.find({ assignee: employee._id, dueDate: { $gte: start, $lte: end } });
  const completedTasks = tasksDue.filter((t) => t.status === 'COMPLETED');
  const onTimeTasks = completedTasks.filter((t) => t.completedAt && t.completedAt <= t.dueDate);

  const taskCompletionRate = tasksDue.length ? Math.round((completedTasks.length / tasksDue.length) * 1000) / 10 : null;
  const onTimeDeliveryRate = completedTasks.length
    ? Math.round((onTimeTasks.length / completedTasks.length) * 1000) / 10
    : null;

  const goalsDue = await Goal.find({ employee: employee._id, dueDate: { $gte: start, $lte: end } });
  const completedGoals = goalsDue.filter((g) => g.status === 'completed');
  const goalsAchievedRate = goalsDue.length
    ? Math.round((completedGoals.length / goalsDue.length) * 1000) / 10
    : null;

  let reliabilityScore = null;
  const attendanceSummary = await getEmployeeAttendanceSummary(employee._id, { month, year });
  if (attendanceSummary.workingDaysElapsed > 0) reliabilityScore = attendanceSummary.percentage;

  // Workload is a live snapshot of current (not period-specific) active
  // tasks - informational context alongside the score, not part of it.
  const currentTasks = await Task.find({ assignee: employee._id, status: { $ne: 'COMPLETED' } });
  const { workloadLabel } = computeTaskStats(currentTasks);

  return { taskCompletionRate, onTimeDeliveryRate, goalsAchievedRate, reliabilityScore, workloadLabel };
};

const recomputeContributionScore = (doc) => {
  const { weights } = env.performance;
  doc.contributionScore = weightedAverage([
    { value: doc.taskCompletionRate, weight: weights.taskCompletionRate },
    { value: doc.onTimeDeliveryRate, weight: weights.onTimeDeliveryRate },
    { value: doc.qualityScore, weight: weights.qualityScore },
    { value: doc.collaborationScore, weight: weights.collaborationScore },
    { value: doc.goalsAchievedRate, weight: weights.goalsAchievedRate },
    { value: doc.reliabilityScore, weight: weights.reliabilityScore },
  ]);
};

// Fetches (or creates) the snapshot for a period, always refreshing the
// objective/computed fields but preserving any manager-entered subjective
// scores and feedback history already on the document.
export const getOrCreateSnapshot = async (employeeId, month, year) => {
  const employee = await Employee.findById(employeeId);
  if (!employee) throw ApiError.notFound('Employee not found');

  const objective = await computeObjectiveMetrics(employee, month, year);

  let doc = await Performance.findOne({ employee: employeeId, 'period.month': month, 'period.year': year });
  if (!doc) {
    doc = new Performance({ employee: employeeId, period: { month, year } });
  }

  doc.taskCompletionRate = objective.taskCompletionRate;
  doc.onTimeDeliveryRate = objective.onTimeDeliveryRate;
  doc.goalsAchievedRate = objective.goalsAchievedRate;
  doc.reliabilityScore = objective.reliabilityScore;
  doc.workloadLabel = objective.workloadLabel;

  recomputeContributionScore(doc);
  await doc.save();

  return Performance.findById(doc._id)
    .populate('employee', 'name employeeId')
    .populate('managerFeedback.author', 'name employeeId');
};

export const addManagerFeedback = async (
  approverUserId,
  approverRole,
  employeeId,
  { month, year, qualityScore, collaborationScore, comment }
) => {
  if (approverRole === 'manager') {
    const managerEmployee = await findEmployeeOrThrow(approverUserId);
    await assertManagerOwns(managerEmployee._id, employeeId);
  }

  const now = new Date();
  const targetMonth = month || now.getMonth() + 1;
  const targetYear = year || now.getFullYear();

  const doc = await getOrCreateSnapshot(employeeId, targetMonth, targetYear);

  if (qualityScore !== undefined) doc.qualityScore = qualityScore;
  if (collaborationScore !== undefined) doc.collaborationScore = collaborationScore;

  if (comment) {
    const approverEmployee = await Employee.findOne({ user: approverUserId });
    doc.managerFeedback.push({ author: approverEmployee?._id, comment, createdAt: new Date() });
  }

  recomputeContributionScore(doc);
  await doc.save();

  await notify(employeeId, {
    type: 'performance-feedback',
    title: 'New performance feedback',
    message: comment || 'Your manager updated your performance scores',
    link: '/performance',
  });

  return Performance.findById(doc._id)
    .populate('employee', 'name employeeId')
    .populate('managerFeedback.author', 'name employeeId');
};

// --- Reads ---------------------------------------------------------------

export const getMyPerformance = async (userId, month, year) => {
  const employee = await findEmployeeOrThrow(userId);
  const now = new Date();
  return getOrCreateSnapshot(employee._id, month || now.getMonth() + 1, year || now.getFullYear());
};

export const getMyHistory = async (userId, limit = 12) => {
  const employee = await findEmployeeOrThrow(userId);
  return Performance.find({ employee: employee._id })
    .sort({ 'period.year': -1, 'period.month': -1 })
    .limit(limit);
};

export const getEmployeePerformance = async (
  viewerUserId,
  viewerRole,
  employeeId,
  month,
  year
) => {
  if (viewerRole === 'manager') {
    const managerEmployee = await findEmployeeOrThrow(viewerUserId);
    await assertManagerOwns(managerEmployee._id, employeeId);
  }
  const now = new Date();
  return getOrCreateSnapshot(employeeId, month || now.getMonth() + 1, year || now.getFullYear());
};

export const getTeamPerformance = async (managerUserId, month, year) => {
  const managerEmployee = await findEmployeeOrThrow(managerUserId);
  const memberIds = [...(await getManagedEmployeeIds(managerEmployee._id))];
  const members = await Employee.find({ _id: { $in: memberIds } }).select('name employeeId');

  const now = new Date();
  const targetMonth = month || now.getMonth() + 1;
  const targetYear = year || now.getFullYear();

  const snapshots = await Promise.all(
    members.map((m) => getOrCreateSnapshot(m._id, targetMonth, targetYear))
  );

  const scored = snapshots.filter((s) => s.contributionScore !== null);
  const teamAverage = scored.length
    ? Math.round((scored.reduce((sum, s) => sum + s.contributionScore, 0) / scored.length) * 10) / 10
    : null;

  return { period: { month: targetMonth, year: targetYear }, teamAverage, snapshots };
};
