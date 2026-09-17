import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import * as leaveService from '../services/leave.service.js';

export const apply = asyncHandler(async (req, res) => {
  const leave = await leaveService.applyForLeave(req.user.id, req.body);
  return new ApiResponse(201, leave, 'Leave request submitted').send(res);
});

export const myLeaves = asyncHandler(async (req, res) => {
  const leaves = await leaveService.listMyLeaves(req.user.id, req.query);
  return new ApiResponse(200, leaves, 'Leaves fetched').send(res);
});

export const myBalances = asyncHandler(async (req, res) => {
  const balances = await leaveService.getMyBalances(req.user.id);
  return new ApiResponse(200, balances, 'Leave balances fetched').send(res);
});

export const cancel = asyncHandler(async (req, res) => {
  const leave = await leaveService.cancelLeave(req.user.id, req.params.id);
  return new ApiResponse(200, leave, 'Leave request cancelled').send(res);
});

export const teamLeaves = asyncHandler(async (req, res) => {
  const leaves = await leaveService.listTeamLeaves(req.user.id, req.query);
  return new ApiResponse(200, leaves, 'Team leave requests fetched').send(res);
});

export const allLeaves = asyncHandler(async (req, res) => {
  const leaves = await leaveService.listAllLeaves(req.query);
  return new ApiResponse(200, leaves, 'Leave requests fetched').send(res);
});

export const approve = asyncHandler(async (req, res) => {
  const leave = await leaveService.approveLeave(req.user.id, req.user.role, req.params.id);
  return new ApiResponse(200, leave, 'Leave approved').send(res);
});

export const reject = asyncHandler(async (req, res) => {
  const leave = await leaveService.rejectLeave(req.user.id, req.user.role, req.params.id, req.body);
  return new ApiResponse(200, leave, 'Leave rejected').send(res);
});
