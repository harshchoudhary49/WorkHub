import { useEffect, useState } from 'react';
import { performanceApi } from '../../api/performanceApi.js';
import { employeeApi } from '../../api/employeeApi.js';
import Select from '../../components/ui/Select.jsx';
import Button from '../../components/ui/Button.jsx';
import TextField from '../../components/ui/TextField.jsx';
import Banner from '../../components/ui/Banner.jsx';
import ProgressBar from '../../components/ui/ProgressBar.jsx';
import WorkloadBadge from '../../components/ui/WorkloadBadge.jsx';

const MONTHS = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: new Date(2000, i, 1).toLocaleString('default', { month: 'long' }),
}));

const METRIC_LABELS = {
  taskCompletionRate: 'Task completion',
  onTimeDeliveryRate: 'On-time delivery',
  qualityScore: 'Quality (manager-rated)',
  collaborationScore: 'Collaboration (manager-rated)',
  goalsAchievedRate: 'Goals achieved',
  reliabilityScore: 'Reliability (attendance)',
};

export default function HrPerformance() {
  const now = new Date();
  const [employees, setEmployees] = useState([]);
  const [employeeId, setEmployeeId] = useState('');
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [snapshot, setSnapshot] = useState(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ qualityScore: '', collaborationScore: '', comment: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    employeeApi.list().then(({ data }) => setEmployees(data.data));
  }, []);

  const load = async () => {
    if (!employeeId) return;
    setError('');
    try {
      const { data } = await performanceApi.employee(employeeId, { month, year });
      setSnapshot(data.data);
      setForm({ qualityScore: data.data.qualityScore ?? '', collaborationScore: data.data.collaborationScore ?? '', comment: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load performance');
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId, month, year]);

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await performanceApi.giveFeedback(employeeId, {
        month,
        year,
        qualityScore: form.qualityScore === '' ? undefined : Number(form.qualityScore),
        collaborationScore: form.collaborationScore === '' ? undefined : Number(form.collaborationScore),
        comment: form.comment || undefined,
      });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save feedback');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-900">Performance</h1>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:max-w-2xl">
        <Select
          label="Employee"
          placeholder="Select an employee"
          options={employees.map((e) => ({ value: e._id, label: e.name }))}
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

      {snapshot && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Contribution score</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">
              {snapshot.contributionScore !== null ? snapshot.contributionScore : '—'}
            </p>
            <div className="mt-3">
              <WorkloadBadge workload={snapshot.workloadLabel} />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 sm:col-span-2">
            <p className="text-sm text-slate-500">Breakdown</p>
            <div className="mt-3 space-y-2.5">
              {Object.entries(METRIC_LABELS).map(([key, label]) => (
                <div key={key}>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{label}</span>
                    <span>{snapshot[key] !== null ? `${snapshot[key]}%` : 'No data yet'}</span>
                  </div>
                  <div className="mt-1">
                    <ProgressBar value={snapshot[key] || 0} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 sm:col-span-3">
            <p className="text-sm font-medium text-slate-700">Give feedback for this period</p>
            <form onSubmit={handleSubmitFeedback} className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <TextField
                label="Quality score (0-100)"
                type="number"
                min="0"
                max="100"
                value={form.qualityScore}
                onChange={(e) => setForm({ ...form, qualityScore: e.target.value })}
              />
              <TextField
                label="Collaboration score (0-100)"
                type="number"
                min="0"
                max="100"
                value={form.collaborationScore}
                onChange={(e) => setForm({ ...form, collaborationScore: e.target.value })}
              />
              <TextField label="Comment (optional)" value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} />
              <div className="sm:col-span-3">
                <Button type="submit" loading={saving}>
                  Save feedback
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
