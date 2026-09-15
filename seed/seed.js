// Populates the database with a realistic demo org of 50 default employees:
// 1 admin, 1 HR, 5 managers, 43 team members across 4 departments and 6 teams,
// placed across 3 office floors with live map desk assignments, attendance
// (including today's live presence), leave balances, tasks, goals, recognitions,
// and performance history.
//
// Run with: npm run seed (from server/)

import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';

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
import { Floor } from '../models/Floor.js';
import { Desk } from '../models/Desk.js';

const SALT_ROUNDS = 12;
const DEMO_PASSWORD = 'Password123!';

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[rand(0, arr.length - 1)];
const weightedPick = (options) => {
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
    Floor, Desk,
  ];
  await Promise.all(models.map((m) => m.deleteMany({})));
  await Desk.collection.dropIndexes().catch(() => {});
  await Desk.syncIndexes().catch(() => {});
  log('Cleared existing collections and refreshed indexes');
}

async function createUserAndEmployee({ name, email, role, designation, department, team, manager, office, skills, joiningDaysAgo }) {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, SALT_ROUNDS);
  const user = await User.create({ email: email.toLowerCase(), passwordHash, role, isActive: true });
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

// Generates ~28 weekdays of attendance history ending yesterday
async function seedAttendanceHistory(employeeId, holidayDate) {
  const records = [];
  let d = daysAgo(28);
  const end = daysAgo(1);

  while (d <= end) {
    const isHoliday = holidayDate && startOfDay(d).getTime() === startOfDay(holidayDate).getTime();
    if (!isWeekend(d) && !isHoliday) {
      const status = weightedPick([
        { value: 'present', weight: 75 },
        { value: 'remote', weight: 12 },
        { value: 'half-day', weight: 4 },
        { value: 'absent', weight: 5 },
        { value: 'late', weight: 4 },
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
}

// Seed today's attendance so Workforce Command Center map, Overview counters,
// and dashboards are immediately live with color-coded markers.
async function seedTodayAttendance(employees) {
  const today = startOfDay(new Date());
  const now = new Date();
  const records = [];

  // Distribute statuses across the 50 employees:
  // ~33 present, ~9 remote, ~3 half-day, ~2 leave, ~1 absent, ~2 not checked in
  employees.forEach((emp, index) => {
    let status;
    if (index < 33) status = 'present';
    else if (index < 42) status = 'remote';
    else if (index < 45) status = 'half-day';
    else if (index < 47) status = 'leave';
    else if (index < 48) status = 'absent';
    else status = 'not-checked-in'; // no attendance record

    if (status === 'not-checked-in') return;

    if (status === 'absent') {
      records.push({
        employee: emp._id,
        date: today,
        status: 'absent',
        markedBy: 'system',
      });
    } else if (status === 'leave') {
      records.push({
        employee: emp._id,
        date: today,
        status: 'leave',
        markedBy: 'system',
      });
    } else {
      const isRemote = status === 'remote';
      const isHalfDay = status === 'half-day';
      const checkInHour = 9;
      const checkInMinute = rand(0, 35);
      const checkIn = new Date(today);
      checkIn.setUTCHours(checkInHour, checkInMinute, 0, 0);

      let checkOut = null;
      let workingHours = Math.round((Math.max(1, (now - checkIn) / 3600000)) * 10) / 10;
      if (isHalfDay) {
        checkOut = new Date(today);
        checkOut.setUTCHours(13, 30, 0, 0);
        workingHours = 4.5;
      } else if (workingHours > 8.5) {
        workingHours = 8.5;
      }

      records.push({
        employee: emp._id,
        date: today,
        checkIn,
        checkOut,
        workingHours,
        lateByMinutes: checkInMinute > 30 ? checkInMinute - 30 : 0,
        overtimeMinutes: 0,
        mode: isRemote ? 'remote' : 'office',
        status: isHalfDay ? 'half-day' : isRemote ? 'remote' : 'present',
        markedBy: 'self',
      });
    }
  });

  if (records.length) await Attendance.insertMany(records);
}

// Past approved leave + Leave balance allocations
async function seedLeaves(employeeId, managerEmployeeId, year) {
  const start = daysAgo(rand(10, 20));
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  const days = isWeekend(start) || isWeekend(end) ? 1 : 2;

  await Leave.create({
    employee: employeeId,
    type: 'casual',
    startDate: start,
    endDate: isWeekend(end) ? start : end,
    days,
    reason: 'Personal family event',
    status: 'approved',
    approver: managerEmployeeId,
    decidedAt: new Date(start.getTime() - 2 * 24 * 60 * 60 * 1000),
  });

  await LeaveBalance.create({ employee: employeeId, year, type: 'casual', allocated: 12, used: days });
  await LeaveBalance.create({ employee: employeeId, year, type: 'sick', allocated: 10, used: rand(0, 2) });
  await LeaveBalance.create({ employee: employeeId, year, type: 'earned', allocated: 15, used: 0 });
  await LeaveBalance.create({ employee: employeeId, year, type: 'wfh', allocated: 60, used: rand(2, 6) });
  await LeaveBalance.create({ employee: employeeId, year, type: 'emergency', allocated: 5, used: 0 });

  // Clean attendance on leave days and set status leave
  await Attendance.deleteMany({ employee: employeeId, date: { $gte: start, $lte: isWeekend(end) ? start : end } });
  const leaveDays = isWeekend(end) ? [start] : [start, end];
  await Attendance.insertMany(
    leaveDays.filter((d) => !isWeekend(d)).map((d) => ({ employee: employeeId, date: d, status: 'leave', markedBy: 'system' }))
  );
}

async function seedTasksForEmployee(employeeId, managerEmployeeId, teamId) {
  const titles = [
    'Refactor auth middleware and token validation',
    'Build interactive floor plan seating grid',
    'Write automated regression tests for leave workflows',
    'Optimize MongoDB aggregation queries for attendance trends',
    'Implement responsive desk marker tooltips in Command Center',
    'Add department headcount analytics bar charts',
    'Resolve edge case in half-day checkout calculation',
    'Create automated employee onboarding provisioning',
    'Audit accessibility and WCAG compliance for dashboard',
    'Upgrade ESLint and Prettier monorepo config',
    'Design mobile viewports for employee task board',
    'Implement WebSocket heartbeat for live presence updates',
    'Set up Prometheus monitoring for API endpoints',
    'Design user journey maps for self-service leave requests',
    'Optimize Redis caching for employee profile lookups',
  ];

  const count = rand(3, 5);
  const docs = [];
  for (let i = 0; i < count; i += 1) {
    const status = weightedPick([
      { value: 'COMPLETED', weight: 35 },
      { value: 'IN_PROGRESS', weight: 30 },
      { value: 'TODO', weight: 20 },
      { value: 'REVIEW', weight: 10 },
      { value: 'BLOCKED', weight: 5 },
    ]);
    const isOverdue = Math.random() < 0.12 && status !== 'COMPLETED';
    const dueDate = status === 'COMPLETED'
      ? daysAgo(rand(1, 25))
      : isOverdue
        ? daysAgo(rand(1, 6))
        : daysFromNow(rand(1, 24));

    const estimatedHours = rand(4, 20);
    const completedAt = status === 'COMPLETED'
      ? new Date(dueDate.getTime() - rand(0, 2) * 24 * 60 * 60 * 1000)
      : null;

    docs.push({
      title: pick(titles),
      description: 'Standard sprint delivery task with acceptance criteria.',
      assignee: employeeId,
      team: teamId,
      assignedBy: managerEmployeeId,
      priority: pick(['low', 'medium', 'high', 'urgent']),
      status,
      dueDate,
      estimatedHours,
      actualHours: status === 'COMPLETED' ? estimatedHours + rand(-2, 3) : status === 'IN_PROGRESS' ? rand(2, estimatedHours) : 0,
      completedAt,
    });
  }
  await Task.insertMany(docs);
}

async function seedGoalsForEmployee(employeeId, creatorEmployeeId) {
  const titles = [
    'Boost frontend bundle load time and score >90 in Lighthouse',
    'Achieve 85% automated unit test coverage across core modules',
    'Lead cross-department training session on product roadmap',
    'Reduce average bug resolution turnaround by 25%',
    'Design and ship v2 of the workforce command center map',
    'Mentor 2 junior team members through quarterly progression',
  ];
  const count = rand(1, 2);
  const docs = [];
  for (let i = 0; i < count; i += 1) {
    const status = weightedPick([
      { value: 'completed', weight: 30 },
      { value: 'in-progress', weight: 50 },
      { value: 'not-started', weight: 20 },
    ]);
    const progress = status === 'completed' ? 100 : status === 'in-progress' ? rand(25, 85) : 0;
    docs.push({
      employee: employeeId,
      title: pick(titles),
      description: 'Professional quarterly growth and performance milestone.',
      progress,
      status,
      createdBy: creatorEmployeeId,
      dueDate: daysFromNow(rand(15, 60)),
    });
  }
  await Goal.insertMany(docs);
}

async function seedPerformanceFeedback(employeeId, managerEmployeeId, month, year) {
  const comments = [
    'Consistently hits sprint goals with clean, maintainable output.',
    'Exemplary team collaboration and constructive PR reviews.',
    'Great initiative leading the architecture revamp this month.',
    'Fast learner, dependable on complex cross-service integrations.',
    'Excellent cross-functional communication with design and product.',
  ];
  await Performance.create({
    employee: employeeId,
    period: { month, year },
    qualityScore: rand(75, 98),
    collaborationScore: rand(75, 98),
    managerFeedback: [{ author: managerEmployeeId, comment: pick(comments), createdAt: daysAgo(rand(2, 12)) }],
  });
}

// Layout helper that generates structured workstation pods (clusters of desks)
// with comfortable walking aisles between rows and columns.
function generateDeskSlots(count) {
  // Grid: 14 cols (0-13) x 8 rows (0-7)
  // Desk Pod Columns: [1, 2, 3], [5, 6, 7], [9, 10, 11] (aisles at 0, 4, 8, 12, 13)
  // Desk Pod Rows: [1, 2], [4, 5] (aisles at 0, 3, 6, 7)
  const cols = [1, 2, 3, 5, 6, 7, 9, 10, 11];
  const rows = [1, 2, 4, 5];
  const slots = [];

  for (const r of rows) {
    for (const c of cols) {
      slots.push({ x: c, y: r });
      if (slots.length >= count) return slots;
    }
  }
  return slots;
}

async function seatFloor(floor, people, emptyCount) {
  const totalDesks = people.length + emptyCount;
  const positions = generateDeskSlots(totalDesks);

  for (let i = 0; i < people.length; i += 1) {
    const pos = positions[i] || { x: 1 + (i % 10), y: 1 + Math.floor(i / 10) };
    const deskCode = `${floor.floorNumber}-${String(i + 1).padStart(2, '0')}`;
    const desk = await Desk.create({
      floor: floor._id,
      deskCode,
      position: pos,
      assignedEmployee: people[i]._id,
    });
    await Employee.findByIdAndUpdate(people[i]._id, {
      desk: desk._id,
      floor: floor._id,
      office: floor.office,
    });
  }

  // Extra unassigned desks for interactive assign grid testing
  for (let i = 0; i < emptyCount; i += 1) {
    const idx = people.length + i;
    const pos = positions[idx] || { x: 1 + (idx % 10), y: 1 + Math.floor(idx / 10) };
    const deskCode = `${floor.floorNumber}-${String(idx + 1).padStart(2, '0')}`;
    await Desk.create({
      floor: floor._id,
      deskCode,
      position: pos,
    });
  }
}

async function run() {
  await connectDB();
  await clearDatabase();

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  // --- Office & Departments ----------------------------------------------
  log('Creating office, departments, and teams...');
  const office = await Office.create({
    name: 'Nimbus Labs — Bengaluru HQ',
    address: 'Koramangala, Bengaluru',
    timezone: 'Asia/Kolkata',
  });

  const engineering = await Department.create({ name: 'Engineering', office: office._id });
  const product = await Department.create({ name: 'Product & Design', office: office._id });
  const ops = await Department.create({ name: 'Operations & Customer Success', office: office._id });
  const peopleOps = await Department.create({ name: 'People Ops', office: office._id });

  const holiday1 = await Holiday.create({ name: "Founders' Day", date: daysAgo(16), office: office._id });
  await Holiday.create({ name: 'Community Innovation Day', date: daysFromNow(20), office: office._id });

  // --- Leadership (Admin, HR, and 5 Managers) ----------------------------
  log('Creating leadership accounts...');
  // 1. Admin
  const { employee: admin } = await createUserAndEmployee({
    name: 'Ava Patel',
    email: 'admin@nimbuslabs.io',
    role: 'admin',
    designation: 'Head of Operations',
    department: peopleOps._id,
    office: office._id,
    skills: ['Operations', 'Strategy', 'Executive Management'],
    joiningDaysAgo: 450,
  });

  // 2. HR
  const { employee: hr } = await createUserAndEmployee({
    name: 'Harsh Choudhary',
    email: 'hr@nimbuslabs.io',
    role: 'hr',
    designation: 'People Ops Lead',
    department: peopleOps._id,
    office: office._id,
    skills: ['HR Management', 'Talent Acquisition', 'Policy Design'],
    joiningDaysAgo: 400,
  });

  // 3. Platform Manager
  const { employee: mgrPlatform } = await createUserAndEmployee({
    name: 'Marcus Chen',
    email: 'marcus.chen@nimbuslabs.io',
    role: 'manager',
    designation: 'Engineering Manager — Platform',
    department: engineering._id,
    office: office._id,
    skills: ['Node.js', 'Distributed Systems', 'Architecture'],
    joiningDaysAgo: 380,
  });

  // 4. Frontend Manager
  const { employee: mgrFrontend } = await createUserAndEmployee({
    name: 'Elena Rodriguez',
    email: 'elena.rodriguez@nimbuslabs.io',
    role: 'manager',
    designation: 'Engineering Manager — Frontend',
    department: engineering._id,
    office: office._id,
    skills: ['React', 'TypeScript', 'Frontend Architecture'],
    joiningDaysAgo: 360,
  });

  // 5. DevOps & QA Lead
  const { employee: mgrDevOps } = await createUserAndEmployee({
    name: 'Noah Williams',
    email: 'noah.williams@nimbuslabs.io',
    role: 'manager',
    designation: 'DevOps & Reliability Lead',
    department: engineering._id,
    office: office._id,
    skills: ['Kubernetes', 'AWS', 'CI/CD Pipelines'],
    joiningDaysAgo: 350,
  });

  // 6. Product Lead
  const { employee: mgrProduct } = await createUserAndEmployee({
    name: 'Sam Okafor',
    email: 'sam.okafor@nimbuslabs.io',
    role: 'manager',
    designation: 'Head of Product Management',
    department: product._id,
    office: office._id,
    skills: ['Product Strategy', 'Roadmapping', 'Agile'],
    joiningDaysAgo: 340,
  });

  // 7. Operations Manager
  const { employee: mgrOps } = await createUserAndEmployee({
    name: 'Rajesh Gupta',
    email: 'rajesh.gupta@nimbuslabs.io',
    role: 'manager',
    designation: 'Operations & CS Manager',
    department: ops._id,
    office: office._id,
    skills: ['Customer Success', 'Business Operations', 'ERP'],
    joiningDaysAgo: 330,
  });

  // Teams
  const platformTeam = await Team.create({ name: 'Platform Engineering', department: engineering._id, manager: mgrPlatform._id, members: [] });
  const frontendTeam = await Team.create({ name: 'Frontend Engineering', department: engineering._id, manager: mgrFrontend._id, members: [] });
  const devopsTeam = await Team.create({ name: 'DevOps & QA', department: engineering._id, manager: mgrDevOps._id, members: [] });
  const productTeam = await Team.create({ name: 'Product & Design', department: product._id, manager: mgrProduct._id, members: [] });
  const opsTeam = await Team.create({ name: 'Operations & Support', department: ops._id, manager: mgrOps._id, members: [] });
  const peopleTeam = await Team.create({ name: 'People Ops & HR', department: peopleOps._id, manager: hr._id, members: [] });

  await Employee.findByIdAndUpdate(admin._id, { team: peopleTeam._id });
  await Employee.findByIdAndUpdate(hr._id, { team: peopleTeam._id });
  await Employee.findByIdAndUpdate(mgrPlatform._id, { team: platformTeam._id });
  await Employee.findByIdAndUpdate(mgrFrontend._id, { team: frontendTeam._id });
  await Employee.findByIdAndUpdate(mgrDevOps._id, { team: devopsTeam._id });
  await Employee.findByIdAndUpdate(mgrProduct._id, { team: productTeam._id });
  await Employee.findByIdAndUpdate(mgrOps._id, { team: opsTeam._id });

  // --- 43 Team Members (Total 50 employees: 1 Admin + 1 HR + 5 Managers + 43 Team Members) ---
  log('Creating 43 specialized team members (total 50 employees)...');
  const rosterDefinitions = [
    // Platform Team (9 members)
    ['Liam Johnson', 'Senior Backend Engineer', platformTeam, engineering, mgrPlatform, ['Node.js', 'MongoDB', 'Redis']],
    ['Olivia Smith', 'Staff Distributed Systems Engineer', platformTeam, engineering, mgrPlatform, ['Go', 'Kubernetes', 'gRPC']],
    ['James Davis', 'Backend Engineer', platformTeam, engineering, mgrPlatform, ['Python', 'Django', 'PostgreSQL']],
    ['Ava Thompson', 'Backend Engineer', platformTeam, engineering, mgrPlatform, ['Java', 'Spring Boot', 'Kafka']],
    ['Lucas Taylor', 'API Platform Engineer', platformTeam, engineering, mgrPlatform, ['Node.js', 'GraphQL', 'TypeScript']],
    ['Sophia Miller', 'Data Engineer', platformTeam, engineering, mgrPlatform, ['Python', 'Spark', 'Airflow']],
    ['Daniel Evans', 'Backend Engineer', platformTeam, engineering, mgrPlatform, ['Go', 'Docker', 'PostgreSQL']],
    ['Leo Roberts', 'Security Analyst', platformTeam, engineering, mgrPlatform, ['SOC2', 'Penetration Testing', 'SIEM']],
    ['Zoey Carter', 'Technical Writer & API Specialist', platformTeam, engineering, mgrPlatform, ['Markdown', 'API Docs', 'Docusaurus']],

    // Frontend Team (9 members)
    ['Benjamin Wilson', 'Staff Frontend Architect', frontendTeam, engineering, mgrFrontend, ['React', 'TypeScript', 'Next.js']],
    ['Charlotte Moore', 'Senior UI Engineer', frontendTeam, engineering, mgrFrontend, ['CSS', 'Tailwind', 'Figma']],
    ['Lucas Martin', 'Frontend Engineer', frontendTeam, engineering, mgrFrontend, ['React', 'Redux', 'Jest']],
    ['Amelia Anderson', 'Frontend Engineer', frontendTeam, engineering, mgrFrontend, ['Vue.js', 'TypeScript', 'Vite']],
    ['Oliver Garcia', 'Mobile Engineer', frontendTeam, engineering, mgrFrontend, ['React Native', 'iOS', 'Android']],
    ['Isabella Robinson', 'Design Systems Engineer', frontendTeam, engineering, mgrFrontend, ['React', 'Storybook', 'Tailwind']],
    ['Ethan Clark', 'Frontend Engineer', frontendTeam, engineering, mgrFrontend, ['JavaScript', 'HTML5', 'WebSockets']],
    ['Gabriel Phillips', 'Full Stack Engineer', frontendTeam, engineering, mgrFrontend, ['React', 'Node.js', 'PostgreSQL']],
    ['Victoria Torres', 'Accessibility Specialist', frontendTeam, engineering, mgrFrontend, ['WCAG 2.1', 'ARIA', 'Screen Readers']],

    // DevOps & QA Team (5 members)
    ['Emma Brown', 'Senior QA Automation Engineer', devopsTeam, engineering, mgrDevOps, ['Cypress', 'Playwright', 'Jest']],
    ['Alexander White', 'Site Reliability Engineer', devopsTeam, engineering, mgrDevOps, ['AWS', 'Terraform', 'Prometheus']],
    ['Mia Jackson', 'Cloud Security Engineer', devopsTeam, engineering, mgrDevOps, ['Kubernetes', 'AWS', 'Security']],
    ['Henry Thomas', 'QA Automation Engineer', devopsTeam, engineering, mgrDevOps, ['Selenium', 'Python', 'CI/CD']],
    ['Harper Martinez', 'Release Engineer', devopsTeam, engineering, mgrDevOps, ['GitHub Actions', 'Docker', 'Linux']],

    // Product & Design Team (8 members)
    ['Isabella Harris', 'Principal Product Designer', productTeam, product, mgrProduct, ['Figma', 'Prototyping', 'Design Systems']],
    ['Ethan Martin', 'Senior Product Manager', productTeam, product, mgrProduct, ['Product Strategy', 'Roadmapping', 'Agile']],
    ['Evelyn Lewis', 'UI/UX Designer', productTeam, product, mgrProduct, ['Figma', 'User Research', 'Wireframing']],
    ['Mason Walker', 'UX Researcher', productTeam, product, mgrProduct, ['User Testing', 'Surveys', 'Data Analysis']],
    ['Abigail Hall', 'Associate Product Manager', productTeam, product, mgrProduct, ['SQL', 'A/B Testing', 'Metrics']],
    ['Logan Allen', 'Visual & Motion Designer', productTeam, product, mgrProduct, ['Illustrator', 'Figma', 'Motion Design']],
    ['Emily Young', 'Technical Product Manager', productTeam, product, mgrProduct, ['API Specs', 'Scrum', 'Analytics']],
    ['Dylan Flores', 'Product Data Analyst', productTeam, product, mgrProduct, ['SQL', 'Tableau', 'Python']],

    // Operations & Support Team (7 members)
    ['Jackson King', 'Senior Operations Specialist', opsTeam, ops, mgrOps, ['Process Automation', 'ERP', 'SLA']],
    ['Ella Wright', 'Customer Success Lead', opsTeam, ops, mgrOps, ['Zendesk', 'Client Relations', 'CRM']],
    ['Aiden Scott', 'Solutions Engineer', opsTeam, ops, mgrOps, ['SQL', 'Integrations', 'Technical Support']],
    ['Chloe Green', 'Operations Analyst', opsTeam, ops, mgrOps, ['Excel', 'BI Tools', 'Process Mapping']],
    ['Sebastian Baker', 'Implementation Consultant', opsTeam, ops, mgrOps, ['Project Management', 'Client Onboarding']],
    ['Avery Adams', 'Customer Support Specialist', opsTeam, ops, mgrOps, ['Ticket Management', 'Documentation']],
    ['Grace Nelson', 'Business Operations Associate', opsTeam, ops, mgrOps, ['Billing', 'Compliance', 'Reporting']],

    // People Ops & HR Team (5 members)
    ['Carter Hill', 'Senior Talent Acquisition Specialist', peopleTeam, peopleOps, hr, ['Sourcing', 'Interviewing', 'ATS']],
    ['Scarlett Ramirez', 'People Ops Coordinator', peopleTeam, peopleOps, hr, ['Onboarding', 'Payroll', 'Benefits']],
    ['Jayden Campbell', 'HR Business Partner', peopleTeam, peopleOps, hr, ['Employee Relations', 'Performance', 'Coaching']],
    ['Layla Mitchell', 'Workplace Experience Coordinator', peopleTeam, peopleOps, hr, ['Internal Events', 'Office Logistics']],
    ['Hannah Wood', 'People Operations Generalist', peopleTeam, peopleOps, hr, ['HR Policies', 'Compensation', 'Training']],
  ];

  const teamMembers = [];
  for (const [name, designation, team, department, manager, skills] of rosterDefinitions) {
    const email = `${name.toLowerCase().replace(/[^a-z0-9]/g, '.')}@nimbuslabs.io`;
    const { employee } = await createUserAndEmployee({
      name,
      email,
      role: 'employee',
      designation,
      department: department._id,
      team: team._id,
      manager: manager._id,
      office: office._id,
      skills,
      joiningDaysAgo: rand(45, 320),
    });
    teamMembers.push({ employee, team, manager, department });
  }

  // Update team members arrays
  for (const t of [platformTeam, frontendTeam, devopsTeam, productTeam, opsTeam, peopleTeam]) {
    const memberIds = teamMembers.filter((m) => m.team._id.equals(t._id)).map((m) => m.employee._id);
    await Team.findByIdAndUpdate(t._id, { members: memberIds });
  }

  // All 50 employees in order
  const allEmployees = [
    admin, hr, mgrPlatform, mgrFrontend, mgrDevOps, mgrProduct, mgrOps,
    ...teamMembers.map((m) => m.employee),
  ];

  log(`Total Employees created: ${allEmployees.length}`);

  // --- Office floor plans & Desk seating (Workforce Command Center Map) ---
  log('Setting up 3 floor plans and seating assignments...');
  const floor1 = await Floor.create({
    office: office._id,
    name: 'Floor 1 — Engineering & Systems',
    floorNumber: 1,
    gridWidth: 14,
    gridHeight: 8,
  });
  const floor2 = await Floor.create({
    office: office._id,
    name: 'Floor 2 — Product, Design & Operations',
    floorNumber: 2,
    gridWidth: 14,
    gridHeight: 8,
  });
  const floor3 = await Floor.create({
    office: office._id,
    name: 'Floor 3 — Leadership & People Ops',
    floorNumber: 3,
    gridWidth: 14,
    gridHeight: 8,
  });

  // Seating breakdown:
  // Floor 1 (26 employees): Marcus, Elena, Noah, 9 Platform, 9 Frontend, 5 DevOps/QA + 2 empty desks = 28 desks
  const floor1People = [
    mgrPlatform, mgrFrontend, mgrDevOps,
    ...teamMembers
      .filter((m) => [platformTeam._id, frontendTeam._id, devopsTeam._id].some((id) => id.equals(m.team._id)))
      .map((m) => m.employee),
  ];

  // Floor 2 (17 employees): Sam, Rajesh, 8 Product/Design, 7 Operations + 3 empty desks = 20 desks
  const floor2People = [
    mgrProduct, mgrOps,
    ...teamMembers
      .filter((m) => [productTeam._id, opsTeam._id].some((id) => id.equals(m.team._id)))
      .map((m) => m.employee),
  ];

  // Floor 3 (7 employees): Ava (Admin), Priya (HR), 5 People Ops members + 5 empty desks = 12 desks
  const floor3People = [
    admin, hr,
    ...teamMembers
      .filter((m) => peopleTeam._id.equals(m.team._id))
      .map((m) => m.employee),
  ];

  await seatFloor(floor1, floor1People, 2);
  await seatFloor(floor2, floor2People, 3);
  await seatFloor(floor3, floor3People, 5);

  log(`Seated ${floor1People.length} on Floor 1, ${floor2People.length} on Floor 2, ${floor3People.length} on Floor 3`);

  // --- Attendance History & Today's Live Attendance ---
  log('Generating attendance history (28 days) and today\'s live presence...');
  for (const emp of allEmployees) {
    await seedAttendanceHistory(emp._id, holiday1.date);
  }
  await seedTodayAttendance(allEmployees);

  // --- Leaves, Tasks, Goals, and Performance ---
  log('Seeding leaves, tasks, goals, and performance reviews...');
  for (const { employee, manager, team } of teamMembers) {
    await seedLeaves(employee._id, manager._id, year);
    await seedTasksForEmployee(employee._id, manager._id, team._id);
    await seedGoalsForEmployee(employee._id, Math.random() > 0.4 ? manager._id : employee._id);
    await seedPerformanceFeedback(employee._id, manager._id, month, year);
  }

  // Managers and leadership tasks/goals
  for (const mgr of [admin, hr, mgrPlatform, mgrFrontend, mgrDevOps, mgrProduct, mgrOps]) {
    await seedLeaves(mgr._id, admin._id, year);
    await seedGoalsForEmployee(mgr._id, admin._id);
    await seedPerformanceFeedback(mgr._id, admin._id, month, year);
  }

  // Pending leaves for HR & Managers to review/approve
  const pendingCandidates = [teamMembers[0], teamMembers[9], teamMembers[18], teamMembers[23]];
  for (const m of pendingCandidates) {
    await Leave.create({
      employee: m.employee._id,
      type: pick(['casual', 'sick', 'wfh']),
      startDate: daysFromNow(2),
      endDate: daysFromNow(3),
      days: 2,
      reason: 'Scheduled personal leave requirement',
      status: 'pending',
    });
  }

  // --- Peer Recognitions ---
  log('Seeding recognitions...');
  const categories = ['teamwork', 'leadership', 'innovation', 'helping', 'excellence'];
  const praiseMessages = [
    'Outstanding support triaging the production issue quickly!',
    'Meticulous code review with very helpful architecture insights.',
    'Led the cross-team sync smoothly and aligned everyone on delivery.',
    'Great pair programming session resolving the stubborn frontend bug.',
    'Shipped the new feature ahead of schedule with zero defects.',
    'Always proactive in documenting API specifications and edge cases.',
    'Helped onboard the newest team members with patience and care.',
    'Fantastic contribution to improving test automation coverage!',
  ];
  for (let i = 0; i < 26; i += 1) {
    const from = pick(allEmployees);
    let to = pick(allEmployees);
    while (String(to._id) === String(from._id)) to = pick(allEmployees);
    await Recognition.create({
      from: from._id,
      to: to._id,
      category: pick(categories),
      message: pick(praiseMessages),
      createdAt: daysAgo(rand(1, 15)),
    });
  }

  // --- Announcements ---
  log('Seeding announcements...');
  await Announcement.create({
    title: 'Welcome to the Workforce ERP Platform',
    body: 'We are excited to roll out the updated Workforce Command Center, analytics dashboards, and interactive floor plans for all teams.',
    type: 'company',
    audience: { scope: 'company', refId: null },
    createdBy: hr._id,
  });
  await Announcement.create({
    title: 'Hybrid Workplace & Desk Assignment Guidelines',
    body: 'Employees working from the office can view their desk on the Workforce Command Center map. Please check in upon arrival.',
    type: 'policy',
    audience: { scope: 'company', refId: null },
    createdBy: hr._id,
  });
  await Announcement.create({
    title: 'Engineering & Architecture All-Hands',
    body: 'Quarterly review of platform performance, microservices, and upcoming Q4 tech initiatives this Thursday.',
    type: 'event',
    audience: { scope: 'department', refId: engineering._id },
    createdBy: mgrPlatform._id,
  });
  await Announcement.create({
    title: 'Product Design Sprint & Feature Showcase',
    body: 'Join the product and design team on Friday afternoon to preview the upcoming dashboard widgets and customer feedback loops.',
    type: 'event',
    audience: { scope: 'department', refId: product._id },
    createdBy: mgrProduct._id,
  });

  log('=============================================');
  log('Database successfully seeded with 50 default employees!');
  log(`All accounts password: ${DEMO_PASSWORD}`);
  log('Admin Account:    admin@nimbuslabs.io');
  log('HR Account:       hr@nimbuslabs.io');
  log('Manager Accounts:');
  log('  - marcus.chen@nimbuslabs.io     (Platform Engineering)');
  log('  - elena.rodriguez@nimbuslabs.io (Frontend Engineering)');
  log('  - noah.williams@nimbuslabs.io   (DevOps & QA)');
  log('  - sam.okafor@nimbuslabs.io      (Product & Design)');
  log('  - rajesh.gupta@nimbuslabs.io    (Operations & Support)');
  log(`Total active employee profiles: ${allEmployees.length}`);
  log('Floor 1: Engineering (28 desks, 26 assigned, 2 open)');
  log('Floor 2: Product & Operations (20 desks, 17 assigned, 3 open)');
  log('Floor 3: Leadership & People Ops (12 desks, 7 assigned, 5 open)');
  log('=============================================');

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('[seed] Seed script failed:', err);
  process.exit(1);
});
