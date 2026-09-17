import { useEffect, useState } from 'react';
import { attendanceApi } from '../../api/attendanceApi.js';
import Button from '../../components/ui/Button.jsx';
import Select from '../../components/ui/Select.jsx';
import Banner from '../../components/ui/Banner.jsx';
import ProgressBar from '../../components/ui/ProgressBar.jsx';
import StatusBadge from '../../components/ui/StatusBadge.jsx';

const MONTHS = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: new Date(2000, i, 1).toLocaleString('default', { month: 'long' }),
}));

const todayRecord = (records) => {
  const todayKey = new Date().toDateString();
  return records.find((r) => new Date(r.date).toDateString() === todayKey);
};

export default function EmployeeAttendance() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setError('');
    try {
      const { data } = await attendanceApi.myAttendance({ month, year });
      setSummary(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load attendance');
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, year]);

  const handleCheckIn = async (mode) => {
    setBusy(true);
    setActionError('');
    try {
      await attendanceApi.checkIn(mode);
      load();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Could not check in');
    } finally {
      setBusy(false);
    }
  };

  const handleCheckOut = async () => {
    setBusy(true);
    setActionError('');
    try {
      await attendanceApi.checkOut();
      load();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Could not check out');
    } finally {
      setBusy(false);
    }
  };

  if (error) return <Banner>{error}</Banner>;
  if (!summary) return <p className="text-sm text-slate-500">Loading...</p>;

  const today = todayRecord(summary.records);
  const isCurrentMonth = month === now.getMonth() + 1 && year === now.getFullYear();

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-900">Attendance</h1>

      {isCurrentMonth && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Today</p>
          <div className="mt-2 flex flex-wrap items-center gap-4">
            {!today?.checkIn ? (
              <>
                <Button onClick={() => handleCheckIn('office')} loading={busy}>
                  Check in (office)
                </Button>
                <Button variant="ghost" onClick={() => handleCheckIn('remote')} loading={busy}>
                  Check in (remote)
                </Button>
              </>
            ) : !today?.checkOut ? (
              <>
                <StatusBadge status={today.status} />
                <p className="text-sm text-slate-500">
                  Checked in at {new Date(today.checkIn).toLocaleTimeString()}
                </p>
                <Button onClick={handleCheckOut} loading={busy}>
                  Check out
                </Button>
              </>
            ) : (
              <>
                <StatusBadge status={today.status} />
                <p className="text-sm text-slate-500">
                  {new Date(today.checkIn).toLocaleTimeString()} –{' '}
                  {new Date(today.checkOut).toLocaleTimeString()} · {today.workingHours}h worked
                </p>
              </>
            )}
          </div>
          {actionError && (
            <div className="mt-3">
              <Banner>{actionError}</Banner>
            </div>
          )}
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">This month's attendance</p>
          <p className="mt-1 text-3xl font-bold text-slate-900">{summary.percentage}%</p>
          <div className="mt-3">
            <ProgressBar value={summary.percentage} tone={summary.percentage >= summary.targetPercentage ? 'primary' : 'amber'} />
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {summary.presentEquivalent} / {summary.workingDaysElapsed} working days present · target{' '}
            {summary.targetPercentage}%
          </p>
          {summary.additionalDaysNeeded > 0 && (
            <p className="mt-2 text-sm font-medium text-amber-600">
              {summary.additionalDaysNeeded} more present day
              {summary.additionalDaysNeeded === 1 ? '' : 's'} needed to reach {summary.targetPercentage}%
            </p>
          )}
          {summary.additionalDaysNeeded === 0 && summary.workingDaysElapsed > 0 && (
            <p className="mt-2 text-sm font-medium text-emerald-600">You're on target 🎉</p>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Breakdown</p>
          <div className="mt-3 space-y-1.5 text-sm">
            {Object.entries(summary.breakdown)
              .filter(([, count]) => count > 0)
              .map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <StatusBadge status={status} />
                  <span className="font-medium text-slate-700">{count}</span>
                </div>
              ))}
          </div>
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <Select label="Month" options={MONTHS} value={month} onChange={(e) => setMonth(Number(e.target.value))} />
        <Select
          label="Year"
          options={[year - 1, year, year + 1].map((y) => ({ value: y, label: String(y) }))}
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
        />
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Check in</th>
              <th className="px-4 py-3">Check out</th>
              <th className="px-4 py-3">Hours</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {summary.records.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-slate-400" colSpan={5}>
                  No records for this month yet.
                </td>
              </tr>
            ) : (
              summary.records
                .slice()
                .reverse()
                .map((r) => (
                  <tr key={r._id}>
                    <td className="px-4 py-3 text-slate-700">
                      {new Date(r.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {r.checkIn ? new Date(r.checkIn).toLocaleTimeString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {r.checkOut ? new Date(r.checkOut).toLocaleTimeString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{r.workingHours || '—'}</td>
                  </tr>
                ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
