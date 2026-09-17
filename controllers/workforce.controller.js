import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import * as workforceService from '../services/workforce.service.js';

export const overview = asyncHandler(async (req, res) => {
  const data = await workforceService.getOverview();
  return new ApiResponse(200, data, 'Workforce overview fetched').send(res);
});

export const map = asyncHandler(async (req, res) => {
  const data = await workforceService.getMapData(req.query);
  return new ApiResponse(200, data, 'Office map fetched').send(res);
});
