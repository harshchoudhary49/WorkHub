import { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from 'recharts';
import { analyticsApi } from '../../api/analyticsApi.js';
import Banner from '../../components/ui/Banner.jsx';

const ATTENDANCE_COLORS = { present: '#4338ca', remote: '#0284c7', leave: '#7c3aed', absent: '#ef4444', 'half-day': '#f59e0b' };

const formatDay = (iso) => new Date(iso).toLocaleDateString('default', { month: 'short', day: 'numeric' });

export default function HrAdminDashboard() {
  const [overview, setOverview] = useState(null);
  const [trend, setTrend] = useState([]);
  const [headcount, setHeadcount] = useState([]);
  const [taskCompletion, setTaskCompletion] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      analyticsApi.overview(),
      analyticsApi.attendanceTrend(14),
      analyticsApi.headcountByDepartment(),
      analyticsApi.taskCompletionByDepartment(),
    ])
      .then(([ov, tr, hc, tc]) => {
        setOverview(ov.data.data);
        setTrend(tr.data.data.map((d) => ({ ...d, day: formatDay(d.date) })));
        setHeadcount(hc.data.data);
        setTaskCompletion(tc.data.data);
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load dashboard'));
  }, []);

  if (error) return <Banner>{error}</Banner>;
  if (!overview) return <p className="text-sm text-slate-500">Loading...</p>;

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-900">Organization overview</h1>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Employees</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{overview.totalEmployees}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Present today</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {(overview.todayAttendance.present || 0) + (overview.todayAttendance.remote || 0)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Pending leaves</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{overview.pendingLeaves}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Overdue tasks</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{overview.overdueTasks}</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm font-medium text-slate-700">Attendance trend (last 14 days)</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="present" stroke={ATTENDANCE_COLORS.present} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="remote" stroke={ATTENDANCE_COLORS.remote} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="leave" stroke={ATTENDANCE_COLORS.leave} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="absent" stroke={ATTENDANCE_COLORS.absent} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm font-medium text-slate-700">Headcount by department</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={headcount}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="department" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#4338ca" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm font-medium text-slate-700">Task completion by department</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={taskCompletion}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="department" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 11 }} unit="%" />
                <Tooltip />
                <Bar dataKey="completionPercentage" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm font-medium text-slate-700">Upcoming holidays</p>
          <div className="mt-3 space-y-2">
            {overview.upcomingHolidays.length === 0 ? (
              <p className="text-sm text-slate-400">Nothing in the next 30 days</p>
            ) : (
              overview.upcomingHolidays.map((h) => (
                <div key={h._id} className="flex items-center justify-between text-sm">
                  <span className="text-slate-700">{h.name}</span>
                  <span className="text-slate-400">{new Date(h.date).toLocaleDateString()}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
