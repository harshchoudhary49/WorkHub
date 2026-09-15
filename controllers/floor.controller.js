import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import * as floorService from '../services/floor.service.js';

export const list = asyncHandler(async (req, res) => {
  const floors = await floorService.listFloors(req.query);
  return new ApiResponse(200, floors, 'Floors fetched').send(res);
});

export const getOne = asyncHandler(async (req, res) => {
  const floor = await floorService.getFloorById(req.params.id);
  return new ApiResponse(200, floor, 'Floor fetched').send(res);
});

export const create = asyncHandler(async (req, res) => {
  const floor = await floorService.createFloor(req.body);
  return new ApiResponse(201, floor, 'Floor created').send(res);
});

export const update = asyncHandler(async (req, res) => {
  const floor = await floorService.updateFloor(req.params.id, req.body);
  return new ApiResponse(200, floor, 'Floor updated').send(res);
});

export const remove = asyncHandler(async (req, res) => {
  await floorService.deleteFloor(req.params.id);
  return new ApiResponse(200, null, 'Floor deleted').send(res);
});
