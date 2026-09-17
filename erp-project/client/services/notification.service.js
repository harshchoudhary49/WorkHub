import { Notification } from '../models/Notification.js';

export const notify = (recipientEmployeeId, { type, title, message = '', link = '' }) =>
  Notification.create({ recipient: recipientEmployeeId, type, title, message, link });

export const listMyNotifications = (employeeId, { unreadOnly } = {}) => {
  const query = { recipient: employeeId };
  if (unreadOnly) query.isRead = false;
  return Notification.find(query).sort({ createdAt: -1 }).limit(50);
};

export const unreadCount = (employeeId) =>
  Notification.countDocuments({ recipient: employeeId, isRead: false });

export const markRead = (employeeId, notificationId) =>
  Notification.findOneAndUpdate(
    { _id: notificationId, recipient: employeeId },
    { isRead: true },
    { new: true }
  );

export const markAllRead = (employeeId) =>
  Notification.updateMany({ recipient: employeeId, isRead: false }, { isRead: true });
