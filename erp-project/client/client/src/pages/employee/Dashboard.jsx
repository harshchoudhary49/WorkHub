import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { attendanceApi } from '../../api/attendanceApi.js';
import { leaveApi } from '../../api/leaveApi.js';
import { goalApi } from '../../api/goalApi.js';
import { performanceApi } from '../../api/performanceApi.js';
import { holidayApi } from '../../api/holidayApi.js';
import { announcementApi } from '../../api/announcementApi.js';
import { recognitionApi } from '../../api/recognitionApi.js';
import ProgressBar from '../../components/ui/ProgressBar.jsx';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import Banner from '../../components/ui/Banner.jsx';

export default function EmployeeDashboard() {
  const [summary, setSummary] = useState(null);
  const [balances, setBalances] = useState([]);
  const [goals, setGoals] = useState([]);
  const [performance, setPerformance] = useState(null);
  const [holidays, setHolidays] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [recognitions, setRecognitions] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    attendanceApi
      .myAttendance({})
      .then(({ data }) => setSummary(data.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load attendance'));
    leaveApi
      .myBalances()
      .then(({ data }) => setBalances(data.data))
      .catch(() => {});
    goalApi
      .myGoals({ status: 'in-progress' })
      .then(({ data }) => setGoals(data.data))
      .catch(() => {});
    performanceApi
      .me({})
      .then(({ data }) => setPerformance(data.data))
      .catch(() => {});
    holidayApi
      .list()
      .then(({ data }) => {
        const today = new Date(new Date().toDateString());
        setHolidays(data.data.filter((h) => new Date(h.date) >= today).slice(0, 3));
      })
      .catch(() => {});
    announcementApi
      .list()
      .then(({ data }) => setAnnouncements(data.data.slice(0, 3)))
      .catch(() => {});
    recognitionApi
      .mine()
      .then(({ data }) => setRecognitions(data.data.received.slice(0, 3)))
      .catch(() => {});
  }, []);

  const todayRecord = summary?.records.find(
    (r) => new Date(r.date).toDateString() === new Date().toDateString()
  );
  const keyBalances = balances.filter((b) => ['casual', 'sick', 'earned'].includes(b.type));

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-900">Welcome back</h1>
      <p className="mt-1 text-sm text-slate-500">
        Here's a quick look at your attendance and leave. Tasks and goals widgets arrive in later phases.
      </p>

      {error && (
        <div className="mt-4">
          <Banner>{error}</Banner>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link to="/attendance" className="rounded-xl border border-slate-200 bg-white p-5 hover:border-primary-300">
          <p className="text-sm text-slate-500">Today</p>
          <div className="mt-2">
            {todayRecord ? (
              <StatusBadge status={todayRecord.status} />
            ) : (
              <span className="text-sm font-medium text-slate-400">Not checked in yet</span>
            )}
          </div>
        </Link>

        <Link to="/attendance" className="rounded-xl border border-slate-200 bg-white p-5 hover:border-primary-300 sm:col-span-2">
          <p className="text-sm text-slate-500">Monthly attendance</p>
          {summary ? (
            <>
              <p className="mt-1 text-2xl font-bold text-slate-900">{summary.percentage}%</p>
              <div className="mt-2">
                <ProgressBar
                  value={summary.percentage}
                  tone={summary.percentage >= summary.targetPercentage ? 'primary' : 'amber'}
                />
              </div>
              {summary.additionalDaysNeeded > 0 && (
                <p className="mt-2 text-xs font-medium text-amber-600">
                  {summary.additionalDaysNeeded} more present day
                  {summary.additionalDaysNeeded === 1 ? '' : 's'} to reach {summary.targetPercentage}%
                </p>
              )}
            </>
          ) : (
            <p className="mt-1 text-sm text-slate-400">Loading...</p>
          )}
        </Link>
      </div>

      <Link to="/leaves" className="mt-4 block rounded-xl border border-slate-200 bg-white p-5 hover:border-primary-300">
        <p className="text-sm text-slate-500">Leave balance</p>
        <div className="mt-3 grid grid-cols-3 gap-4">
          {keyBalances.map((b) => (
            <div key={b.type}>
              <p className="text-xs font-medium capitalize text-slate-500">{b.type}</p>
              <p className="mt-0.5 text-lg font-bold text-slate-900">{b.remaining}</p>
              <p className="text-[11px] text-slate-400">of {b.allocated} days</p>
            </div>
          ))}
        </div>
      </Link>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link to="/goals" className="rounded-xl border border-slate-200 bg-white p-5 hover:border-primary-300">
          <p className="text-sm text-slate-500">Active goals</p>
          {goals.length === 0 ? (
            <p className="mt-1 text-sm text-slate-400">No goals in progress</p>
          ) : (
            <div className="mt-3 space-y-3">
              {goals.slice(0, 3).map((g) => (
                <div key={g._id}>
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span className="truncate">{g.title}</span>
                    <span>{g.progress}%</span>
                  </div>
                  <div className="mt-1">
                    <ProgressBar value={g.progress} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Link>

        <Link to="/performance" className="rounded-xl border border-slate-200 bg-white p-5 hover:border-primary-300">
          <p className="text-sm text-slate-500">Performance summary</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {performance?.contributionScore !== null && performance?.contributionScore !== undefined
              ? performance.contributionScore
              : '—'}
          </p>
          <p className="mt-1 text-xs text-slate-400">Contribution score, this month</p>
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link to="/announcements" className="rounded-xl border border-slate-200 bg-white p-5 hover:border-primary-300">
          <p className="text-sm text-slate-500">Announcements</p>
          {announcements.length === 0 ? (
            <p className="mt-2 text-sm text-slate-400">Nothing new</p>
          ) : (
            <div className="mt-2 space-y-2">
              {announcements.map((a) => (
                <p key={a._id} className="truncate text-sm text-slate-700">
                  {a.title}
                </p>
              ))}
            </div>
          )}
        </Link>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Upcoming holidays</p>
          {holidays.length === 0 ? (
            <p className="mt-2 text-sm text-slate-400">None in the next few weeks</p>
          ) : (
            <div className="mt-2 space-y-1.5">
              {holidays.map((h) => (
                <div key={h._id} className="flex items-center justify-between text-sm">
                  <span className="truncate text-slate-700">{h.name}</span>
                  <span className="text-xs text-slate-400">{new Date(h.date).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <Link to="/recognition" className="rounded-xl border border-slate-200 bg-white p-5 hover:border-primary-300">
          <p className="text-sm text-slate-500">Recognition</p>
          {recognitions.length === 0 ? (
            <p className="mt-2 text-sm text-slate-400">No shout-outs yet</p>
          ) : (
            <div className="mt-2 space-y-2">
              {recognitions.map((r) => (
                <p key={r._id} className="truncate text-sm text-slate-700">
                  {r.from?.name} · {r.category}
                </p>
              ))}
            </div>
          )}
        </Link>
      </div>
    </div>
  );
}
