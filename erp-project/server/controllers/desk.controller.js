import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import * as deskService from '../services/desk.service.js';

export const list = asyncHandler(async (req, res) => {
  const desks = await deskService.listDesks(req.query);
  return new ApiResponse(200, desks, 'Desks fetched').send(res);
});

export const create = asyncHandler(async (req, res) => {
  const desk = await deskService.createDesk(req.body);
  return new ApiResponse(201, desk, 'Desk created').send(res);
});

export const update = asyncHandler(async (req, res) => {
  const desk = await deskService.updateDesk(req.params.id, req.body);
  return new ApiResponse(200, desk, 'Desk updated').send(res);
});

export const remove = asyncHandler(async (req, res) => {
  await deskService.deleteDesk(req.params.id);
  return new ApiResponse(200, null, 'Desk deleted').send(res);
});

export const assign = asyncHandler(async (req, res) => {
  const desk = await deskService.assignDesk(req.params.id, req.body.employee);
  return new ApiResponse(200, desk, 'Desk assigned').send(res);
});

export const unassign = asyncHandler(async (req, res) => {
  const desk = await deskService.unassignDesk(req.params.id);
  return new ApiResponse(200, desk, 'Desk unassigned').send(res);
});
