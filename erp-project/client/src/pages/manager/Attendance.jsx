import { useEffect, useState } from 'react';
import { attendanceApi } from '../../api/attendanceApi.js';
import Banner from '../../components/ui/Banner.jsx';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';

export default function ManagerAttendance() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [roster, setRoster] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await attendanceApi.teamAttendance(date);
      setRoster(data.data.roster);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load team attendance');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const counts = roster.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">Team attendance</h1>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary-500"
        />
      </div>

      {error && (
        <div className="mt-4">
          <Banner>{error}</Banner>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {Object.entries(counts).map(([status, count]) => (
          <div key={status} className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm shadow-sm">
            <StatusBadge status={status} /> <span className="text-slate-500">{count}</span>
          </div>
        ))}
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
        {loading ? (
          <p className="p-6 text-sm text-slate-500">Loading...</p>
        ) : roster.length === 0 ? (
          <div className="p-6">
            <EmptyState title="No team members yet" description="You'll see your team here once HR assigns them to you." />
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Check in</th>
                <th className="px-4 py-3">Check out</th>
                <th className="px-4 py-3">Hours</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {roster.map((r) => (
                <tr key={r.employee._id}>
                  <td className="px-4 py-3 font-medium text-slate-900">{r.employee.name}</td>
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
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
