import { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { useTheme } from '../../hooks/useTheme.js';
import NotificationBell from './NotificationBell.jsx';
import { NavIcon } from '../ui/icons.jsx';

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
    { label: 'Workforce map', to: '/workforce' },
    { label: 'Reports', to: '/reports' },
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
    { label: 'Workforce map', to: '/workforce' },
    { label: 'Office setup', to: '/hr/office-setup' },
    { label: 'Reports', to: '/reports' },
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
    { label: 'Workforce map', to: '/workforce' },
    { label: 'Office setup', to: '/hr/office-setup' },
    { label: 'Reports', to: '/reports' },
    { label: 'Announcements', to: '/announcements' },
    { label: 'Recognition', to: '/recognition' },
    { label: 'Messages', to: '/messages' },
    { label: 'My profile', to: '/profile' },
  ],
};

const ROLE_STYLE = {
  employee: {
    label: 'Employee',
    gradient: 'from-primary-500 to-primary-600',
    chip: 'bg-primary-500/15 text-primary-300 border-primary-500/25',
    badge: 'bg-primary-500/20 text-primary-300 ring-1 ring-primary-500/30',
  },
  manager: {
    label: 'Manager',
    gradient: 'from-amber-400 to-amber-500',
    chip: 'bg-amber-400/15 text-amber-300 border-amber-400/25',
    badge: 'bg-amber-400/20 text-amber-300 ring-1 ring-amber-400/30',
  },
  hr: {
    label: 'HR',
    gradient: 'from-safety-400 to-safety-500',
    chip: 'bg-safety-500/15 text-orange-300 border-safety-500/25',
    badge: 'bg-safety-500/20 text-orange-300 ring-1 ring-safety-500/30',
  },
  admin: {
    label: 'Admin',
    gradient: 'from-violet-400 to-violet-500',
    chip: 'bg-violet-400/15 text-violet-300 border-violet-400/25',
    badge: 'bg-violet-400/20 text-violet-300 ring-1 ring-violet-400/30',
  },
};

function getAvatarUrl(name) {
  const encoded = encodeURIComponent(name || 'U');
  return `https://ui-avatars.com/api/?name=${encoded}&background=2563eb&color=fff&bold=true&size=64`;
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="h-4 w-4">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="h-4 w-4">
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
    </svg>
  );
}

function HamburgerIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="h-5 w-5">
      <path d="M3 12h18M3 6h18M3 18h18" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="h-5 w-5">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="h-4 w-4">
      <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  );
}

function SidebarContent({ nav, role, displayName, onLinkClick }) {
  return (
    <nav className="mt-1 flex flex-1 flex-col overflow-y-auto px-3 pb-2">
      {/* Nav section label */}
      <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-white/25">
        Navigation
      </p>

      <div className="flex flex-col gap-0.5">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onLinkClick}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-white/12 text-white shadow-sm'
                  : 'text-white/60 hover:bg-white/6 hover:text-white/90'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all duration-150 ${
                    isActive
                      ? `bg-gradient-to-br ${role.gradient} text-white shadow-sm`
                      : 'text-white/50 group-hover:text-white/80'
                  }`}
                >
                  <NavIcon label={item.label} className="h-3.5 w-3.5" />
                </span>
                <span className="truncate">{item.label}</span>
                {isActive && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white/60" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

export default function DashboardLayout() {
  const { user, employee, logout } = useAuth();
  const { isDark, toggle: toggleDark } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const nav = NAV_BY_ROLE[user?.role] || [];
  const role = ROLE_STYLE[user?.role] || ROLE_STYLE.employee;
  const displayName = employee?.name || user?.email || 'User';

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const SidebarShell = ({ children, className = '' }) => (
    <div
      className={`flex w-64 flex-col ${className}`}
      style={{ background: 'linear-gradient(180deg, #0d1520 0%, #0f1c2e 60%, #101828 100%)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 shrink-0">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-lg shadow-primary-500/30">
          <svg className="h-4.5 w-4.5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
          </svg>
        </div>
        <div>
          <span className="text-base font-bold tracking-tight text-white">WorkHub</span>
          <span className="ml-1 text-[10px] font-medium text-white/30 align-super">ERP</span>
        </div>
      </div>

      {/* Thin separator */}
      <div className="mx-4 h-px bg-white/6 shrink-0" />

      {/* User mini-card */}
      <div className="mx-3 mt-3 mb-2 flex items-center gap-2.5 rounded-xl bg-white/5 p-2.5 shrink-0">
        <img
          src={getAvatarUrl(displayName)}
          alt={displayName}
          className="h-8 w-8 rounded-lg object-cover"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{displayName}</p>
          <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${role.badge}`}>
            {role.label}
          </span>
        </div>
      </div>

      {/* Nav */}
      <SidebarContent nav={nav} role={role} displayName={displayName} onLinkClick={() => setMobileOpen(false)} />

      {/* Bottom actions */}
      <div className="mx-3 mb-4 mt-auto shrink-0 space-y-1">
        <div className="h-px bg-white/6 mb-2" />
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-white/50 hover:bg-red-500/10 hover:text-red-400 transition-all duration-150"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg">
            <LogoutIcon />
          </span>
          Sign out
        </button>
      </div>

      {children}
    </div>
  );

  return (
    <div className="flex min-h-screen bg-surface dark:bg-[#0c1117]">
      {/* ── Desktop Sidebar ─────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col no-print sticky top-0 h-screen">
        <SidebarShell />
      </aside>

      {/* ── Mobile Sidebar Drawer ──────────────────────────── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 flex lg:hidden"
          role="dialog"
          aria-modal="true"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <div className="relative flex flex-col shadow-2xl z-50 animate-slide-in-right">
            <div className="absolute top-4 right-4 z-10">
              <button
                onClick={() => setMobileOpen(false)}
                className="rounded-lg bg-white/10 p-1.5 text-white/70 hover:bg-white/20 hover:text-white"
                aria-label="Close menu"
              >
                <CloseIcon />
              </button>
            </div>
            <SidebarShell />
          </div>
        </div>
      )}

      {/* ── Main Content ──────────────────────────────────── */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between bg-white/80 dark:bg-gunmetal-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-gunmetal-700/60 px-4 sm:px-6 py-3.5 no-print shadow-sm">
          <div className="flex items-center gap-3">
            {/* Hamburger — mobile only */}
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:text-white/50 dark:hover:bg-white/8 transition-colors lg:hidden"
              aria-label="Open menu"
            >
              <HamburgerIcon />
            </button>

            {/* Page context */}
            <div>
              <p className="text-base font-bold leading-tight text-slate-900 dark:text-white">
                {displayName}
              </p>
              <p className="hidden text-xs text-slate-400 dark:text-slate-500 sm:block">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <NotificationBell />

            {/* Dark mode toggle */}
            <button
              onClick={toggleDark}
              className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:text-white/50 dark:hover:bg-white/8 transition-all duration-200"
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              title={isDark ? 'Light mode' : 'Dark mode'}
            >
              {isDark ? <SunIcon /> : <MoonIcon />}
            </button>

            {/* Avatar + role chip */}
            <div className="hidden sm:flex items-center gap-2 pl-1">
              <img
                src={getAvatarUrl(displayName)}
                alt={displayName}
                className="h-8 w-8 rounded-lg object-cover ring-2 ring-primary-100 dark:ring-primary-900/50"
              />
              <span
                className={`hidden lg:inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-semibold ${role.chip} dark:border-white/10`}
              >
                {role.label}
              </span>
            </div>

            {/* Logout button - desktop */}
            <button
              onClick={logout}
              className="hidden sm:flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-gunmetal-600 px-3 py-1.5 text-xs font-semibold text-slate-500 dark:text-white/50 transition-all duration-200 hover:border-red-300 dark:hover:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400"
            >
              <LogoutIcon />
              <span className="hidden md:inline">Sign out</span>
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 page-enter">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
