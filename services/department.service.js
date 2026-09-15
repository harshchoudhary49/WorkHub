import { Department } from '../models/Department.js';
import { Team } from '../models/Team.js';
import { ApiError } from '../utils/ApiError.js';

export const listDepartments = (filter = {}) =>
  Department.find(filter).populate('office', 'name').populate('head', 'name employeeId').sort({
    name: 1,
  });

export const getDepartmentById = async (id) => {
  const dept = await Department.findById(id)
    .populate('office', 'name')
    .populate('head', 'name employeeId');
  if (!dept) throw ApiError.notFound('Department not found');
  return dept;
};

export const createDepartment = async (payload) => {
  const existing = await Department.findOne({ name: payload.name, office: payload.office });
  if (existing) {
    throw ApiError.conflict('A department with this name already exists in this office');
  }
  return Department.create(payload);
};

export const updateDepartment = async (id, payload) => {
  const dept = await Department.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });
  if (!dept) throw ApiError.notFound('Department not found');
  return dept;
};

export const deleteDepartment = async (id) => {
  const inUse = await Team.exists({ department: id });
  if (inUse) {
    throw ApiError.conflict('Cannot delete a department that still has teams assigned to it');
  }
  const dept = await Department.findByIdAndDelete(id);
  if (!dept) throw ApiError.notFound('Department not found');
};
