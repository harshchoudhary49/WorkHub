import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import TextField from '../../components/ui/TextField.jsx';
import Button from '../../components/ui/Button.jsx';

const ROLE_LANDING = {
  employee: '/employee/dashboard',
  manager: '/manager/dashboard',
  hr: '/hr/dashboard',
  admin: '/hr/dashboard',
};

const DEMO_ACCOUNTS = [
  {
    label: 'Admin',
    name: 'Ava Patel',
    email: 'admin@nimbuslabs.io',
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    color: 'from-violet-500/10 to-violet-600/5 border-violet-200 hover:border-violet-400',
    textColor: 'text-violet-700 dark:text-violet-400',
    dotColor: 'bg-violet-500',
  },
  {
    label: 'HR',
    name: 'Harsh Choudhary',
    email: 'hr@nimbuslabs.io',
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
    color: 'from-safety-500/10 to-safety-600/5 border-orange-200 hover:border-orange-400',
    textColor: 'text-orange-700 dark:text-orange-400',
    dotColor: 'bg-orange-500',
  },
  {
    label: 'Manager',
    name: 'Marcus Chen',
    email: 'marcus.chen@nimbuslabs.io',
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
    color: 'from-amber-500/10 to-amber-600/5 border-amber-200 hover:border-amber-400',
    textColor: 'text-amber-700 dark:text-amber-400',
    dotColor: 'bg-amber-500',
  },
  {
    label: 'Employee',
    name: 'Liam Johnson',
    email: 'liam.johnson@nimbuslabs.io',
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    color: 'from-primary-500/10 to-primary-600/5 border-primary-200 hover:border-primary-400',
    textColor: 'text-primary-700 dark:text-primary-400',
    dotColor: 'bg-primary-500',
  },
];

const FEATURES = [
  { icon: '📊', text: 'Real-time analytics & dashboards' },
  { icon: '🗓️', text: 'Smart attendance & leave management' },
  { icon: '🎯', text: 'Goal tracking & performance reviews' },
  { icon: '⚡', text: 'Kanban task boards & team collaboration' },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      navigate(ROLE_LANDING[user.role] || '/employee/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-5 bg-surface dark:bg-surface-dark">
      {/* ── Left Brand Panel ──────────────────────────────── */}
      <div className="relative hidden lg:flex lg:col-span-2 flex-col overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900 via-primary-800 to-gunmetal-900" />

        {/* Mesh pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.6) 1px, transparent 0)`,
            backgroundSize: '28px 28px',
          }}
        />

        {/* Glowing orbs */}
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-primary-500/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-violet-500/15 blur-3xl" />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full p-12">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
              <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight text-white">WorkHub ERP</span>
          </div>

          {/* Headline */}
          <div className="mt-auto mb-12">
            <h1 className="text-4xl font-extrabold leading-tight text-white">
              Workforce management,{' '}
              <span className="text-amber-400">reimagined.</span>
            </h1>
            <p className="mt-4 text-base text-primary-200 leading-relaxed max-w-xs">
              Everything your team needs — attendance, leaves, tasks, goals, and performance — in one beautiful platform.
            </p>

            {/* Features */}
            <ul className="mt-8 space-y-3">
              {FEATURES.map((f, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-primary-100">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-base">
                    {f.icon}
                  </span>
                  {f.text}
                </li>
              ))}
            </ul>
          </div>

          {/* Footer */}
          <p className="text-xs text-primary-400">
            © {new Date().getFullYear()} WorkHub ERP · All rights reserved
          </p>
        </div>
      </div>

      {/* ── Right Form Panel ──────────────────────────────── */}
      <div className="col-span-1 lg:col-span-3 flex items-center justify-center px-6 py-16 bg-white dark:bg-gunmetal-900">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600">
              <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
              </svg>
            </div>
            <span className="text-lg font-bold text-slate-900 dark:text-white">WorkHub ERP</span>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Welcome back
            </h2>
            <p className="mt-2 text-slate-500 dark:text-slate-400">
              Sign in to your workspace to continue.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <TextField
              label="Work email"
              type="email"
              placeholder="you@company.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              icon={
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              }
            />

            <div>
              <TextField
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                icon={
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                }
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="mt-1.5 text-xs text-primary-600 dark:text-primary-400 hover:underline"
              >
                {showPassword ? 'Hide' : 'Show'} password
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2.5 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">
                <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            <Button
              type="submit"
              loading={loading}
              size="lg"
              className="w-full mt-2"
            >
              Sign in to workspace
            </Button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 border-t border-slate-200 dark:border-gunmetal-700" />
            <span className="text-xs text-slate-400 dark:text-slate-500">Quick demo accounts</span>
            <div className="flex-1 border-t border-slate-200 dark:border-gunmetal-700" />
          </div>

          {/* Demo accounts grid */}
          <div className="grid grid-cols-2 gap-2">
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.label}
                type="button"
                onClick={() => setForm({ email: account.email, password: 'Password123!' })}
                className={`group flex items-center gap-2.5 rounded-xl border bg-gradient-to-br p-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 ${account.color}`}
              >
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/60 dark:bg-black/20 ${account.textColor}`}>
                  {account.icon}
                </div>
                <div className="min-w-0">
                  <div className={`flex items-center gap-1.5 text-xs font-bold ${account.textColor}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${account.dotColor}`} />
                    {account.label}
                  </div>
                  <p className="truncate text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {account.name}
                  </p>
                </div>
              </button>
            ))}
          </div>

          <p className="mt-3 text-center text-xs text-slate-400 dark:text-slate-500">
            Password for all accounts:{' '}
            <code className="rounded bg-slate-100 dark:bg-gunmetal-700 px-1.5 py-0.5 font-mono text-slate-600 dark:text-slate-300">
              Password123!
            </code>
          </p>

          <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            New here?{' '}
            <Link to="/register" className="font-semibold text-primary-600 dark:text-primary-400 hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
