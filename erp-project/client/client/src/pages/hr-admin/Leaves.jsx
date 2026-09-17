import { useEffect, useState } from 'react';
import { leaveApi } from '../../api/leaveApi.js';
import Select from '../../components/ui/Select.jsx';
import Button from '../../components/ui/Button.jsx';
import Banner from '../../components/ui/Banner.jsx';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'cancelled', label: 'Cancelled' },
];
const TYPE_OPTIONS = [
  { value: 'casual', label: 'Casual' },
  { value: 'sick', label: 'Sick' },
  { value: 'earned', label: 'Earned' },
  { value: 'wfh', label: 'WFH' },
  { value: 'emergency', label: 'Emergency' },
];

export default function HrLeaves() {
  const [leaves, setLeaves] = useState([]);
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (status) params.status = status;
      if (type) params.type = type;
      const { data } = await leaveApi.allLeaves(params);
      setLeaves(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load leave requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, type]);

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

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-900">Leave requests</h1>

      <div className="mt-4 flex max-w-md gap-3">
        <Select label="Status" placeholder="All statuses" options={STATUS_OPTIONS} value={status} onChange={(e) => setStatus(e.target.value)} />
        <Select label="Type" placeholder="All types" options={TYPE_OPTIONS} value={type} onChange={(e) => setType(e.target.value)} />
      </div>

      {error && (
        <div className="mt-4">
          <Banner>{error}</Banner>
        </div>
      )}

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
        {loading ? (
          <p className="p-6 text-sm text-slate-500">Loading...</p>
        ) : leaves.length === 0 ? (
          <div className="p-6">
            <EmptyState title="No leave requests" description="Nothing matches these filters." />
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Dates</th>
                <th className="px-4 py-3">Days</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leaves.map((l) => (
                <tr key={l._id}>
                  <td className="px-4 py-3 font-medium text-slate-900">{l.employee?.name}</td>
                  <td className="px-4 py-3 capitalize text-slate-500">{l.type}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(l.startDate).toLocaleDateString()} - {new Date(l.endDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{l.days}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={l.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    {l.status === 'pending' && (
                      <div className="flex justify-end gap-3">
                        <Button onClick={() => handleApprove(l._id)} loading={busyId === l._id}>
                          Approve
                        </Button>
                        <Button variant="ghost" onClick={() => handleReject(l._id)} loading={busyId === l._id}>
                          Reject
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
