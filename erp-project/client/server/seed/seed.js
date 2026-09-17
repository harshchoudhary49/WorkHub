// Populates the database with a realistic-looking demo org: 1 admin, 1 HR,
// 3 managers, 15+ employees, multiple departments/teams, and several
// months of attendance/leave/task/goal/recognition/announcement history.
//
// Run with: npm run seed  (from server/)
//
// This intentionally writes most documents directly via the Mongoose
// models rather than going through the service layer - a seed script needs
// to backdate attendance/leave history, which the live services correctly
// refuse to do (check-in only works for "today", leave can't be applied for
// the past). Where backdating isn't an issue (a couple of Performance
// feedback entries, a pending leave request), it calls the real services so
// there's also a live example of each flow working end-to-end on first load.

import bcrypt from 'bcryptjs';
import { connectDB } from '../config/db.js';
import mongoose from 'mongoose';

import { User } from '../models/User.js';
import { Employee } from '../models/Employee.js';
import { Office } from '../models/Office.js';
import { Department } from '../models/Department.js';
import { Team } from '../models/Team.js';
import { Attendance } from '../models/Attendance.js';
import { Leave } from '../models/Leave.js';
import { LeaveBalance } from '../models/LeaveBalance.js';
import { Task } from '../models/Task.js';
import { Goal } from '../models/Goal.js';
import { Performance } from '../models/Performance.js';
import { Recognition } from '../models/Recognition.js';
import { Announcement } from '../models/Announcement.js';
import { Holiday } from '../models/Holiday.js';
import { Notification } from '../models/Notification.js';
import { Message } from '../models/Message.js';

const SALT_ROUNDS = 12;
const DEMO_PASSWORD = 'Password123!';

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[rand(0, arr.length - 1)];
const weightedPick = (options) => {
  // options: [{ value, weight }]
  const total = options.reduce((s, o) => s + o.weight, 0);
  let r = Math.random() * total;
  for (const o of options) {
    if (r < o.weight) return o.value;
    r -= o.weight;
  }
  return options[options.length - 1].value;
};
const startOfDay = (d) => {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
};
const isWeekend = (d) => [0, 6].includes(new Date(d).getUTCDay());
const daysAgo = (n) => startOfDay(new Date(Date.now() - n * 24 * 60 * 60 * 1000));
const daysFromNow = (n) => startOfDay(new Date(Date.now() + n * 24 * 60 * 60 * 1000));

const log = (msg) => console.log(`[seed] ${msg}`);

async function clearDatabase() {
  const models = [
    User, Employee, Office, Department, Team, Attendance, Leave, LeaveBalance,
    Task, Goal, Performance, Recognition, Announcement, Holiday, Notification, Message,
  ];
  await Promise.all(models.map((m) => m.deleteMany({})));
  log('Cleared existing collections');
}

async function createUserAndEmployee({ name, email, role, designation, department, team, manager, office, skills, joiningDaysAgo }) {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, SALT_ROUNDS);
  const user = await User.create({ email, passwordHash, role, isActive: true });
  const count = await Employee.countDocuments();
  const employee = await Employee.create({
    user: user._id,
    employeeId: `EMP-${String(count + 1).padStart(4, '0')}`,
    name,
    designation,
    department,
    team,
    manager,
    office,
    skills: skills || [],
    joiningDate: daysAgo(joiningDaysAgo),
    status: 'active',
  });
  return { user, employee };
}

// Generates ~20 weekdays of attendance history ending yesterday, skipping
// the seeded holiday. Mirrors the shape checkIn/checkOut produce so the
// dashboards/reports built in earlier phases have real data to show.
async function seedAttendanceHistory(employeeId, holidayDate) {
  const records = [];
  let d = daysAgo(28);
  const end = daysAgo(1);

  while (d <= end) {
    const isHoliday = holidayDate && startOfDay(d).getTime() === startOfDay(holidayDate).getTime();
    if (!isWeekend(d) && !isHoliday) {
      const status = weightedPick([
        { value: 'present', weight: 76 },
        { value: 'remote', weight: 9 },
        { value: 'half-day', weight: 5 },
        { value: 'absent', weight: 6 },
        { value: 'late', weight: 4 }, // still "present", just marks lateByMinutes
      ]);

      if (status === 'absent') {
        records.push({ employee: employeeId, date: new Date(d), status: 'absent', markedBy: 'system' });
      } else {
        const isLate = status === 'late';
        const checkInHour = isLate ? rand(10, 11) : 9;
        const checkInMinute = isLate ? rand(0, 59) : rand(0, 45);
        const checkIn = new Date(d);
        checkIn.setUTCHours(checkInHour, checkInMinute, 0, 0);

        const isHalfDay = status === 'half-day';
        const checkOutHour = isHalfDay ? rand(12, 13) : rand(17, 20);
        const checkOut = new Date(d);
        checkOut.setUTCHours(checkOutHour, rand(0, 59), 0, 0);

        const workingHours = Math.round(((checkOut - checkIn) / 3600000) * 100) / 100;
        const lateByMinutes = isLate ? (checkInHour - 9) * 60 + checkInMinute + 30 : 0;
        const overtimeMinutes = Math.max(0, Math.round((workingHours - 9) * 60));

        records.push({
          employee: employeeId,
          date: new Date(d),
          checkIn,
          checkOut,
          workingHours,
          lateByMinutes,
          overtimeMinutes,
          mode: status === 'remote' ? 'remote' : 'office',
          status: isHalfDay ? 'half-day' : status === 'remote' ? 'remote' : 'present',
          markedBy: 'self',
        });
      }
    }
    d = new Date(d.getTime() + 24 * 60 * 60 * 1000);
  }

  if (records.length) await Attendance.insertMany(records);
  return records.length;
}

// One short, already-completed casual leave in the past (with matching
// Attendance + LeaveBalance side effects, same as the live approval flow
// would produce), for every employee - so Leave history isn't empty.
async function seedPastLeave(employeeId, managerEmployeeId, year) {
  const start = daysAgo(rand(10, 18));
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000); // 2 consecutive weekdays where possible
  const days = isWeekend(start) || isWeekend(end) ? 1 : 2;

  await Leave.create({
    employee: employeeId,
    type: 'casual',
    startDate: start,
    endDate: isWeekend(end) ? start : end,
    days,
    reason: 'Personal time off',
    status: 'approved',
    approver: managerEmployeeId,
    decidedAt: new Date(start.getTime() - 2 * 24 * 60 * 60 * 1000),
  });

  await LeaveBalance.create({ employee: employeeId, year, type: 'casual', allocated: 12, used: days });

  // Keep Attendance consistent with the approved leave, same rule Phase 5 enforces live.
  await Attendance.deleteMany({ employee: employeeId, date: { $gte: start, $lte: isWeekend(end) ? start : end } });
  const leaveDays = isWeekend(end) ? [start] : [start, end];
  await Attendance.insertMany(
    leaveDays.filter((d) => !isWeekend(d)).map((d) => ({ employee: employeeId, date: d, status: 'leave', markedBy: 'system' }))
  );
}

async function seedTasksForEmployee(employeeId, managerEmployeeId, teamId) {
  const titles = [
    'Fix flaky checkout integration test',
    'Write API docs for the reporting endpoint',
    'Review PR: attendance percentage calculation',
    'Upgrade eslint config across the monorepo',
    'Investigate slow query on the employees list',
    'Design onboarding checklist for new hires',
    'Add pagination to the audit log viewer',
    'Spike: WebSocket support for live notifications',
  ];

  const count = rand(3, 5);
  const docs = [];
  for (let i = 0; i < count; i += 1) {
    const status = weightedPick([
      { value: 'COMPLETED', weight: 40 },
      { value: 'IN_PROGRESS', weight: 25 },
      { value: 'TODO', weight: 20 },
      { value: 'REVIEW', weight: 10 },
      { value: 'BLOCKED', weight: 5 },
    ]);
    const dueDate = status === 'COMPLETED' ? daysAgo(rand(1, 20)) : weightedPick([
      { value: daysAgo(rand(1, 5)), weight: 15 }, // overdue, for the dashboards to have something to flag
      { value: daysFromNow(rand(1, 21)), weight: 85 },
    ]);
    const estimatedHours = rand(2, 16);
    const completedAt = status === 'COMPLETED' ? new Date(dueDate.getTime() - rand(0, 2) * 24 * 60 * 60 * 1000) : null;

    docs.push({
      title: pick(titles),
      description: '',
      assignee: employeeId,
      team: teamId,
      assignedBy: managerEmployeeId,
      priority: pick(['low', 'medium', 'high', 'urgent']),
      status,
      dueDate,
      estimatedHours,
      actualHours: status === 'COMPLETED' ? estimatedHours + rand(-2, 3) : status === 'IN_PROGRESS' ? rand(1, estimatedHours) : 0,
      completedAt,
    });
  }
  await Task.insertMany(docs);
}

async function seedGoalsForEmployee(employeeId, creatorEmployeeId) {
  const titles = [
    'Improve React rendering performance on the dashboard',
    'Get comfortable with the new CI/CD pipeline',
    'Mentor a new team member through onboarding',
    'Lead a lunch-and-learn on testing best practices',
    'Reduce average PR review turnaround time',
  ];
  const count = rand(1, 2);
  const docs = [];
  for (let i = 0; i < count; i += 1) {
    const status = weightedPick([
      { value: 'completed', weight: 30 },
      { value: 'in-progress', weight: 50 },
      { value: 'not-started', weight: 20 },
    ]);
    const progress = status === 'completed' ? 100 : status === 'in-progress' ? rand(20, 85) : 0;
    docs.push({
      employee: employeeId,
      title: pick(titles),
      description: '',
      progress,
      status,
      createdBy: creatorEmployeeId,
      dueDate: daysFromNow(rand(10, 60)),
    });
  }
  await Goal.insertMany(docs);
}

async function seedPerformanceFeedback(employeeId, managerEmployeeId, month, year) {
  const comments = [
    'Solid quarter - consistently reliable on delivery timelines.',
    'Great collaboration on the platform migration work.',
    'Good progress, keep pushing on code review turnaround.',
    'Really stepped up helping onboard the new hires this month.',
  ];
  await Performance.create({
    employee: employeeId,
    period: { month, year },
    qualityScore: rand(65, 95),
    collaborationScore: rand(65, 95),
    managerFeedback: [{ author: managerEmployeeId, comment: pick(comments), createdAt: daysAgo(rand(2, 10)) }],
  });
}

async function run() {
  await connectDB();
  await clearDatabase();

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  // --- Office / Departments / Teams --------------------------------------
  const office = await Office.create({ name: 'Nimbus Labs — Bengaluru HQ', address: 'Koramangala, Bengaluru', timezone: 'Asia/Kolkata' });

  const engineering = await Department.create({ name: 'Engineering', office: office._id });
  const product = await Department.create({ name: 'Product', office: office._id });
  const peopleOps = await Department.create({ name: 'People Ops', office: office._id });

  // Teams need a manager, but manager Employees don't exist yet - create
  // them first with team: null, then backfill Team.manager and Employee.team.
  const holiday1 = await Holiday.create({ name: "Founders' Day", date: daysAgo(15), office: office._id });
  await Holiday.create({ name: 'Community Day', date: daysFromNow(22), office: office._id });

  log('Creating admin, HR, and managers...');
  const { employee: admin } = await createUserAndEmployee({
    name: 'Ava Patel', email: 'admin@nimbuslabs.io', role: 'admin', designation: 'Head of Operations',
    department: peopleOps._id, office: office._id, joiningDaysAgo: 400,
  });
  const { employee: hr } = await createUserAndEmployee({
    name: 'Harsh Choudhary', email: 'hr@nimbuslabs.io', role: 'hr', designation: 'HR Manager',
    department: peopleOps._id, office: office._id, joiningDaysAgo: 380,
  });

  const { employee: mgr1 } = await createUserAndEmployee({
    name: 'Marcus Chen', email: 'marcus.chen@nimbuslabs.io', role: 'manager', designation: 'Engineering Manager',
    department: engineering._id, office: office._id, joiningDaysAgo: 340,
  });
  const { employee: mgr2 } = await createUserAndEmployee({
    name: 'Elena Rodriguez', email: 'elena.rodriguez@nimbuslabs.io', role: 'manager', designation: 'Engineering Manager',
    department: engineering._id, office: office._id, joiningDaysAgo: 320,
  });
  const { employee: mgr3 } = await createUserAndEmployee({
    name: 'Sam Okafor', email: 'sam.okafor@nimbuslabs.io', role: 'manager', designation: 'Product Manager',
    department: product._id, office: office._id, joiningDaysAgo: 300,
  });

  const platformTeam = await Team.create({ name: 'Platform Engineering', department: engineering._id, manager: mgr1._id, members: [] });
  const frontendTeam = await Team.create({ name: 'Frontend Engineering', department: engineering._id, manager: mgr2._id, members: [] });
  const productTeam = await Team.create({ name: 'Product & Design', department: product._id, manager: mgr3._id, members: [] });

  await Employee.findByIdAndUpdate(mgr1._id, { team: platformTeam._id });
  await Employee.findByIdAndUpdate(mgr2._id, { team: frontendTeam._id });
  await Employee.findByIdAndUpdate(mgr3._id, { team: productTeam._id });

  // --- 15+ employees, distributed across the three teams -----------------
  log('Creating employees...');
  const employeeRoster = [
    ['Liam Johnson', 'Software Engineer', platformTeam, engineering, mgr1, ['Node.js', 'MongoDB']],
    ['Olivia Smith', 'Senior Software Engineer', platformTeam, engineering, mgr1, ['Go', 'Kubernetes']],
    ['Noah Williams', 'DevOps Engineer', platformTeam, engineering, mgr1, ['AWS', 'Terraform']],
    ['Emma Brown', 'QA Engineer', platformTeam, engineering, mgr1, ['Cypress', 'Playwright']],
    ['James Davis', 'Software Engineer', platformTeam, engineering, mgr1, ['Python', 'Django']],

    ['Sophia Miller', 'Frontend Engineer', frontendTeam, engineering, mgr2, ['React', 'TypeScript']],
    ['Benjamin Wilson', 'Senior Frontend Engineer', frontendTeam, engineering, mgr2, ['React', 'Tailwind']],
    ['Charlotte Moore', 'UI Engineer', frontendTeam, engineering, mgr2, ['CSS', 'Figma']],
    ['Lucas Taylor', 'Frontend Engineer', frontendTeam, engineering, mgr2, ['Vue', 'JavaScript']],
    ['Amelia Anderson', 'QA Engineer', frontendTeam, engineering, mgr2, ['Selenium', 'Jest']],

    ['Henry Thomas', 'Product Designer', productTeam, product, mgr3, ['Figma', 'User Research']],
    ['Mia Jackson', 'Product Manager', productTeam, product, mgr3, ['Roadmapping', 'Analytics']],
    ['Alexander White', 'UX Researcher', productTeam, product, mgr3, ['User Interviews', 'Surveys']],
    ['Isabella Harris', 'Product Designer', productTeam, product, mgr3, ['Prototyping', 'Figma']],
    ['Ethan Martin', 'Associate PM', productTeam, product, mgr3, ['SQL', 'A/B Testing']],
    ['Ava Thompson', 'Software Engineer', platformTeam, engineering, mgr1, ['Java', 'Spring']],
  ];

  const employees = [];
  for (const [name, designation, team, department, manager, skills] of employeeRoster) {
    const { employee } = await createUserAndEmployee({
      name,
      email: `${name.toLowerCase().replace(' ', '.')}@nimbuslabs.io`,
      role: 'employee',
      designation,
      department: department._id,
      team: team._id,
      manager: manager._id,
      office: office._id,
      skills,
      joiningDaysAgo: rand(60, 260),
    });
    employees.push({ employee, team, manager });
  }

  await Team.findByIdAndUpdate(platformTeam._id, { members: employees.filter((e) => e.team._id.equals(platformTeam._id)).map((e) => e.employee._id) });
  await Team.findByIdAndUpdate(frontendTeam._id, { members: employees.filter((e) => e.team._id.equals(frontendTeam._id)).map((e) => e.employee._id) });
  await Team.findByIdAndUpdate(productTeam._id, { members: employees.filter((e) => e.team._id.equals(productTeam._id)).map((e) => e.employee._id) });

  // --- Attendance, leave, tasks, goals, performance for every employee ---
  log('Generating attendance, leave, task, goal, and performance history (this takes a moment)...');
  const allStaffForAttendance = [...employees.map((e) => e.employee), mgr1, mgr2, mgr3];
  for (const emp of allStaffForAttendance) {
    await seedAttendanceHistory(emp._id, holiday1.date);
  }

  for (const { employee, manager, team } of employees) {
    await seedPastLeave(employee._id, manager._id, year);
    await seedTasksForEmployee(employee._id, manager._id, team._id);
    await seedGoalsForEmployee(employee._id, Math.random() > 0.5 ? manager._id : employee._id);
    await seedPerformanceFeedback(employee._id, manager._id, month, year);
  }

  // One live pending leave request per manager's first team member, using
  // the real dates-in-the-future rule, so there's something to approve in
  // the UI immediately after seeding.
  for (const mgr of [mgr1, mgr2, mgr3]) {
    const teamMember = employees.find((e) => String(e.manager._id) === String(mgr._id));
    if (teamMember) {
      await Leave.create({
        employee: teamMember.employee._id,
        type: 'wfh',
        startDate: daysFromNow(3),
        endDate: daysFromNow(3),
        days: 1,
        reason: 'Home internet installation',
        status: 'pending',
      });
    }
  }

  // --- Recognition feed ----------------------------------------------------
  log('Seeding recognitions...');
  const categories = ['teamwork', 'leadership', 'innovation', 'helping', 'excellence'];
  const messages = [
    'Huge help debugging the checkout flow under deadline pressure!',
    'Really thoughtful code review feedback this week.',
    'Stepped up to lead the migration effort - great initiative.',
    'Always willing to pair with newer team members.',
    'Shipped a really polished feature ahead of schedule.',
  ];
  const everyone = [...employees.map((e) => e.employee), mgr1, mgr2, mgr3];
  for (let i = 0; i < 12; i += 1) {
    const from = pick(everyone);
    let to = pick(everyone);
    while (String(to._id) === String(from._id)) to = pick(everyone);
    await Recognition.create({ from: from._id, to: to._id, category: pick(categories), message: pick(messages) });
  }

  // --- Announcements ---------------------------------------------------
  log('Seeding announcements...');
  await Announcement.create({
    title: 'Welcome to the new Workforce ERP',
    body: 'We have rolled out the new internal portal for attendance, leave, tasks, and more. Explore your dashboard and let People Ops know if you run into anything.',
    type: 'company',
    audience: { scope: 'company', refId: null },
    createdBy: hr._id,
  });
  await Announcement.create({
    title: 'Updated work-from-home policy',
    body: 'Starting next month, WFH requests should be submitted at least 2 business days in advance where possible.',
    type: 'policy',
    audience: { scope: 'company', refId: null },
    createdBy: hr._id,
  });
  await Announcement.create({
    title: 'Engineering all-hands this Friday',
    body: 'Quick sync on the platform migration roadmap. Calendar invite to follow.',
    type: 'event',
    audience: { scope: 'department', refId: engineering._id },
    createdBy: mgr1._id,
  });

  log('Done!');
  log('---------------------------------------------');
  log(`Demo password for every account: ${DEMO_PASSWORD}`);
  log('Admin:   admin@nimbuslabs.io');
  log('HR:      hr@nimbuslabs.io');
  log('Manager: marcus.chen@nimbuslabs.io (Platform Engineering)');
  log('Manager: elena.rodriguez@nimbuslabs.io (Frontend Engineering)');
  log('Manager: sam.okafor@nimbuslabs.io (Product & Design)');
  log(`Employees: ${employees.length} accounts, e.g. liam.johnson@nimbuslabs.io`);
  log('---------------------------------------------');

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('[seed] Failed:', err);
  process.exit(1);
});
