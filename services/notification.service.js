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

// --- Task-deadline reminders (Phase 8) -------------------------------------
// Manual-trigger sweep, same pattern as attendance's markAbsentees - a real
// scheduler (node-cron) can call this on an interval once Phase 12 wires
// one up. Notifies once per task via `reminderSentAt`, not once per run.
export const checkTaskDeadlines = async (hoursAhead = 24) => {
  // Deliberately deferred imports to avoid a require-cycle at module load
  // time (Task doesn't depend on notifications, but this function does).
  const { Task } = await import('../models/Task.js');

  const now = new Date();
  const horizon = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);

  const dueSoon = await Task.find({
    status: { $ne: 'COMPLETED' },
    dueDate: { $gte: now, $lte: horizon },
    reminderSentAt: null,
  });

  await Promise.all(
    dueSoon.map(async (task) => {
      await notify(task.assignee, {
        type: 'task-deadline',
        title: `"${task.title}" is due soon`,
        message: `Due ${new Date(task.dueDate).toLocaleString()}`,
        link: '/tasks',
      });
      task.reminderSentAt = now;
      await task.save();
    })
  );

  return { notified: dueSoon.length };
};
