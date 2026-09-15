import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import * as analyticsService from '../services/analytics.service.js';

export const overview = asyncHandler(async (req, res) => {
  const data = await analyticsService.getOverview();
  return new ApiResponse(200, data, 'Overview fetched').send(res);
});

export const attendanceTrend = asyncHandler(async (req, res) => {
  const days = req.query.days ? Number(req.query.days) : 14;
  const data = await analyticsService.getAttendanceTrend(days);
  return new ApiResponse(200, data, 'Attendance trend fetched').send(res);
});

export const taskCompletionByDepartment = asyncHandler(async (req, res) => {
  const data = await analyticsService.getTaskCompletionByDepartment();
  return new ApiResponse(200, data, 'Task completion by department fetched').send(res);
});

export const headcountByDepartment = asyncHandler(async (req, res) => {
  const data = await analyticsService.getHeadcountByDepartment();
  return new ApiResponse(200, data, 'Headcount by department fetched').send(res);
});
