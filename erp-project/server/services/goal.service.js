import { Goal } from '../models/Goal.js';
import { Employee } from '../models/Employee.js';
import { Team } from '../models/Team.js';
import { ApiError } from '../utils/ApiError.js';
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
    throw ApiError.forbidden('You can only manage goals for your own team members');
  }
};

const progressToStatus = (progress) => {
  if (progress >= 100) return 'completed';
  if (progress > 0) return 'in-progress';
  return 'not-started';
};

// --- Create ------------------------------------------------------------

export const createGoal = async (userId, role, payload) => {
  const creator = await findEmployeeOrThrow(userId);

  let targetEmployeeId = creator._id;
  if (role === 'employee') {
    // Employees can only create goals for themselves - any `employee` field
    // in the payload is ignored rather than trusted.
    targetEmployeeId = creator._id;
  } else if (role === 'manager') {
    targetEmployeeId = payload.employee || creator._id;
    if (String(targetEmployeeId) !== String(creator._id)) {
      await assertManagerOwns(creator._id, targetEmployeeId);
    }
  } else {
    // hr/admin
    if (!payload.employee) throw ApiError.badRequest('An employee must be specified');
    targetEmployeeId = payload.employee;
  }

  const goal = await Goal.create({
    employee: targetEmployeeId,
    title: payload.title,
    description: payload.description || '',
    dueDate: payload.dueDate || null,
    createdBy: creator._id,
  });

  if (String(targetEmployeeId) !== String(creator._id)) {
    await notify(targetEmployeeId, {
      type: 'goal-assigned',
      title: `New goal: ${goal.title}`,
      link: '/goals',
    });
  }

  return goal;
};

// --- Owner: update details / log progress --------------------------------

export const updateOwnGoal = async (userId, goalId, payload) => {
  const employee = await findEmployeeOrThrow(userId);
  const goal = await Goal.findById(goalId);
  if (!goal) throw ApiError.notFound('Goal not found');
  if (String(goal.employee) !== String(employee._id)) {
    throw ApiError.forbidden('You can only update your own goals');
  }
  if (['completed', 'cancelled'].includes(goal.status)) {
    throw ApiError.conflict('This goal is already closed');
  }

  Object.assign(goal, payload);
  if (payload.progress !== undefined) {
    goal.status = progressToStatus(payload.progress);
  }
  await goal.save();
  return goal;
};

// --- Manager/HR/Admin: review (approve/close/cancel) ----------------------

export const reviewGoal = async (userId, role, goalId, { status, comment }) => {
  const goal = await Goal.findById(goalId);
  if (!goal) throw ApiError.notFound('Goal not found');

  if (role === 'manager') {
    const managerEmployee = await findEmployeeOrThrow(userId);
    await assertManagerOwns(managerEmployee._id, goal.employee);
  }

  goal.status = status;
  if (status === 'completed') goal.progress = 100;
  if (comment) goal.reviewComment = comment;
  await goal.save();

  await notify(goal.employee, {
    type: 'goal-reviewed',
    title: `Your goal "${goal.title}" was marked ${status.replace('-', ' ')}`,
    link: '/goals',
  });

  return goal;
};

export const deleteGoal = async (userId, role, goalId) => {
  const goal = await Goal.findById(goalId);
  if (!goal) throw ApiError.notFound('Goal not found');

  if (role === 'employee') {
    const employee = await findEmployeeOrThrow(userId);
    if (String(goal.employee) !== String(employee._id)) {
      throw ApiError.forbidden('You can only delete your own goals');
    }
  } else if (role === 'manager') {
    const managerEmployee = await findEmployeeOrThrow(userId);
    await assertManagerOwns(managerEmployee._id, goal.employee);
  }

  await Goal.findByIdAndDelete(goalId);
};

// --- Reads ---------------------------------------------------------------

const GOAL_POPULATE = [
  { path: 'employee', select: 'name employeeId' },
  { path: 'createdBy', select: 'name employeeId' },
];

export const listMyGoals = async (userId, filter = {}) => {
  const employee = await findEmployeeOrThrow(userId);
  const query = { employee: employee._id };
  if (filter.status) query.status = filter.status;
  return Goal.find(query).populate(GOAL_POPULATE).sort({ createdAt: -1 });
};

export const listTeamGoals = async (managerUserId, filter = {}) => {
  const managerEmployee = await findEmployeeOrThrow(managerUserId);
  const memberIds = [...(await getManagedEmployeeIds(managerEmployee._id))];
  const query = { employee: { $in: memberIds } };
  if (filter.status) query.status = filter.status;
  if (filter.employee) query.employee = filter.employee;
  return Goal.find(query).populate(GOAL_POPULATE).sort({ createdAt: -1 });
};

export const listAllGoals = (filter = {}) =>
  Goal.find(filter).populate(GOAL_POPULATE).sort({ createdAt: -1 });
