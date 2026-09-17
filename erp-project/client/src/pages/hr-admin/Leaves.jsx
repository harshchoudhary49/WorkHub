import { useEffect, useState } from 'react';
import { leaveApi } from '../../api/leaveApi.js';
import Select from '../../components/ui/Select.jsx';
import Button from '../../components/ui/Button.jsx';
import Banner from '../../components/ui/Banner.jsx';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';

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

const TYPE_BADGE = {
  casual: 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400',
  sick: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400',
  earned: 'bg-rivet-400/10 text-rivet-600 dark:text-rivet-400',
  wfh: 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400',
  emergency: 'bg-safety-500/10 text-safety-600 dark:text-safety-400',
};

function getAvatarUrl(name) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'U')}&background=2563eb&color=fff&bold=true&size=32`;
}

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

  const pendingCount = leaves.filter((l) => l.status === 'pending').length;

  return (
    <div className="page-enter space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">Leave requests</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Manage and action employee leave requests
          </p>
        </div>
        {pendingCount > 0 && (
          <div className="inline-flex items-center gap-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 px-4 py-2.5">
            <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">
              {pendingCount} pending {pendingCount === 1 ? 'request' : 'requests'}
            </span>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex max-w-md gap-3">
        <div className="flex-1">
          <Select label="Status" placeholder="All statuses" options={STATUS_OPTIONS} value={status} onChange={(e) => setStatus(e.target.value)} />
        </div>
        <div className="flex-1">
          <Select label="Type" placeholder="All types" options={TYPE_OPTIONS} value={type} onChange={(e) => setType(e.target.value)} />
        </div>
      </div>

      {error && <Banner>{error}</Banner>}

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-gunmetal-700 bg-white dark:bg-gunmetal-800 shadow-card">
        {loading ? (
          <Skeleton.Table rows={6} cols={5} />
        ) : leaves.length === 0 ? (
          <div className="p-10">
            <EmptyState
              title="No leave requests"
              description="Nothing matches the selected filters."
              icon="📋"
            />
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="w-full text-left text-sm min-w-[640px]">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-gunmetal-900/40 border-b border-slate-200 dark:border-gunmetal-700">
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Employee</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Type</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Dates</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Days</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Status</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-gunmetal-700/60">
                {leaves.map((l) => (
                  <tr key={l._id} className="group hover:bg-slate-50/80 dark:hover:bg-gunmetal-700/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={getAvatarUrl(l.employee?.name)}
                          alt={l.employee?.name}
                          className="h-7 w-7 rounded-lg shrink-0"
                        />
                        <span className="font-semibold text-slate-800 dark:text-white">
                          {l.employee?.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold capitalize ${TYPE_BADGE[l.type] || 'bg-slate-100 dark:bg-gunmetal-700 text-slate-600 dark:text-slate-400'}`}>
                        {l.type}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 tabular-nums text-xs">
                      {new Date(l.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      {' → '}
                      {new Date(l.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 dark:bg-gunmetal-700 text-xs font-bold text-slate-600 dark:text-slate-300">
                        {l.days}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={l.status} />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {l.status === 'pending' && (
                        <div className="flex justify-end gap-1.5">
                          <Button
                            size="sm"
                            onClick={() => handleApprove(l._id)}
                            loading={busyId === l._id}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleReject(l._id)}
                            loading={busyId === l._id}
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
