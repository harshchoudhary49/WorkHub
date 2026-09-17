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

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      navigate(ROLE_LANDING[user.role] || '/employee/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-5">
      {/* Left: brand panel - a quiet grid of dots standing in for the org
          chart / floor-map idea that runs through the whole product,
          rather than a generic gradient hero. */}
      <div className="relative hidden overflow-hidden bg-primary-900 lg:col-span-2 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage: 'radial-gradient(circle, #a5b4fc 1px, transparent 1px)',
            backgroundSize: '22px 22px',
          }}
        />
        <div className="relative z-10">
          <span className="text-lg font-bold tracking-tight text-white">Workforce</span>
        </div>
        <div className="relative z-10 max-w-sm">
          <p className="text-2xl font-semibold leading-snug text-white">
            One place to run attendance, leave, tasks and team performance.
          </p>
          <p className="mt-4 text-sm text-primary-200">
            Built for engineering teams that want visibility without surveillance.
          </p>
        </div>
        <div className="relative z-10 text-xs text-primary-300">
          &copy; {new Date().getFullYear()} Workforce ERP
        </div>
      </div>

      {/* Right: form */}
      <div className="col-span-1 flex items-center justify-center bg-white px-6 py-16 lg:col-span-3">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold text-slate-900">Sign in</h1>
          <p className="mt-1.5 text-sm text-slate-500">Use your work email to continue.</p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <TextField
              label="Work email"
              type="email"
              placeholder="you@company.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
            <TextField
              label="Password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />

            {error && (
              <p className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-600">{error}</p>
            )}

            <Button type="submit" loading={loading} className="w-full">
              Sign in
            </Button>
          </form>

          <p className="mt-6 text-sm text-slate-500">
            New here?{' '}
            <Link to="/register" className="font-medium text-primary-700 hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
