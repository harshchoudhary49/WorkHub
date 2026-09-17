import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import * as officeService from '../services/office.service.js';

export const list = asyncHandler(async (req, res) => {
  const offices = await officeService.listOffices();
  return new ApiResponse(200, offices, 'Offices fetched').send(res);
});

export const getOne = asyncHandler(async (req, res) => {
  const office = await officeService.getOfficeById(req.params.id);
  return new ApiResponse(200, office, 'Office fetched').send(res);
});

export const create = asyncHandler(async (req, res) => {
  const office = await officeService.createOffice(req.body);
  return new ApiResponse(201, office, 'Office created').send(res);
});

export const update = asyncHandler(async (req, res) => {
  const office = await officeService.updateOffice(req.params.id, req.body);
  return new ApiResponse(200, office, 'Office updated').send(res);
});

export const remove = asyncHandler(async (req, res) => {
  await officeService.deleteOffice(req.params.id);
  return new ApiResponse(200, null, 'Office deleted').send(res);
});
