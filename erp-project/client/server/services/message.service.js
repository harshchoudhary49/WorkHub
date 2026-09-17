import { Message } from '../models/Message.js';
import { Employee } from '../models/Employee.js';
import { Team } from '../models/Team.js';
import { ApiError } from '../utils/ApiError.js';
import { notify } from './notification.service.js';

const findEmployeeOrThrow = async (userId) => {
  const employee = await Employee.findOne({ user: userId });
  if (!employee) throw ApiError.notFound('Employee profile not found');
  return employee;
};

// --- Direct messages -------------------------------------------------------

export const sendDirectMessage = async (userId, { recipient, body }) => {
  const sender = await findEmployeeOrThrow(userId);
  if (String(sender._id) === String(recipient)) {
    throw ApiError.badRequest('You cannot message yourself');
  }
  const recipientEmployee = await Employee.findById(recipient);
  if (!recipientEmployee) throw ApiError.notFound('Recipient not found');

  const message = await Message.create({
    sender: sender._id,
    recipient,
    body,
    readBy: [sender._id],
  });

  await notify(recipient, {
    type: 'message',
    title: `New message from ${sender.name}`,
    message: body.length > 140 ? `${body.slice(0, 140)}...` : body,
    link: `/messages?with=${sender._id}`,
  });

  return message;
};

export const getDirectConversation = async (userId, otherEmployeeId) => {
  const employee = await findEmployeeOrThrow(userId);

  const messages = await Message.find({
    team: null,
    $or: [
      { sender: employee._id, recipient: otherEmployeeId },
      { sender: otherEmployeeId, recipient: employee._id },
    ],
  })
    .populate('sender', 'name employeeId')
    .sort({ createdAt: 1 });

  // Mark anything sent to me as read now that I've opened the thread.
  await Message.updateMany(
    { sender: otherEmployeeId, recipient: employee._id, readBy: { $ne: employee._id } },
    { $addToSet: { readBy: employee._id } }
  );

  return messages;
};

// Inbox = everyone I've exchanged a DM with, most recent first, with an
// unread count each. Computed in JS rather than a Mongo aggregation
// pipeline - simpler to read and plenty fast at portfolio/demo scale.
export const getInbox = async (userId) => {
  const employee = await findEmployeeOrThrow(userId);

  const messages = await Message.find({
    team: null,
    $or: [{ sender: employee._id }, { recipient: employee._id }],
  })
    .populate('sender', 'name employeeId')
    .populate('recipient', 'name employeeId')
    .sort({ createdAt: -1 });

  const byContact = new Map();
  for (const msg of messages) {
    const isSender = String(msg.sender._id) === String(employee._id);
    const contact = isSender ? msg.recipient : msg.sender;
    if (!contact) continue;
    const key = contact._id.toString();

    if (!byContact.has(key)) {
      byContact.set(key, { contact, lastMessage: msg, unreadCount: 0 });
    }
    if (!isSender && !msg.readBy.some((id) => String(id) === String(employee._id))) {
      byContact.get(key).unreadCount += 1;
    }
  }

  return [...byContact.values()].sort(
    (a, b) => new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt)
  );
};

// --- Team channels -----------------------------------------------------

const assertTeamMember = async (employee, teamId) => {
  const team = await Team.findById(teamId);
  if (!team) throw ApiError.notFound('Team not found');
  const isMember = team.members.some((m) => String(m) === String(employee._id));
  const isManager = String(team.manager) === String(employee._id);
  if (!isMember && !isManager) {
    throw ApiError.forbidden('You are not a member of this team');
  }
  return team;
};

export const sendTeamMessage = async (userId, teamId, { body }) => {
  const sender = await findEmployeeOrThrow(userId);
  const team = await assertTeamMember(sender, teamId);

  const message = await Message.create({ sender: sender._id, team: teamId, body, readBy: [sender._id] });

  const recipients = [...new Set([...team.members.map((m) => m.toString()), team.manager?.toString()])].filter(
    (id) => id && id !== String(sender._id)
  );
  await Promise.all(
    recipients.map((id) =>
      notify(id, {
        type: 'team-message',
        title: `${sender.name} in ${team.name}`,
        message: body.length > 140 ? `${body.slice(0, 140)}...` : body,
        link: `/messages?team=${teamId}`,
      })
    )
  );

  return message;
};

export const getTeamMessages = async (userId, teamId) => {
  const employee = await findEmployeeOrThrow(userId);
  await assertTeamMember(employee, teamId);

  const messages = await Message.find({ team: teamId }).populate('sender', 'name employeeId').sort({ createdAt: 1 });

  await Message.updateMany(
    { team: teamId, readBy: { $ne: employee._id } },
    { $addToSet: { readBy: employee._id } }
  );

  return messages;
};

// Teams to show in the channel selector - anywhere the user is a member or
// the manager.
export const getMyTeams = async (userId) => {
  const employee = await findEmployeeOrThrow(userId);
  return Team.find({ $or: [{ members: employee._id }, { manager: employee._id }] }).select('name');
};
