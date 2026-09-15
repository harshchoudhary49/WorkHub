import { Floor } from '../models/Floor.js';
import { Desk } from '../models/Desk.js';
import { ApiError } from '../utils/ApiError.js';

export const listFloors = (filter = {}) => {
  const query = {};
  if (filter.office) query.office = filter.office;
  return Floor.find(query).populate('office', 'name').sort({ floorNumber: 1 });
};

export const getFloorById = async (id) => {
  const floor = await Floor.findById(id).populate('office', 'name');
  if (!floor) throw ApiError.notFound('Floor not found');
  return floor;
};

export const createFloor = (payload) => Floor.create(payload);

export const updateFloor = async (id, payload) => {
  const floor = await Floor.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
  if (!floor) throw ApiError.notFound('Floor not found');
  return floor;
};

export const deleteFloor = async (id) => {
  const inUse = await Desk.exists({ floor: id });
  if (inUse) throw ApiError.conflict('Cannot delete a floor that still has desks on it');
  const floor = await Floor.findByIdAndDelete(id);
  if (!floor) throw ApiError.notFound('Floor not found');
};
