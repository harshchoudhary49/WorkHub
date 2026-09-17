import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute.jsx';
import RoleRedirect from './RoleRedirect.jsx';
import DashboardLayout from '../components/layout/DashboardLayout.jsx';
import Login from '../pages/auth/Login.jsx';
import Register from '../pages/auth/Register.jsx';
import Unauthorized from '../pages/auth/Unauthorized.jsx';
import NotFound from '../pages/auth/NotFound.jsx';
import EmployeeDashboard from '../pages/employee/Dashboard.jsx';
import EmployeeAttendance from '../pages/employee/Attendance.jsx';
import EmployeeLeaves from '../pages/employee/Leaves.jsx';
import EmployeeTasks from '../pages/employee/Tasks.jsx';
import EmployeeGoals from '../pages/employee/Goals.jsx';
import EmployeePerformance from '../pages/employee/Performance.jsx';
import Profile from '../pages/employee/Profile.jsx';
import Announcements from '../pages/shared/Announcements.jsx';
import Recognition from '../pages/shared/Recognition.jsx';
import Messages from '../pages/shared/Messages.jsx';
import ManagerDashboard from '../pages/manager/Dashboard.jsx';
import ManagerAttendance from '../pages/manager/Attendance.jsx';
import ManagerLeaves from '../pages/manager/Leaves.jsx';
import ManagerTasks from '../pages/manager/Tasks.jsx';
import ManagerGoals from '../pages/manager/Goals.jsx';
import ManagerPerformance from '../pages/manager/Performance.jsx';
import HrAdminDashboard from '../pages/hr-admin/Dashboard.jsx';
import Employees from '../pages/hr-admin/Employees.jsx';
import Departments from '../pages/hr-admin/Departments.jsx';
import Teams from '../pages/hr-admin/Teams.jsx';
import Offices from '../pages/hr-admin/Offices.jsx';
import HrAttendance from '../pages/hr-admin/Attendance.jsx';
import Holidays from '../pages/hr-admin/Holidays.jsx';
import HrLeaves from '../pages/hr-admin/Leaves.jsx';
import HrTasks from '../pages/hr-admin/Tasks.jsx';
import HrGoals from '../pages/hr-admin/Goals.jsx';
import HrPerformance from '../pages/hr-admin/Performance.jsx';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Any authenticated role */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<RoleRedirect />} />

        <Route element={<DashboardLayout />}>
          <Route path="/employee/dashboard" element={<EmployeeDashboard />} />
          <Route path="/attendance" element={<EmployeeAttendance />} />
          <Route path="/leaves" element={<EmployeeLeaves />} />
          <Route path="/tasks" element={<EmployeeTasks />} />
          <Route path="/goals" element={<EmployeeGoals />} />
          <Route path="/performance" element={<EmployeePerformance />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/announcements" element={<Announcements />} />
          <Route path="/recognition" element={<Recognition />} />
          <Route path="/messages" element={<Messages />} />

          <Route element={<ProtectedRoute roles={['manager']} />}>
            <Route path="/manager/dashboard" element={<ManagerDashboard />} />
            <Route path="/manager/attendance" element={<ManagerAttendance />} />
            <Route path="/manager/leaves" element={<ManagerLeaves />} />
            <Route path="/manager/tasks" element={<ManagerTasks />} />
            <Route path="/manager/goals" element={<ManagerGoals />} />
            <Route path="/manager/performance" element={<ManagerPerformance />} />
          </Route>

          <Route element={<ProtectedRoute roles={['hr', 'admin']} />}>
            <Route path="/hr/dashboard" element={<HrAdminDashboard />} />
            <Route path="/hr/employees" element={<Employees />} />
            <Route path="/hr/departments" element={<Departments />} />
            <Route path="/hr/teams" element={<Teams />} />
            <Route path="/hr/offices" element={<Offices />} />
            <Route path="/hr/attendance" element={<HrAttendance />} />
            <Route path="/hr/holidays" element={<Holidays />} />
            <Route path="/hr/leaves" element={<HrLeaves />} />
            <Route path="/hr/tasks" element={<HrTasks />} />
            <Route path="/hr/goals" element={<HrGoals />} />
            <Route path="/hr/performance" element={<HrPerformance />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
