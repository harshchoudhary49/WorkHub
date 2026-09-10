import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { Employee } from '../models/Employee.js';
import { Team } from '../models/Team.js';
import { ApiError } from '../utils/ApiError.js';

const SALT_ROUNDS = 12;

const generateEmployeeId = async () => {
  const count = await Employee.countDocuments();
  return `EMP-${String(count + 1).padStart(4, '0')}`;
};

const EMPLOYEE_POPULATE = [
  { path: 'department', select: 'name' },
  { path: 'team', select: 'name' },
  { path: 'manager', select: 'name employeeId' },
  { path: 'office', select: 'name' },
];

export const listEmployees = async (filter = {}) => {
  const query = {};
  if (filter.department) query.department = filter.department;
  if (filter.team) query.team = filter.team;
  if (filter.status) query.status = filter.status;
  if (filter.search) {
    query.$or = [
      { name: { $regex: filter.search, $options: 'i' } },
      { employeeId: { $regex: filter.search, $options: 'i' } },
    ];
  }
  return Employee.find(query).populate(EMPLOYEE_POPULATE).sort({ createdAt: -1 });
};

export const getEmployeeById = async (id) => {
  const employee = await Employee.findById(id).populate(EMPLOYEE_POPULATE);
  if (!employee) throw ApiError.notFound('Employee not found');
  return employee;
};

// Admin/HR-only: creates the login (User) and the profile (Employee) in one
// step, with full org placement and an explicit role - unlike public
// self-registration, which always defaults to "employee".
export const createEmployee = async (payload) => {
  const { name, email, password, role, designation, department, team, manager, office, skills, joiningDate } =
    payload;

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) throw ApiError.conflict('An account with this email already exists');

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({ email: email.toLowerCase(), passwordHash, role });

  const employeeId = await generateEmployeeId();
  const employee = await Employee.create({
    user: user._id,
    employeeId,
    name,
    designation,
    department: department || null,
    team: team || null,
    manager: manager || null,
    office: office || null,
    skills: skills || [],
    joiningDate,
  });

  if (team) {
    await Team.findByIdAndUpdate(team, { $addToSet: { members: employee._id } });
  }

  return getEmployeeById(employee._id);
};

// Admin/HR full edit - can move an employee between department/team/manager,
// change designation/skills/status, and change their role or active flag.
export const updateEmployeeAdmin = async (id, payload) => {
  const employee = await Employee.findById(id);
  if (!employee) throw ApiError.notFound('Employee not found');

  const { role, isActive, ...employeeFields } = payload;

  if (role || isActive !== undefined) {
    await User.findByIdAndUpdate(employee.user, {
      ...(role && { role }),
      ...(isActive !== undefined && { isActive }),
    });
  }

  // If the team is changing, keep the old and new Team.members arrays in
  // sync so team rosters never silently drift from Employee.team.
  if ('team' in employeeFields && String(employeeFields.team) !== String(employee.team)) {
    if (employee.team) {
      await Team.findByIdAndUpdate(employee.team, { $pull: { members: employee._id } });
    }
    if (employeeFields.team) {
      await Team.findByIdAndUpdate(employeeFields.team, { $addToSet: { members: employee._id } });
    }
  }

  Object.assign(employee, employeeFields);
  await employee.save();

  return getEmployeeById(employee._id);
};

// An employee editing their own profile - intentionally narrow (see the
// updateOwnProfileSchema validator for why).
export const updateOwnProfile = async (userId, payload) => {
  const employee = await Employee.findOne({ user: userId });
  if (!employee) throw ApiError.notFound('Employee profile not found');

  Object.assign(employee, payload);
  await employee.save();

  return getEmployeeById(employee._id);
};

// Soft delete (default, recommended): flips status/isActive off but keeps
// all historical records (attendance, tasks, etc. in later phases) intact
// and referenceable.
export const deactivateEmployee = async (id) => {
  const employee = await Employee.findById(id);
  if (!employee) throw ApiError.notFound('Employee not found');

  employee.status = 'inactive';
  await employee.save();
  await User.findByIdAndUpdate(employee.user, { isActive: false });

  return getEmployeeById(employee._id);
};

// Hard delete - Admin only, used sparingly (e.g. cleaning up a mistaken
// entry). Cleans up the Team roster reference so it doesn't dangle.
export const removeEmployee = async (id) => {
  const employee = await Employee.findById(id);
  if (!employee) throw ApiError.notFound('Employee not found');

  if (employee.team) {
    await Team.findByIdAndUpdate(employee.team, { $pull: { members: employee._id } });
  }

  await Employee.findByIdAndDelete(id);
  await User.findByIdAndDelete(employee.user);
};
