import { useEffect, useState } from 'react';
import { leaveApi } from '../../api/leaveApi.js';
import Button from '../../components/ui/Button.jsx';
import Banner from '../../components/ui/Banner.jsx';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';

export default function ManagerLeaves() {
  const [leaves, setLeaves] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await leaveApi.teamLeaves();
      setLeaves(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load team leave requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleApprove = async (id) => {
    setBusyId(id);
    try {
      await leaveApi.approve(id);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not approve request');
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (id) => {
    const reason = prompt('Reason for rejecting (optional):') || '';
    setBusyId(id);
    try {
      await leaveApi.reject(id, reason);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not reject request');
    } finally {
      setBusyId(null);
    }
  };

  const pending = leaves.filter((l) => l.status === 'pending');
  const decided = leaves.filter((l) => l.status !== 'pending');

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-900">Team leave requests</h1>

      {error && (
        <div className="mt-4">
          <Banner>{error}</Banner>
        </div>
      )}

      <div className="mt-6">
        <p className="text-sm font-medium text-slate-700">Pending ({pending.length})</p>
        <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
          {loading ? (
            <p className="p-6 text-sm text-slate-500">Loading...</p>
          ) : pending.length === 0 ? (
            <div className="p-6">
              <EmptyState title="Nothing pending" description="You're all caught up on your team's leave requests." />
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Dates</th>
                  <th className="px-4 py-3">Days</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pending.map((l) => (
                  <tr key={l._id}>
                    <td className="px-4 py-3 font-medium text-slate-900">{l.employee?.name}</td>
                    <td className="px-4 py-3 capitalize text-slate-500">{l.type}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(l.startDate).toLocaleDateString()} - {new Date(l.endDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{l.days}</td>
                    <td className="px-4 py-3 text-slate-500">{l.reason || '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-3">
                        <Button onClick={() => handleApprove(l._id)} loading={busyId === l._id}>
                          Approve
                        </Button>
                        <Button variant="ghost" onClick={() => handleReject(l._id)} loading={busyId === l._id}>
                          Reject
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="mt-8">
        <p className="text-sm font-medium text-slate-700">History</p>
        <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Dates</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {decided.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-center text-slate-400" colSpan={4}>
                    No decided requests yet.
                  </td>
                </tr>
              ) : (
                decided.map((l) => (
                  <tr key={l._id}>
                    <td className="px-4 py-3 font-medium text-slate-900">{l.employee?.name}</td>
                    <td className="px-4 py-3 capitalize text-slate-500">{l.type}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(l.startDate).toLocaleDateString()} - {new Date(l.endDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={l.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
