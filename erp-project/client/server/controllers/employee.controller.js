import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import * as employeeService from '../services/employee.service.js';
import { Employee } from '../models/Employee.js';

// Any authenticated user can browse the directory (read-only). Filters are
// optional query params: ?department=&team=&status=&search=
export const listEmployees = asyncHandler(async (req, res) => {
  const employees = await employeeService.listEmployees(req.query);
  return new ApiResponse(200, employees, 'Employees fetched').send(res);
});

export const getEmployee = asyncHandler(async (req, res) => {
  const employee = await employeeService.getEmployeeById(req.params.id);
  return new ApiResponse(200, employee, 'Employee fetched').send(res);
});

// Admin/HR only - creates both the login and the profile.
export const createEmployee = asyncHandler(async (req, res) => {
  const employee = await employeeService.createEmployee(req.body);
  return new ApiResponse(201, employee, 'Employee created').send(res);
});

// Admin/HR only - full edit including org placement, role, and status.
export const updateEmployeeAdmin = asyncHandler(async (req, res) => {
  const employee = await employeeService.updateEmployeeAdmin(req.params.id, req.body);
  return new ApiResponse(200, employee, 'Employee updated').send(res);
});

// Any authenticated user editing their own profile - narrow field set.
export const updateOwnProfile = asyncHandler(async (req, res) => {
  const employee = await employeeService.updateOwnProfile(req.user.id, req.body);
  return new ApiResponse(200, employee, 'Profile updated').send(res);
});

// Admin/HR only - soft delete (recommended default).
export const deactivateEmployee = asyncHandler(async (req, res) => {
  const employee = await employeeService.deactivateEmployee(req.params.id);
  return new ApiResponse(200, employee, 'Employee deactivated').send(res);
});

// Admin only - hard delete.
export const removeEmployee = asyncHandler(async (req, res) => {
  await employeeService.removeEmployee(req.params.id);
  return new ApiResponse(200, null, 'Employee removed').send(res);
});

// Kept from Phase 2 as a quick RBAC sanity check route.
export const adminOnlyPing = asyncHandler(async (req, res) => {
  return new ApiResponse(200, { role: req.user.role }, 'You have HR/Admin access').send(res);
});

// Used to guard "manager can only act within their own team" style checks
// in later phases (leave approval, task assignment, etc.) - exported now so
// those controllers can reuse it instead of duplicating the lookup.
export const assertIsManagerOf = async (managerUserId, employeeId) => {
  const managerEmployee = await Employee.findOne({ user: managerUserId });
  const targetEmployee = await Employee.findById(employeeId);
  if (
    !managerEmployee ||
    !targetEmployee ||
    String(targetEmployee.manager) !== String(managerEmployee._id)
  ) {
    throw ApiError.forbidden('You can only act on your own team members');
  }
};
