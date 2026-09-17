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

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-900">Attendance</h1>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
        <p className="text-sm font-medium text-slate-700">End-of-day: mark absentees</p>
        <p className="mt-1 text-xs text-slate-500">
          Marks anyone without a record for the chosen date as absent. Skips weekends and company holidays.
          In production this would run automatically at end of day (Phase 12).
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <input
            type="date"
            value={markDate}
            onChange={(e) => setMarkDate(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary-500"
          />
          <Button onClick={handleMarkAbsentees} loading={marking}>
            Run for this date
          </Button>
        </div>
        {message && (
          <div className="mt-3">
            <Banner tone={message.tone}>{message.text}</Banner>
          </div>
        )}
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
        <p className="text-sm font-medium text-slate-700">Look up an employee</p>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Select
            label="Employee"
            placeholder="Select an employee"
            options={employees.map((e) => ({ value: e._id, label: `${e.name} (${e.employeeId})` }))}
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
          />
          <Select label="Month" options={MONTHS} value={month} onChange={(e) => setMonth(Number(e.target.value))} />
          <Select
            label="Year"
            options={[year - 1, year, year + 1].map((y) => ({ value: y, label: String(y) }))}
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          />
        </div>

        {error && (
          <div className="mt-4">
            <Banner>{error}</Banner>
          </div>
        )}

        {summary && (
          <div className="mt-5">
            <p className="text-2xl font-bold text-slate-900">{summary.percentage}%</p>
            <div className="mt-2">
              <ProgressBar value={summary.percentage} tone={summary.percentage >= summary.targetPercentage ? 'primary' : 'amber'} />
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {summary.presentEquivalent} / {summary.workingDaysElapsed} working days present
            </p>

            <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Check in</th>
                    <th className="px-4 py-3">Check out</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {summary.records
                    .slice()
                    .reverse()
                    .map((r) => (
                      <tr key={r._id}>
                        <td className="px-4 py-3 text-slate-700">{new Date(r.date).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={r.status} />
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {r.checkIn ? new Date(r.checkIn).toLocaleTimeString() : '—'}
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {r.checkOut ? new Date(r.checkOut).toLocaleTimeString() : '—'}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
