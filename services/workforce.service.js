import { Department } from '../models/Department.js';
import { Team } from '../models/Team.js';
import { Employee } from '../models/Employee.js';
import { Office } from '../models/Office.js';
import { Floor } from '../models/Floor.js';
import { Desk } from '../models/Desk.js';
import { Attendance } from '../models/Attendance.js';
import { Task } from '../models/Task.js';
import { startOfDay, isWeekend } from '../utils/dateUtils.js';
import { getHolidayDateSet } from './holiday.service.js';

// Org-wide "as of right now" counts for the Command Center's header cards.
// Deliberately org-wide (every active employee), not just desk-assigned
// ones - someone fully remote with no assigned desk still counts.
export const getOverview = async () => {
  const today = startOfDay(new Date());
  const activeEmployees = await Employee.find({ status: { $ne: 'inactive' } }).select('_id');
  const totalEmployees = activeEmployees.length;

  const todayRecords = await Attendance.find({
    date: today,
    employee: { $in: activeEmployees.map((e) => e._id) },
  }).select('status');

  const counts = { present: 0, absent: 0, leave: 0, remote: 0, 'half-day': 0 };
  todayRecords.forEach((r) => {
    if (counts[r.status] !== undefined) counts[r.status] += 1;
  });

  const weekendOrHoliday = isWeekend(today) || (await getHolidayDateSet(null, today, today)).has(today.getTime());
  const notCheckedIn = weekendOrHoliday ? 0 : totalEmployees - todayRecords.length;

  return {
    totalEmployees,
    present: counts.present,
    absent: counts.absent,
    onLeave: counts.leave,
    remote: counts.remote,
    halfDay: counts['half-day'],
    notCheckedIn,
    isWeekendOrHoliday: weekendOrHoliday,
  };
};

// Today's live status for one employee, matching the same status set the
// office-map markers use (🟢🔴🟡🔵⚪).
const resolveTodayStatus = (record, weekendOrHoliday) => {
  if (record) return record.status;
  return weekendOrHoliday ? 'holiday' : 'not-checked-in';
};

// Builds the full office/floor/desk map, enriched with each seated
// employee's live attendance status and a light task summary - filterable
// by office/floor/department/team/status/search. Desks outside the
// selected office/floor are simply omitted; desks within scope whose
// employee doesn't match department/team/status/search are still returned
// but flagged `matchesFilter: false` so the frontend can dim them rather
// than punching holes in the floor plan.
export const getMapData = async (filters = {}) => {
  const today = startOfDay(new Date());
  const weekendOrHoliday = isWeekend(today) || (await getHolidayDateSet(null, today, today)).has(today.getTime());

  const offices = await Office.find().sort({ name: 1 });

  const floorQuery = {};
  if (filters.office) floorQuery.office = filters.office;
  const floors = await Floor.find(floorQuery).sort({ floorNumber: 1 });

  const deskQuery = { floor: { $in: floors.map((f) => f._id) } };
  if (filters.floor) deskQuery.floor = filters.floor;

  const desks = await Desk.find(deskQuery).populate({
    path: 'assignedEmployee',
    select: 'name employeeId designation department team status',
    populate: [
      { path: 'department', select: 'name' },
      { path: 'team', select: 'name' },
    ],
  });

  const employeeIds = desks.map((d) => d.assignedEmployee?._id).filter(Boolean);
  const todayRecords = await Attendance.find({ date: today, employee: { $in: employeeIds } });
  const recordByEmployee = new Map(todayRecords.map((r) => [r.employee.toString(), r]));

  const activeTasks = await Task.find({ assignee: { $in: employeeIds }, status: { $ne: 'COMPLETED' } })
    .select('assignee title status dueDate')
    .sort({ dueDate: 1 });
  const tasksByEmployee = new Map();
  activeTasks.forEach((t) => {
    const key = t.assignee.toString();
    if (!tasksByEmployee.has(key)) tasksByEmployee.set(key, []);
    if (tasksByEmployee.get(key).length < 3) tasksByEmployee.get(key).push(t);
  });

  const search = filters.search?.toLowerCase();

  const enrichedDesks = desks.map((desk) => {
    const emp = desk.assignedEmployee;
    if (!emp) return { _id: desk._id, deskCode: desk.deskCode, position: desk.position, floor: desk.floor, employee: null };

    const record = recordByEmployee.get(emp._id.toString());
    const status = resolveTodayStatus(record, weekendOrHoliday);

    let matchesFilter = true;
    if (filters.department && String(emp.department?._id) !== String(filters.department)) matchesFilter = false;
    if (filters.team && String(emp.team?._id) !== String(filters.team)) matchesFilter = false;
    if (filters.status && status !== filters.status) matchesFilter = false;
    if (search && !emp.name.toLowerCase().includes(search) && !emp.employeeId.toLowerCase().includes(search)) {
      matchesFilter = false;
    }

    return {
      _id: desk._id,
      deskCode: desk.deskCode,
      position: desk.position,
      floor: desk.floor,
      matchesFilter,
      employee: {
        _id: emp._id,
        name: emp.name,
        employeeId: emp.employeeId,
        designation: emp.designation,
        department: emp.department?.name || null,
        team: emp.team?.name || null,
        status,
        checkIn: record?.checkIn || null,
        checkOut: record?.checkOut || null,
        workingHours: record?.workingHours || 0,
        activeTasks: (tasksByEmployee.get(emp._id.toString()) || []).map((t) => ({
          title: t.title,
          status: t.status,
          dueDate: t.dueDate,
        })),
      },
    };
  });

  return { offices, floors, desks: enrichedDesks };
};
