import { useEffect, useState } from 'react';
import { leaveApi } from '../../api/leaveApi.js';
import Button from '../../components/ui/Button.jsx';
import TextField from '../../components/ui/TextField.jsx';
import Select from '../../components/ui/Select.jsx';
import Banner from '../../components/ui/Banner.jsx';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import ProgressBar from '../../components/ui/ProgressBar.jsx';

const TYPE_OPTIONS = [
  { value: 'casual', label: 'Casual leave' },
  { value: 'sick', label: 'Sick leave' },
  { value: 'earned', label: 'Earned leave' },
  { value: 'wfh', label: 'Work from home' },
  { value: 'emergency', label: 'Emergency leave' },
];

const emptyForm = { type: 'casual', startDate: '', endDate: '', reason: '' };

export default function EmployeeLeaves() {
  const [balances, setBalances] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setError('');
    try {
      const [balRes, leaveRes] = await Promise.all([leaveApi.myBalances(), leaveApi.myLeaves()]);
      setBalances(balRes.data.data);
      setLeaves(leaveRes.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load leave data');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleApply = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');
    try {
      await leaveApi.apply(form);
      setForm(emptyForm);
      load();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Could not submit leave request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id) => {
    if (!confirm('Cancel this leave request?')) return;
    try {
      await leaveApi.cancel(id);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not cancel request');
    }
  };

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-900">Leaves</h1>

      {error && (
        <div className="mt-4">
          <Banner>{error}</Banner>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {balances.map((b) => (
          <div key={b.type} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium capitalize text-slate-500">{b.type}</p>
            <p className="mt-1 text-xl font-bold text-slate-900">{b.remaining}</p>
            <p className="text-xs text-slate-400">of {b.allocated} days left</p>
            <div className="mt-2">
              <ProgressBar value={b.allocated - b.remaining} max={b.allocated} tone="amber" />
            </div>
            {b.pending > 0 && <p className="mt-1 text-[11px] text-slate-400">{b.pending} pending</p>}
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
        <p className="text-sm font-medium text-slate-700">Apply for leave</p>
        <form onSubmit={handleApply} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Type"
            options={TYPE_OPTIONS}
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          />
          <div />
          <TextField
            label="Start date"
            type="date"
            value={form.startDate}
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            required
          />
          <TextField
            label="End date"
            type="date"
            value={form.endDate}
            onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            required
          />
          <div className="sm:col-span-2">
            <TextField
              label="Reason (optional)"
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
            />
          </div>
          {formError && (
            <div className="sm:col-span-2">
              <Banner>{formError}</Banner>
            </div>
          )}
          <div className="sm:col-span-2">
            <Button type="submit" loading={submitting}>
              Submit request
            </Button>
          </div>
        </form>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Dates</th>
              <th className="px-4 py-3">Days</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {leaves.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-slate-400" colSpan={5}>
                  No leave requests yet.
                </td>
              </tr>
            ) : (
              leaves.map((l) => (
                <tr key={l._id}>
                  <td className="px-4 py-3 capitalize text-slate-700">{l.type}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(l.startDate).toLocaleDateString()} - {new Date(l.endDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{l.days}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={l.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    {['pending', 'approved'].includes(l.status) && (
                      <button onClick={() => handleCancel(l._id)} className="text-red-500 hover:underline">
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
