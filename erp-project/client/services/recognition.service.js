import { Recognition } from '../models/Recognition.js';
import { Employee } from '../models/Employee.js';
import { ApiError } from '../utils/ApiError.js';
import { notify } from './notification.service.js';

const findEmployeeOrThrow = async (userId) => {
  const employee = await Employee.findOne({ user: userId });
  if (!employee) throw ApiError.notFound('Employee profile not found');
  return employee;
};

export const giveRecognition = async (userId, { to, category, message }) => {
  const from = await findEmployeeOrThrow(userId);
  if (String(from._id) === String(to)) {
    throw ApiError.badRequest('You cannot recognize yourself');
  }
  const recipient = await Employee.findById(to);
  if (!recipient) throw ApiError.notFound('Recipient not found');

  const recognition = await Recognition.create({ from: from._id, to, category, message });

  await notify(to, {
    type: 'recognition-received',
    title: `${from.name} recognized you for ${category}`,
    message,
    link: '/recognition',
  });

  return recognition;
};

const RECOGNITION_POPULATE = [
  { path: 'from', select: 'name employeeId' },
  { path: 'to', select: 'name employeeId' },
];

// Org-wide recent recognitions - a lightweight "wall of fame" so good work
// stays visible beyond the one person who gave the shout-out.
export const getFeed = (limit = 30) =>
  Recognition.find().populate(RECOGNITION_POPULATE).sort({ createdAt: -1 }).limit(limit);

export const getMyRecognitions = async (userId) => {
  const employee = await findEmployeeOrThrow(userId);
  const [received, given] = await Promise.all([
    Recognition.find({ to: employee._id }).populate(RECOGNITION_POPULATE).sort({ createdAt: -1 }),
    Recognition.find({ from: employee._id }).populate(RECOGNITION_POPULATE).sort({ createdAt: -1 }),
  ]);
  return { received, given };
};
