import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import NotificationBell from './NotificationBell.jsx';

const NAV_BY_ROLE = {
  employee: [
    { label: 'Dashboard', to: '/employee/dashboard' },
    { label: 'Attendance', to: '/attendance' },
    { label: 'Leaves', to: '/leaves' },
    { label: 'Tasks', to: '/tasks' },
    { label: 'Goals', to: '/goals' },
    { label: 'Performance', to: '/performance' },
    { label: 'Announcements', to: '/announcements' },
    { label: 'Recognition', to: '/recognition' },
    { label: 'Messages', to: '/messages' },
    { label: 'My profile', to: '/profile' },
  ],
  manager: [
    { label: 'Dashboard', to: '/manager/dashboard' },
    { label: 'Team attendance', to: '/manager/attendance' },
    { label: 'Leave requests', to: '/manager/leaves' },
    { label: 'Team tasks', to: '/manager/tasks' },
    { label: 'Team goals', to: '/manager/goals' },
    { label: 'Team performance', to: '/manager/performance' },
    { label: 'Announcements', to: '/announcements' },
    { label: 'Recognition', to: '/recognition' },
    { label: 'Messages', to: '/messages' },
    { label: 'My profile', to: '/profile' },
  ],
  hr: [
    { label: 'Dashboard', to: '/hr/dashboard' },
    { label: 'Employees', to: '/hr/employees' },
    { label: 'Departments', to: '/hr/departments' },
    { label: 'Teams', to: '/hr/teams' },
    { label: 'Offices', to: '/hr/offices' },
    { label: 'Attendance', to: '/hr/attendance' },
    { label: 'Holidays', to: '/hr/holidays' },
    { label: 'Leaves', to: '/hr/leaves' },
    { label: 'Tasks', to: '/hr/tasks' },
    { label: 'Goals', to: '/hr/goals' },
    { label: 'Performance', to: '/hr/performance' },
    { label: 'Announcements', to: '/announcements' },
    { label: 'Recognition', to: '/recognition' },
    { label: 'Messages', to: '/messages' },
    { label: 'My profile', to: '/profile' },
  ],
  admin: [
    { label: 'Dashboard', to: '/hr/dashboard' },
    { label: 'Employees', to: '/hr/employees' },
    { label: 'Departments', to: '/hr/departments' },
    { label: 'Teams', to: '/hr/teams' },
    { label: 'Offices', to: '/hr/offices' },
    { label: 'Attendance', to: '/hr/attendance' },
    { label: 'Holidays', to: '/hr/holidays' },
    { label: 'Leaves', to: '/hr/leaves' },
    { label: 'Tasks', to: '/hr/tasks' },
    { label: 'Goals', to: '/hr/goals' },
    { label: 'Performance', to: '/hr/performance' },
    { label: 'Announcements', to: '/announcements' },
    { label: 'Recognition', to: '/recognition' },
    { label: 'Messages', to: '/messages' },
    { label: 'My profile', to: '/profile' },
  ],
};

// Minimal shell for Phase 2. Phase 9 expands this with the full nav tree
// (Attendance, Leaves, Tasks, Team, Reports, etc.) per role.
export default function DashboardLayout() {
  const { user, employee, logout } = useAuth();
  const nav = NAV_BY_ROLE[user?.role] || [];

  return (
    <div className="flex min-h-screen bg-surface">
      <aside className="hidden w-60 flex-col border-r border-slate-200 bg-white px-4 py-6 lg:flex">
        <span className="px-2 text-lg font-bold text-primary-800">Workforce</span>
        <nav className="mt-8 flex flex-col gap-1">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive ? 'bg-primary-50 text-primary-800' : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <div>
            <p className="text-sm text-slate-500">Welcome back,</p>
            <p className="font-semibold text-slate-900">{employee?.name || user?.email}</p>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell />
            <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-medium capitalize text-primary-700">
              {user?.role}
            </span>
            <button
              onClick={logout}
              className="text-sm font-medium text-slate-500 hover:text-slate-800"
            >
              Log out
            </button>
          </div>
        </header>
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
