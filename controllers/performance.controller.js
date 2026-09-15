import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import * as performanceService from '../services/performance.service.js';

export const myPerformance = asyncHandler(async (req, res) => {
  const snapshot = await performanceService.getMyPerformance(
    req.user.id,
    req.query.month ? Number(req.query.month) : undefined,
    req.query.year ? Number(req.query.year) : undefined
  );
  return new ApiResponse(200, snapshot, 'Performance fetched').send(res);
});

export const myHistory = asyncHandler(async (req, res) => {
  const history = await performanceService.getMyHistory(req.user.id);
  return new ApiResponse(200, history, 'Performance history fetched').send(res);
});

export const employeePerformance = asyncHandler(async (req, res) => {
  const snapshot = await performanceService.getEmployeePerformance(
    req.user.id,
    req.user.role,
    req.params.employeeId,
    req.query.month ? Number(req.query.month) : undefined,
    req.query.year ? Number(req.query.year) : undefined
  );
  return new ApiResponse(200, snapshot, 'Performance fetched').send(res);
});

export const teamPerformance = asyncHandler(async (req, res) => {
  const result = await performanceService.getTeamPerformance(
    req.user.id,
    req.query.month ? Number(req.query.month) : undefined,
    req.query.year ? Number(req.query.year) : undefined
  );
  return new ApiResponse(200, result, 'Team performance fetched').send(res);
});

export const giveFeedback = asyncHandler(async (req, res) => {
  const snapshot = await performanceService.addManagerFeedback(
    req.user.id,
    req.user.role,
    req.params.employeeId,
    req.body
  );
  return new ApiResponse(200, snapshot, 'Feedback saved').send(res);
});
