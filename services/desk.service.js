import { Desk } from '../models/Desk.js';
import { Employee } from '../models/Employee.js';
import { Floor } from '../models/Floor.js';
import { ApiError } from '../utils/ApiError.js';

export const listDesks = (filter = {}) => {
  const query = {};
  if (filter.floor) query.floor = filter.floor;
  return Desk.find(query).populate('assignedEmployee', 'name employeeId designation').sort({ deskCode: 1 });
};

export const createDesk = async (payload) => {
  const existing = await Desk.findOne({ floor: payload.floor, deskCode: payload.deskCode });
  if (existing) throw ApiError.conflict('A desk with this code already exists on this floor');
  return Desk.create(payload);
};

export const updateDesk = async (id, payload) => {
  const desk = await Desk.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
  if (!desk) throw ApiError.notFound('Desk not found');
  return desk;
};

export const deleteDesk = async (id) => {
  const desk = await Desk.findById(id);
  if (!desk) throw ApiError.notFound('Desk not found');
  if (desk.assignedEmployee) {
    await Employee.findByIdAndUpdate(desk.assignedEmployee, { $unset: { desk: 1 } });
  }
  await Desk.findByIdAndDelete(id);
};

// Keeps Desk.assignedEmployee and Employee.{desk,floor,office} in sync in
// both directions - the same pattern team.service.js uses for
// Team.members <-> Employee.team, applied here to seating.
export const assignDesk = async (deskId, employeeId) => {
  const desk = await Desk.findById(deskId);
  if (!desk) throw ApiError.notFound('Desk not found');
  if (desk.assignedEmployee && String(desk.assignedEmployee) !== String(employeeId)) {
    throw ApiError.conflict('This desk is already assigned to someone else');
  }

  const employee = await Employee.findById(employeeId);
  if (!employee) throw ApiError.notFound('Employee not found');

  const floor = await Floor.findById(desk.floor);

  // Free up any desk this employee currently occupies elsewhere.
  await Desk.findOneAndUpdate({ assignedEmployee: employeeId }, { $unset: { assignedEmployee: 1 } });

  desk.assignedEmployee = employeeId;
  await desk.save();

  employee.desk = desk._id;
  employee.floor = desk.floor;
  employee.office = floor?.office || employee.office;
  await employee.save();

  return desk;
};

export const unassignDesk = async (deskId) => {
  const desk = await Desk.findById(deskId);
  if (!desk) throw ApiError.notFound('Desk not found');

  if (desk.assignedEmployee) {
    await Employee.findByIdAndUpdate(desk.assignedEmployee, { $unset: { desk: 1 } });
  }
  desk.assignedEmployee = null;
  await desk.save();
  return desk;
};
