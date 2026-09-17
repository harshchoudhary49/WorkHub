import { useEffect, useState } from 'react';
import { attendanceApi } from '../../api/attendanceApi.js';
import { employeeApi } from '../../api/employeeApi.js';
import Button from '../../components/ui/Button.jsx';
import Select from '../../components/ui/Select.jsx';
import Banner from '../../components/ui/Banner.jsx';
import ProgressBar from '../../components/ui/ProgressBar.jsx';
import StatusBadge from '../../components/ui/StatusBadge.jsx';

const MONTHS = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: new Date(2000, i, 1).toLocaleString('default', { month: 'long' }),
}));

function SectionCard({ title, subtitle, children, className = '' }) {
  return (
    <div className={`rounded-2xl border border-slate-200 dark:border-gunmetal-700 bg-white dark:bg-gunmetal-800 shadow-card overflow-hidden ${className}`}>
      <div className="border-b border-slate-100 dark:border-gunmetal-700/60 px-5 py-4">
        <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{title}</p>
        {subtitle && <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">{subtitle}</p>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export default function HrAttendance() {
  const now = new Date();
  const [employees, setEmployees] = useState([]);
  const [employeeId, setEmployeeId] = useState('');
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState(null);
  const [markDate, setMarkDate] = useState(now.toISOString().slice(0, 10));
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    employeeApi.list().then(({ data }) => setEmployees(data.data));
  }, []);

  useEffect(() => {
    if (!employeeId) {
      setSummary(null);
      return;
    }
    setError('');
    attendanceApi
      .employeeAttendance(employeeId, { month, year })
      .then(({ data }) => setSummary(data.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load attendance'));
  }, [employeeId, month, year]);

  const handleMarkAbsentees = async () => {
    setMarking(true);
    setMessage(null);
    try {
      const { data } = await attendanceApi.markAbsentees(markDate);
      setMessage({ tone: 'success', text: data.data.reason || `Marked ${data.data.marked} employee(s) absent` });
    } catch (err) {
      setMessage({ tone: 'error', text: err.response?.data?.message || 'Could not mark absentees' });
    } finally {
      setMarking(false);
    }
  };

  const attendancePct = summary?.percentage || 0;
  const isGood = attendancePct >= (summary?.targetPercentage || 75);

  return (
    <div className="page-enter space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">Attendance</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Monitor and manage employee attendance records</p>
      </div>

      {/* End-of-day tool */}
      <SectionCard
        title="End-of-day: mark absentees"
        subtitle="Marks anyone without a record as absent. Skips weekends and holidays."
      >
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Date</label>
            <input
              type="date"
              value={markDate}
              onChange={(e) => setMarkDate(e.target.value)}
              className="rounded-[10px] border border-slate-200 dark:border-gunmetal-600 bg-white dark:bg-gunmetal-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20 transition-all"
            />
          </div>
          <Button onClick={handleMarkAbsentees} loading={marking}>
            Run for this date
          </Button>
        </div>
        {message && (
          <div className="mt-4">
            <Banner tone={message.tone}>{message.text}</Banner>
          </div>
        )}
      </SectionCard>

      {/* Employee lookup */}
      <SectionCard title="Look up an employee" subtitle="View detailed attendance history for any team member">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Select
            label="Employee"
            placeholder="Select an employee"
            options={employees.map((e) => ({ value: e._id, label: `${e.name} (${e.employeeId})` }))}
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
          />
          <Select
            label="Month"
            options={MONTHS}
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
          />
          <Select
            label="Year"
            options={[year - 1, year, year + 1].map((y) => ({ value: y, label: String(y) }))}
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          />
        </div>

        {error && <div className="mt-4"><Banner>{error}</Banner></div>}

        {summary && (
          <div className="mt-6">
            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4 mb-5">
              <div className="rounded-xl border border-slate-200 dark:border-gunmetal-700 p-4 text-center stat-card-blue">
                <p className={`text-3xl font-extrabold ${isGood ? 'text-rivet-600 dark:text-rivet-400' : 'text-amber-600 dark:text-amber-400'}`}>
                  {summary.percentage}%
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Attendance rate</p>
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-gunmetal-700 p-4 text-center">
                <p className="text-3xl font-extrabold text-primary-600 dark:text-primary-400">
                  {summary.presentEquivalent}
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Days present</p>
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-gunmetal-700 p-4 text-center">
                <p className="text-3xl font-extrabold text-slate-700 dark:text-slate-300">
                  {summary.workingDaysElapsed}
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Working days</p>
              </div>
            </div>

            <div className="mb-5">
              <ProgressBar value={summary.percentage} tone={isGood ? 'primary' : 'amber'} />
            </div>

            {/* Records table */}
            <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-gunmetal-700">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-gunmetal-900/40 border-b border-slate-200 dark:border-gunmetal-700">
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Date</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Status</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Check in</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Check out</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-gunmetal-700/60">
                  {summary.records
                    .slice()
                    .reverse()
                    .map((r) => (
                      <tr key={r._id} className="hover:bg-slate-50/80 dark:hover:bg-gunmetal-700/30 transition-colors">
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300 tabular-nums">
                          {new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={r.status} />
                        </td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400 tabular-nums">
                          {r.checkIn ? new Date(r.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                        </td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400 tabular-nums">
                          {r.checkOut ? new Date(r.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
