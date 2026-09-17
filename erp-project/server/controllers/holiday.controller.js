import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import * as holidayService from '../services/holiday.service.js';

export const list = asyncHandler(async (req, res) => {
  const holidays = await holidayService.listHolidays({
    office: req.query.office,
    year: req.query.year ? Number(req.query.year) : undefined,
  });
  return new ApiResponse(200, holidays, 'Holidays fetched').send(res);
});

export const create = asyncHandler(async (req, res) => {
  const holiday = await holidayService.createHoliday(req.body);
  return new ApiResponse(201, holiday, 'Holiday created').send(res);
});

export const update = asyncHandler(async (req, res) => {
  const holiday = await holidayService.updateHoliday(req.params.id, req.body);
  return new ApiResponse(200, holiday, 'Holiday updated').send(res);
});

export const remove = asyncHandler(async (req, res) => {
  await holidayService.deleteHoliday(req.params.id);
  return new ApiResponse(200, null, 'Holiday deleted').send(res);
});
