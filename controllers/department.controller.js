import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import * as departmentService from '../services/department.service.js';

export const list = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.office) filter.office = req.query.office;
  const departments = await departmentService.listDepartments(filter);
  return new ApiResponse(200, departments, 'Departments fetched').send(res);
});

export const getOne = asyncHandler(async (req, res) => {
  const department = await departmentService.getDepartmentById(req.params.id);
  return new ApiResponse(200, department, 'Department fetched').send(res);
});

export const create = asyncHandler(async (req, res) => {
  const department = await departmentService.createDepartment(req.body);
  return new ApiResponse(201, department, 'Department created').send(res);
});

export const update = asyncHandler(async (req, res) => {
  const department = await departmentService.updateDepartment(req.params.id, req.body);
  return new ApiResponse(200, department, 'Department updated').send(res);
});

export const remove = asyncHandler(async (req, res) => {
  await departmentService.deleteDepartment(req.params.id);
  return new ApiResponse(200, null, 'Department deleted').send(res);
});
