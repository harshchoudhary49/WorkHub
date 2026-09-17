import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Employee } from '../models/Employee.js';
import * as notificationService from '../services/notification.service.js';

const myEmployeeId = async (userId) => {
  const employee = await Employee.findOne({ user: userId }).select('_id');
  return employee?._id;
};

export const list = asyncHandler(async (req, res) => {
  const employeeId = await myEmployeeId(req.user.id);
  const notifications = await notificationService.listMyNotifications(employeeId, {
    unreadOnly: req.query.unread === 'true',
  });
  const unread = await notificationService.unreadCount(employeeId);
  return new ApiResponse(200, { notifications, unread }, 'Notifications fetched').send(res);
});

export const markRead = asyncHandler(async (req, res) => {
  const employeeId = await myEmployeeId(req.user.id);
  const notification = await notificationService.markRead(employeeId, req.params.id);
  return new ApiResponse(200, notification, 'Marked as read').send(res);
});

export const markAllRead = asyncHandler(async (req, res) => {
  const employeeId = await myEmployeeId(req.user.id);
  await notificationService.markAllRead(employeeId);
  return new ApiResponse(200, null, 'All marked as read').send(res);
});

// Manual-trigger sweep, HR/Admin only - see notification.service.js for
// why this isn't automatic yet.
export const checkTaskDeadlines = asyncHandler(async (req, res) => {
  const result = await notificationService.checkTaskDeadlines(req.body.hoursAhead);
  return new ApiResponse(200, result, 'Deadline reminders sent').send(res);
});
