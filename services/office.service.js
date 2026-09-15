import { Office } from '../models/Office.js';
import { Department } from '../models/Department.js';
import { ApiError } from '../utils/ApiError.js';

export const listOffices = () => Office.find().sort({ name: 1 });

export const getOfficeById = async (id) => {
  const office = await Office.findById(id);
  if (!office) throw ApiError.notFound('Office not found');
  return office;
};

export const createOffice = async (payload) => {
  const existing = await Office.findOne({ name: payload.name });
  if (existing) throw ApiError.conflict('An office with this name already exists');
  return Office.create(payload);
};

export const updateOffice = async (id, payload) => {
  const office = await Office.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });
  if (!office) throw ApiError.notFound('Office not found');
  return office;
};

export const deleteOffice = async (id) => {
  const inUse = await Department.exists({ office: id });
  if (inUse) {
    throw ApiError.conflict('Cannot delete an office that still has departments assigned to it');
  }
  const office = await Office.findByIdAndDelete(id);
  if (!office) throw ApiError.notFound('Office not found');
};
