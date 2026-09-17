import { Team } from '../models/Team.js';
import { Employee } from '../models/Employee.js';
import { ApiError } from '../utils/ApiError.js';

export const listTeams = (filter = {}) =>
  Team.find(filter)
    .populate('department', 'name')
    .populate('manager', 'name employeeId')
    .populate('members', 'name employeeId designation')
    .sort({ name: 1 });

export const getTeamById = async (id) => {
  const team = await Team.findById(id)
    .populate('department', 'name')
    .populate('manager', 'name employeeId')
    .populate('members', 'name employeeId designation status');
  if (!team) throw ApiError.notFound('Team not found');
  return team;
};

export const createTeam = async (payload) => {
  const existing = await Team.findOne({ name: payload.name, department: payload.department });
  if (existing) {
    throw ApiError.conflict('A team with this name already exists in this department');
  }
  const team = await Team.create(payload);

  // Keep Employee.team in sync for anyone listed as an initial member.
  if (payload.members?.length) {
    await Employee.updateMany({ _id: { $in: payload.members } }, { team: team._id });
  }
  return team;
};

export const updateTeam = async (id, payload) => {
  const previous = await Team.findById(id);
  if (!previous) throw ApiError.notFound('Team not found');

  const team = await Team.findByIdAndUpdate(id, payload, { new: true, runValidators: true });

  // If the member list changed, keep each Employee.team pointer consistent
  // with team membership rather than letting the two drift apart.
  if (payload.members) {
    const previousIds = previous.members.map((m) => m.toString());
    const newIds = payload.members.map((m) => m.toString());

    const removed = previousIds.filter((id2) => !newIds.includes(id2));
    const added = newIds.filter((id2) => !previousIds.includes(id2));

    if (removed.length) {
      await Employee.updateMany(
        { _id: { $in: removed }, team: team._id },
        { $unset: { team: 1 } }
      );
    }
    if (added.length) {
      await Employee.updateMany({ _id: { $in: added } }, { team: team._id });
    }
  }

  return team;
};

export const deleteTeam = async (id) => {
  const team = await Team.findByIdAndDelete(id);
  if (!team) throw ApiError.notFound('Team not found');
  await Employee.updateMany({ team: id }, { $unset: { team: 1 } });
};
