import { Announcement } from '../models/Announcement.js';
import { Employee } from '../models/Employee.js';
import { Team } from '../models/Team.js';
import { ApiError } from '../utils/ApiError.js';
import { notify } from './notification.service.js';

const findEmployeeOrThrow = async (userId) => {
  const employee = await Employee.findOne({ user: userId });
  if (!employee) throw ApiError.notFound('Employee profile not found');
  return employee;
};

// Everyone in scope right now - used both to notify on publish and (if
// needed later) to audit who an announcement reached.
const resolveAudienceEmployeeIds = async (scope, refId) => {
  if (scope === 'company') {
    const employees = await Employee.find({ status: { $ne: 'inactive' } }).select('_id');
    return employees.map((e) => e._id);
  }
  if (scope === 'department') {
    const employees = await Employee.find({ department: refId, status: { $ne: 'inactive' } }).select('_id');
    return employees.map((e) => e._id);
  }
  // team
  const team = await Team.findById(refId).select('members manager');
  if (!team) return [];
  const ids = new Set(team.members.map((m) => m.toString()));
  if (team.manager) ids.add(team.manager.toString());
  return [...ids];
};

export const createAnnouncement = async (userId, { title, body, type, scope, refId }) => {
  const author = await findEmployeeOrThrow(userId);

  const announcement = await Announcement.create({
    title,
    body,
    type: type || 'notice',
    audience: { scope, refId: scope === 'company' ? null : refId },
    createdBy: author._id,
  });

  const recipientIds = await resolveAudienceEmployeeIds(scope, refId);
  await Promise.all(
    recipientIds
      .filter((id) => String(id) !== String(author._id))
      .map((id) =>
        notify(id, {
          type: 'announcement',
          title: `Announcement: ${title}`,
          message: body.length > 140 ? `${body.slice(0, 140)}...` : body,
          link: '/announcements',
        })
      )
  );

  return announcement;
};

// Everything company-wide, plus anything scoped to the viewer's own
// department or team - so each person only sees what's relevant to them.
export const listAnnouncementsForMe = async (userId) => {
  const employee = await findEmployeeOrThrow(userId);
  return Announcement.find({
    $or: [
      { 'audience.scope': 'company' },
      ...(employee.department ? [{ 'audience.scope': 'department', 'audience.refId': employee.department }] : []),
      ...(employee.team ? [{ 'audience.scope': 'team', 'audience.refId': employee.team }] : []),
    ],
  })
    .populate('createdBy', 'name employeeId')
    .sort({ publishedAt: -1 })
    .limit(50);
};

export const listAllAnnouncements = () =>
  Announcement.find().populate('createdBy', 'name employeeId').sort({ publishedAt: -1 });

export const deleteAnnouncement = async (id) => {
  const announcement = await Announcement.findByIdAndDelete(id);
  if (!announcement) throw ApiError.notFound('Announcement not found');
};
