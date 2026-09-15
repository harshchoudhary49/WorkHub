import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import * as recognitionService from '../services/recognition.service.js';

export const give = asyncHandler(async (req, res) => {
  const recognition = await recognitionService.giveRecognition(req.user.id, req.body);
  return new ApiResponse(201, recognition, 'Recognition sent').send(res);
});

export const feed = asyncHandler(async (req, res) => {
  const recognitions = await recognitionService.getFeed();
  return new ApiResponse(200, recognitions, 'Recognition feed fetched').send(res);
});

export const mine = asyncHandler(async (req, res) => {
  const result = await recognitionService.getMyRecognitions(req.user.id);
  return new ApiResponse(200, result, 'Your recognitions fetched').send(res);
});
