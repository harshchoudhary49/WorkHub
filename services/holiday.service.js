import { Holiday } from '../models/Holiday.js';
import { ApiError } from '../utils/ApiError.js';
import { startOfDay } from '../utils/dateUtils.js';

export const listHolidays = async (filter = {}) => {
  const query = {};
  if (filter.office) query.office = filter.office;
  if (filter.year) {
    query.date = {
      $gte: new Date(Date.UTC(filter.year, 0, 1)),
      $lte: new Date(Date.UTC(filter.year, 11, 31)),
    };
  }
  return Holiday.find(query).populate('office', 'name').sort({ date: 1 });
};

export const createHoliday = (payload) =>
  Holiday.create({ ...payload, date: startOfDay(payload.date) });

export const updateHoliday = async (id, payload) => {
  const update = payload.date ? { ...payload, date: startOfDay(payload.date) } : payload;
  const holiday = await Holiday.findByIdAndUpdate(id, update, { new: true, runValidators: true });
  if (!holiday) throw ApiError.notFound('Holiday not found');
  return holiday;
};

export const deleteHoliday = async (id) => {
  const holiday = await Holiday.findByIdAndDelete(id);
  if (!holiday) throw ApiError.notFound('Holiday not found');
};

// Used internally by the attendance service to know which days don't count
// as working days. Returns a Set of ms-since-epoch timestamps for O(1) lookup.
export const getHolidayDateSet = async (officeId, start, end) => {
  const query = {
    date: { $gte: startOfDay(start), $lte: startOfDay(end) },
    $or: [{ office: null }, ...(officeId ? [{ office: officeId }] : [])],
  };
  const holidays = await Holiday.find(query).select('date');
  return new Set(holidays.map((h) => startOfDay(h.date).getTime()));
};
