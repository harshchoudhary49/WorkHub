import { Task } from '../models/Task.js';
import { Employee } from '../models/Employee.js';
import { Team } from '../models/Team.js';
import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';
import { startOfDay } from '../utils/dateUtils.js';
import { notify } from './notification.service.js';

const findEmployeeOrThrow = async (userId) => {
  const employee = await Employee.findOne({ user: userId });
  if (!employee) throw ApiError.notFound('Employee profile not found');
  return employee;
};

// Every employee id a manager can act on - anyone on a team they manage.
// Used to scope task creation/editing without requiring Employee.manager
// to be set explicitly (Team.manager + membership is the source of truth).
const getManagedEmployeeIds = async (managerEmployeeId) => {
  const teams = await Team.find({ manager: managerEmployeeId }).select('members');
  return new Set(teams.flatMap((t) => t.members.map((m) => m.toString())));
};

const assertManagerOwns = async (managerEmployeeId, employeeId) => {
  const managed = await getManagedEmployeeIds(managerEmployeeId);
  if (!managed.has(employeeId.toString())) {
    throw ApiError.forbidden('You can only manage tasks for your own team members');
  }
};

// --- Create / edit ---------------------------------------------------------

export const createTask = async (userId, role, payload) => {
  const assignerEmployee = await findEmployeeOrThrow(userId);

  if (role === 'manager') {
    await assertManagerOwns(assignerEmployee._id, payload.assignee);
  }
  // hr/admin may assign to anyone - no additional scope check.

  const assignee = await Employee.findById(payload.assignee);
  if (!assignee) throw ApiError.notFound('Assignee not found');

  const task = await Task.create({
    ...payload,
    team: payload.team || assignee.team || null,
    assignedBy: assignerEmployee._id,
  });

  await notify(assignee._id, {
    type: 'task-assigned',
    title: `New task: ${task.title}`,
    message: `Due ${new Date(task.dueDate).toLocaleDateString()}`,
    link: '/tasks',
  });

  return task;
};

// Manager/HR/Admin full edit, scoped for managers to their own team.
export const updateTask = async (userId, role, taskId, payload) => {
  const task = await Task.findById(taskId);
  if (!task) throw ApiError.notFound('Task not found');

  if (role === 'manager') {
    const managerEmployee = await findEmployeeOrThrow(userId);
    await assertManagerOwns(managerEmployee._id, task.assignee);
  }

  Object.assign(task, payload);
  applyCompletionSideEffect(task, payload.status);
  await task.save();
  return task;
};

// Kept narrow on purpose: the employee changing their own task's status
// (and optionally logging hours) shouldn't be able to touch title, due
// date, priority, or reassign it.
export const updateOwnTaskStatus = async (userId, taskId, { status, actualHours }) => {
  const employee = await findEmployeeOrThrow(userId);
  const task = await Task.findById(taskId);
  if (!task) throw ApiError.notFound('Task not found');
  if (String(task.assignee) !== String(employee._id)) {
    throw ApiError.forbidden('You can only update your own tasks');
  }

  task.status = status;
  if (actualHours !== undefined) task.actualHours = actualHours;
  applyCompletionSideEffect(task, status);
  await task.save();

  await notify(task.assignedBy, {
    type: 'task-status-changed',
    title: `${employee.name} moved "${task.title}" to ${status.replace('_', ' ')}`,
    link: '/manager/tasks',
  });

  return task;
};

const applyCompletionSideEffect = (task, newStatus) => {
  if (!newStatus) return;
  if (newStatus === 'COMPLETED' && !task.completedAt) task.completedAt = new Date();
  if (newStatus !== 'COMPLETED') task.completedAt = null;
};

export const deleteTask = async (userId, role, taskId) => {
  const task = await Task.findById(taskId);
  if (!task) throw ApiError.notFound('Task not found');

  if (role === 'manager') {
    const managerEmployee = await findEmployeeOrThrow(userId);
    await assertManagerOwns(managerEmployee._id, task.assignee);
  }

  await Task.findByIdAndDelete(taskId);
};

// --- Stats -----------------------------------------------------------------

// Pure function: given a list of plain task objects (status/dueDate),
// returns completion %, overdue count, active count, and a neutral
// workload label. Isolated from the DB so it's easy to reason about/test.
export const computeTaskStats = (tasks) => {
  const total = tasks.length;
  const today = startOfDay(new Date());

  const completed = tasks.filter((t) => t.status === 'COMPLETED').length;
  const overdue = tasks.filter(
    (t) => t.status !== 'COMPLETED' && startOfDay(t.dueDate) < today
  ).length;
  const active = total - completed;

  let workloadLabel = 'balanced';
  if (active <= env.tasks.workloadLowMax) workloadLabel = 'low';
  else if (active >= env.tasks.workloadHighMin) workloadLabel = 'high';

  return {
    total,
    completed,
    active,
    overdue,
    completionPercentage: total === 0 ? 0 : Math.round((completed / total) * 1000) / 10,
    workloadLabel,
  };
};

// --- Reads -------------------------------------------------------------

const TASK_POPULATE = [
  { path: 'assignee', select: 'name employeeId' },
  { path: 'assignedBy', select: 'name employeeId' },
  { path: 'team', select: 'name' },
];

const applyOverdueFilter = (tasks, overdueParam) => {
  if (overdueParam === undefined) return tasks;
  const today = startOfDay(new Date());
  const wantOverdue = overdueParam === 'true';
  return tasks.filter((t) => {
    const isOverdue = t.status !== 'COMPLETED' && startOfDay(t.dueDate) < today;
    return isOverdue === wantOverdue;
  });
};

export const listMyTasks = async (userId, filter = {}) => {
  const employee = await findEmployeeOrThrow(userId);
  const query = { assignee: employee._id };
  if (filter.status) query.status = filter.status;
  if (filter.priority) query.priority = filter.priority;

  const tasks = await Task.find(query).populate(TASK_POPULATE).sort({ dueDate: 1 });
  const filtered = applyOverdueFilter(tasks, filter.overdue);
  return { tasks: filtered, stats: computeTaskStats(tasks) };
};

// Manager's team view: per-member workload plus the raw task list, so the
// same endpoint powers both a workload dashboard and a task board.
export const listTeamTasks = async (managerUserId, filter = {}) => {
  const managerEmployee = await findEmployeeOrThrow(managerUserId);
  const teams = await Team.find({ manager: managerEmployee._id }).populate(
    'members',
    'name employeeId'
  );
  const members = [...new Map(teams.flatMap((t) => t.members).map((m) => [m._id.toString(), m])).values()];

  const query = { assignee: { $in: members.map((m) => m._id) } };
  if (filter.status) query.status = filter.status;
  if (filter.priority) query.priority = filter.priority;
  if (filter.employee) query.assignee = filter.employee;

  const tasks = await Task.find(query).populate(TASK_POPULATE).sort({ dueDate: 1 });
  const filtered = applyOverdueFilter(tasks, filter.overdue);

  const workload = members.map((member) => {
    const memberTasks = tasks.filter((t) => String(t.assignee._id) === String(member._id));
    return { employee: member, ...computeTaskStats(memberTasks) };
  });

  return { tasks: filtered, teamStats: computeTaskStats(tasks), workload };
};

export const listAllTasks = async (filter = {}) => {
  const query = {};
  if (filter.status) query.status = filter.status;
  if (filter.priority) query.priority = filter.priority;
  if (filter.employee) query.assignee = filter.employee;
  if (filter.team) query.team = filter.team;

  const tasks = await Task.find(query).populate(TASK_POPULATE).sort({ dueDate: 1 });
  const filtered = applyOverdueFilter(tasks, filter.overdue);
  return { tasks: filtered, stats: computeTaskStats(tasks) };
};
