import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import * as taskService from '../services/task.service.js';

export const create = asyncHandler(async (req, res) => {
  const task = await taskService.createTask(req.user.id, req.user.role, req.body);
  return new ApiResponse(201, task, 'Task created').send(res);
});

export const myTasks = asyncHandler(async (req, res) => {
  const result = await taskService.listMyTasks(req.user.id, req.query);
  return new ApiResponse(200, result, 'Tasks fetched').send(res);
});

export const updateStatus = asyncHandler(async (req, res) => {
  const task = await taskService.updateOwnTaskStatus(req.user.id, req.params.id, req.body);
  return new ApiResponse(200, task, 'Task status updated').send(res);
});

export const update = asyncHandler(async (req, res) => {
  const task = await taskService.updateTask(req.user.id, req.user.role, req.params.id, req.body);
  return new ApiResponse(200, task, 'Task updated').send(res);
});

export const remove = asyncHandler(async (req, res) => {
  await taskService.deleteTask(req.user.id, req.user.role, req.params.id);
  return new ApiResponse(200, null, 'Task deleted').send(res);
});

export const teamTasks = asyncHandler(async (req, res) => {
  const result = await taskService.listTeamTasks(req.user.id, req.query);
  return new ApiResponse(200, result, 'Team tasks fetched').send(res);
});

export const allTasks = asyncHandler(async (req, res) => {
  const result = await taskService.listAllTasks(req.query);
  return new ApiResponse(200, result, 'Tasks fetched').send(res);
});
