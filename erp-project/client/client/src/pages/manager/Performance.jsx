import { useEffect, useState } from 'react';
import { performanceApi } from '../../api/performanceApi.js';
import Button from '../../components/ui/Button.jsx';
import TextField from '../../components/ui/TextField.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Banner from '../../components/ui/Banner.jsx';
import ProgressBar from '../../components/ui/ProgressBar.jsx';
import WorkloadBadge from '../../components/ui/WorkloadBadge.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';

export default function ManagerPerformance() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [feedbackTarget, setFeedbackTarget] = useState(null);
  const [form, setForm] = useState({ qualityScore: '', collaborationScore: '', comment: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setError('');
    try {
      const { data: res } = await performanceApi.team({});
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load team performance');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openFeedback = (snapshot) => {
    setFeedbackTarget(snapshot);
    setForm({
      qualityScore: snapshot.qualityScore ?? '',
      collaborationScore: snapshot.collaborationScore ?? '',
      comment: '',
    });
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await performanceApi.giveFeedback(feedbackTarget.employee._id, {
        qualityScore: form.qualityScore === '' ? undefined : Number(form.qualityScore),
        collaborationScore: form.collaborationScore === '' ? undefined : Number(form.collaborationScore),
        comment: form.comment || undefined,
      });
      setFeedbackTarget(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save feedback');
    } finally {
      setSaving(false);
    }
  };

  if (error) return <Banner>{error}</Banner>;
  if (!data) return <p className="text-sm text-slate-500">Loading...</p>;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">Team performance</h1>
        <p className="text-sm text-slate-500">
          Team average: <span className="font-semibold text-slate-900">{data.teamAverage ?? '—'}</span>
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.snapshots.length === 0 ? (
          <EmptyState title="No team members yet" description="You'll see performance scores here once HR assigns your team." />
        ) : (
          data.snapshots.map((s) => (
            <div key={s._id} className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-start justify-between">
                <p className="font-semibold text-slate-900">{s.employee?.name || 'Employee'}</p>
                <WorkloadBadge workload={s.workloadLabel} />
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {s.contributionScore !== null ? s.contributionScore : '—'}
              </p>
              <div className="mt-2">
                <ProgressBar value={s.contributionScore || 0} />
              </div>
              <Button variant="ghost" className="mt-3" onClick={() => openFeedback(s)}>
                Give feedback
              </Button>
            </div>
          ))
        )}
      </div>

      <Modal open={!!feedbackTarget} onClose={() => setFeedbackTarget(null)} title="Give feedback">
        <form className="space-y-4" onSubmit={handleSubmitFeedback}>
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
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setFeedbackTarget(null)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Save feedback
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
