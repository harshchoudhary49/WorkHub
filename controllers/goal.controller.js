import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import * as goalService from '../services/goal.service.js';

export const create = asyncHandler(async (req, res) => {
  const goal = await goalService.createGoal(req.user.id, req.user.role, req.body);
  return new ApiResponse(201, goal, 'Goal created').send(res);
});

export const myGoals = asyncHandler(async (req, res) => {
  const goals = await goalService.listMyGoals(req.user.id, req.query);
  return new ApiResponse(200, goals, 'Goals fetched').send(res);
});

export const updateOwn = asyncHandler(async (req, res) => {
  const goal = await goalService.updateOwnGoal(req.user.id, req.params.id, req.body);
  return new ApiResponse(200, goal, 'Goal updated').send(res);
});

export const review = asyncHandler(async (req, res) => {
  const goal = await goalService.reviewGoal(req.user.id, req.user.role, req.params.id, req.body);
  return new ApiResponse(200, goal, 'Goal reviewed').send(res);
});

export const remove = asyncHandler(async (req, res) => {
  await goalService.deleteGoal(req.user.id, req.user.role, req.params.id);
  return new ApiResponse(200, null, 'Goal deleted').send(res);
});

export const teamGoals = asyncHandler(async (req, res) => {
  const goals = await goalService.listTeamGoals(req.user.id, req.query);
  return new ApiResponse(200, goals, 'Team goals fetched').send(res);
});

export const allGoals = asyncHandler(async (req, res) => {
  const goals = await goalService.listAllGoals(req.query);
  return new ApiResponse(200, goals, 'Goals fetched').send(res);
});
