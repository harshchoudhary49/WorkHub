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
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { analyticsApi } from '../../api/analyticsApi.js';
import { performanceApi } from '../../api/performanceApi.js';
import Banner from '../../components/ui/Banner.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import CountUp from '../../components/ui/CountUp.jsx';

const CHART_COLORS = {
  present: '#2563eb',
  remote: '#7c3aed',
  leave: '#f59e0b',
  absent: '#ef4444',
};

const PIE_COLORS = ['#2563eb', '#7c3aed', '#f59e0b', '#ef4444', '#10b981', '#f97316'];

const formatDay = (iso) =>
  new Date(iso).toLocaleDateString('default', { month: 'short', day: 'numeric' });

// Custom Recharts tooltip
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-100 dark:border-gunmetal-700 bg-white dark:bg-gunmetal-800 p-3 shadow-xl text-xs">
      <p className="font-bold text-slate-700 dark:text-slate-200 mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-0.5">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-500 dark:text-slate-400">{p.name}:</span>
          <span className="font-semibold" style={{ color: p.color }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
}

// Stat card with icon and gradient accent
function StatCard({ label, value, icon, accentClass, iconBgClass, iconTextClass, trend }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${accentClass}`}>
      {/* Decorative blob */}
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-[0.08] blur-xl bg-current" />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            <CountUp end={value} />
          </p>
          {trend && (
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{trend}</p>
          )}
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconBgClass}`}>
          <span className={`text-lg ${iconTextClass}`}>{icon}</span>
        </div>
      </div>
    </div>
  );
}

// Section wrapper card
function SectionCard({ title, badge, children, className = '' }) {
  return (
    <div className={`rounded-2xl border border-slate-200 dark:border-gunmetal-700 bg-white dark:bg-gunmetal-800 overflow-hidden shadow-card ${className}`}>
      <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-100 dark:border-gunmetal-700/60">
        <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{title}</p>
        {badge && (
          <span className="rounded-lg bg-slate-100 dark:bg-gunmetal-700 px-2.5 py-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
            {badge}
          </span>
        )}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export default function HrAdminDashboard() {
  const [overview, setOverview] = useState(null);
  const [trend, setTrend] = useState([]);
  const [headcount, setHeadcount] = useState([]);
  const [taskCompletion, setTaskCompletion] = useState([]);
  const [topPerformers, setTopPerformers] = useState([]);
  const [leaveBreakdown, setLeaveBreakdown] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const now = new Date();
    Promise.all([
      analyticsApi.overview(),
      analyticsApi.attendanceTrend(14),
      analyticsApi.headcountByDepartment(),
      analyticsApi.taskCompletionByDepartment(),
      performanceApi.team({ month: now.getMonth() + 1, year: now.getFullYear() }).catch(() => ({ data: { data: [] } })),
    ])
      .then(([ov, tr, hc, tc, perf]) => {
        setOverview(ov.data.data);
        setTrend(tr.data.data.map((d) => ({ ...d, day: formatDay(d.date) })));
        setHeadcount(hc.data.data);
        setTaskCompletion(tc.data.data);

        const perfs = Array.isArray(perf.data.data) ? perf.data.data : [];
        const sorted = perfs
          .filter((p) => p.contributionScore !== null)
          .sort((a, b) => (b.contributionScore || 0) - (a.contributionScore || 0))
          .slice(0, 5);
        setTopPerformers(sorted);

        setLeaveBreakdown([
          { name: 'Present', value: ov.data.data.todayAttendance.present || 0 },
          { name: 'Remote', value: ov.data.data.todayAttendance.remote || 0 },
          { name: 'On Leave', value: ov.data.data.todayAttendance.leave || 0 },
          { name: 'Absent', value: ov.data.data.todayAttendance.absent || 0 },
          { name: 'Half-day', value: ov.data.data.todayAttendance['half-day'] || 0 },
        ].filter((d) => d.value > 0));
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load dashboard'));
  }, []);

  if (error) return <Banner>{error}</Banner>;

  if (!overview) {
    return (
      <div className="space-y-6 page-enter">
        <Skeleton className="h-8 w-64" />
        <Skeleton.StatGrid count={4} />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Skeleton.Card lines={5} className="h-80" />
          <Skeleton.Card lines={5} className="h-80" />
          <Skeleton.Card lines={5} className="h-80" />
          <Skeleton.Card lines={5} className="h-80" />
        </div>
      </div>
    );
  }

  const presentToday =
    (overview.todayAttendance.present || 0) + (overview.todayAttendance.remote || 0);

  const STAT_CARDS = [
    {
      label: 'Total employees',
      value: overview.totalEmployees,
      icon: '👥',
      accentClass: 'stat-card-blue border-primary-200/60 dark:border-primary-700/30',
      iconBgClass: 'bg-primary-100 dark:bg-primary-900/30',
      iconTextClass: 'text-primary-600',
      trend: 'Active workforce',
    },
    {
      label: 'Present today',
      value: presentToday,
      icon: '✅',
      accentClass: 'stat-card-green border-rivet-400/30 dark:border-rivet-600/20',
      iconBgClass: 'bg-rivet-400/10 dark:bg-rivet-600/10',
      iconTextClass: '',
      trend: 'In-office + remote',
    },
    {
      label: 'Pending leaves',
      value: overview.pendingLeaves,
      icon: '📋',
      accentClass: 'stat-card-amber border-amber-300/40 dark:border-amber-600/20',
      iconBgClass: 'bg-amber-100 dark:bg-amber-900/20',
      iconTextClass: '',
      trend: 'Awaiting approval',
    },
    {
      label: 'Overdue tasks',
      value: overview.overdueTasks,
      icon: '⚠️',
      accentClass: 'stat-card-red border-red-300/40 dark:border-red-600/20',
      iconBgClass: 'bg-red-100 dark:bg-red-900/20',
      iconTextClass: '',
      trend: 'Need attention',
    },
  ];

  const MEDAL_COLORS = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];

  return (
    <div className="page-enter space-y-6">
      {/* ── Page Header ─────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Organization Overview
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Real-time pulse of your workforce today
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 rounded-xl bg-white dark:bg-gunmetal-800 border border-slate-200 dark:border-gunmetal-700 px-3.5 py-2.5 shadow-sm">
          <div className="h-2 w-2 rounded-full bg-rivet-400 animate-pulse" />
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Live data</span>
        </div>
      </div>

      {/* ── Stat Cards ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 stagger">
        {STAT_CARDS.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      {/* ── Charts Grid ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Attendance Trend */}
        <SectionCard title="Attendance trend" badge="Last 14 days">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                  iconType="circle"
                  iconSize={8}
                />
                <Line type="monotone" dataKey="present" stroke={CHART_COLORS.present} strokeWidth={2.5} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
                <Line type="monotone" dataKey="remote" stroke={CHART_COLORS.remote} strokeWidth={2.5} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
                <Line type="monotone" dataKey="leave" stroke={CHART_COLORS.leave} strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} strokeDasharray="4 2" />
                <Line type="monotone" dataKey="absent" stroke={CHART_COLORS.absent} strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} strokeDasharray="4 2" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        {/* Today's Attendance Pie */}
        <SectionCard title="Today's attendance" badge={`${presentToday} present`}>
          <div className="flex items-center gap-4 h-64">
            <ResponsiveContainer width="55%" height="100%">
              <PieChart>
                <Pie
                  data={leaveBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={58}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {leaveBreakdown.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v, n) => [`${v} people`, n]}
                  contentStyle={{
                    background: 'rgba(15,23,42,0.95)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 10,
                    fontSize: 12,
                    color: '#f1f5f9',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-2.5 text-xs flex-1">
              {leaveBreakdown.map((d, i) => (
                <div key={d.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                    />
                    <span className="text-slate-600 dark:text-slate-300">{d.name}</span>
                  </div>
                  <span className="font-bold text-slate-800 dark:text-white">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>

        {/* Headcount by Dept */}
        <SectionCard title="Headcount by department">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={headcount} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" vertical={false} />
                <XAxis dataKey="department" tick={{ fontSize: 10, fill: '#94a3b8' }} interval={0} angle={-25} textAnchor="end" height={50} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} allowDecimals={false} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="count" fill="url(#blueGrad)" radius={[6, 6, 0, 0]} />
                <defs>
                  <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#1d4ed8" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        {/* Task Completion */}
        <SectionCard title="Task completion by department">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={taskCompletion} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" vertical={false} />
                <XAxis dataKey="department" tick={{ fontSize: 10, fill: '#94a3b8' }} interval={0} angle={-25} textAnchor="end" height={50} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} unit="%" axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="completionPercentage" fill="url(#amberGrad)" radius={[6, 6, 0, 0]} />
                <defs>
                  <linearGradient id="amberGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fbbf24" />
                    <stop offset="100%" stopColor="#d97706" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        {/* Top Performers Leaderboard */}
        <SectionCard title="Top performers this month" badge="By score">
          <div className="space-y-3">
            {topPerformers.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400 dark:text-gunmetal-400">
                No performance data yet this month.
              </p>
            ) : (
              topPerformers.map((p, i) => (
                <div
                  key={p._id || i}
                  className="flex items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-slate-50 dark:hover:bg-gunmetal-700/50"
                >
                  <span className="text-lg w-7 text-center shrink-0">{MEDAL_COLORS[i]}</span>
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(p.employee?.name || 'U')}&background=2563eb&color=fff&bold=true&size=32`}
                    alt={p.employee?.name}
                    className="h-8 w-8 rounded-lg shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">
                      {p.employee?.name || '—'}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      {p.employee?.designation || 'Employee'}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-sm font-extrabold text-primary-600 dark:text-primary-400">
                      {p.contributionScore}
                    </span>
                    <span className="ml-0.5 text-xs text-slate-400">pts</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </SectionCard>

        {/* Upcoming Holidays */}
        <SectionCard title="Upcoming holidays" badge="Next 30 days">
          <div className="space-y-2">
            {overview.upcomingHolidays.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400 dark:text-gunmetal-400">
                No holidays in the next 30 days 🎉
              </p>
            ) : (
              overview.upcomingHolidays.map((h) => (
                <div
                  key={h._id}
                  className="flex items-center justify-between rounded-xl p-2.5 transition-colors hover:bg-slate-50 dark:hover:bg-gunmetal-700/50"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/20 text-base">
                      🎌
                    </span>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {h.name}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-slate-400 dark:text-gunmetal-400 tabular-nums">
                    {new Date(h.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
