import { useEffect, useState } from 'react';
import { performanceApi } from '../../api/performanceApi.js';
import Banner from '../../components/ui/Banner.jsx';
import ProgressBar from '../../components/ui/ProgressBar.jsx';
import WorkloadBadge from '../../components/ui/WorkloadBadge.jsx';

const METRIC_LABELS = {
  taskCompletionRate: 'Task completion',
  onTimeDeliveryRate: 'On-time delivery',
  qualityScore: 'Quality (manager-rated)',
  collaborationScore: 'Collaboration (manager-rated)',
  goalsAchievedRate: 'Goals achieved',
  reliabilityScore: 'Reliability (attendance)',
};

export default function EmployeePerformance() {
  const [snapshot, setSnapshot] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    performanceApi
      .me({})
      .then(({ data }) => setSnapshot(data.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load performance'));
    performanceApi
      .myHistory()
      .then(({ data }) => setHistory(data.data))
      .catch(() => {});
  }, []);

  if (error) return <Banner>{error}</Banner>;
  if (!snapshot) return <p className="text-sm text-slate-500">Loading...</p>;

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-900">My performance</h1>
      <p className="mt-1 text-sm text-slate-500">
        This month's contribution score, based on task delivery, goals, attendance, and manager feedback.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 sm:col-span-1">
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
          <div className="mt-3 space-y-3">
            {Object.entries(METRIC_LABELS).map(([key, label]) => {
              const value = snapshot[key];
              return (
                <div key={key}>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{label}</span>
                    <span>{value !== null ? `${value}%` : 'No data yet'}</span>
                  </div>
                  <div className="mt-1">
                    <ProgressBar value={value || 0} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {snapshot.managerFeedback?.length > 0 && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm font-medium text-slate-700">Manager feedback</p>
          <div className="mt-3 space-y-3">
            {snapshot.managerFeedback
              .slice()
              .reverse()
              .map((f, i) => (
                <div key={i} className="rounded-lg bg-slate-50 p-3 text-sm">
                  <p className="text-slate-700">{f.comment}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {f.author?.name} · {new Date(f.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
          </div>
        </div>
      )}

      {history.length > 1 && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm font-medium text-slate-700">Trend</p>
          <div className="mt-3 flex items-end gap-3">
            {history
              .slice()
              .reverse()
              .map((h) => (
                <div key={`${h.period.year}-${h.period.month}`} className="flex flex-col items-center gap-1">
                  <div
                    className="w-8 rounded-t bg-primary-600"
                    style={{ height: `${Math.max(4, (h.contributionScore || 0) * 0.8)}px` }}
                  />
                  <span className="text-[10px] text-slate-400">{h.period.month}/{String(h.period.year).slice(2)}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
