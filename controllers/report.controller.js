import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import * as reportService from '../services/report.service.js';

export const attendance = asyncHandler(async (req, res) => {
  const rows = await reportService.getAttendanceReport(req.user.id, req.user.role, req.query);
  return new ApiResponse(200, rows, 'Attendance report generated').send(res);
});

export const leaves = asyncHandler(async (req, res) => {
  const rows = await reportService.getLeaveReport(req.user.id, req.user.role, req.query);
  return new ApiResponse(200, rows, 'Leave report generated').send(res);
});

export const employees = asyncHandler(async (req, res) => {
  const rows = await reportService.getEmployeeReport(req.user.id, req.user.role, req.query);
  return new ApiResponse(200, rows, 'Employee report generated').send(res);
});

export const tasks = asyncHandler(async (req, res) => {
  const rows = await reportService.getTaskReport(req.user.id, req.user.role, req.query);
  return new ApiResponse(200, rows, 'Task report generated').send(res);
});

export const performance = asyncHandler(async (req, res) => {
  const rows = await reportService.getPerformanceReport(req.user.id, req.user.role, req.query);
  return new ApiResponse(200, rows, 'Performance report generated').send(res);
});

export const workload = asyncHandler(async (req, res) => {
  const rows = await reportService.getWorkloadReport(req.user.id, req.user.role, req.query);
  return new ApiResponse(200, rows, 'Workload report generated').send(res);
});
