import { useEffect, useState } from 'react';
import { goalApi } from '../../api/goalApi.js';
import Button from '../../components/ui/Button.jsx';
import TextField from '../../components/ui/TextField.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Banner from '../../components/ui/Banner.jsx';
import ProgressBar from '../../components/ui/ProgressBar.jsx';
import GoalStatusBadge from '../../components/ui/GoalStatusBadge.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';

const emptyForm = { title: '', description: '', dueDate: '' };

export default function EmployeeGoals() {
  const [goals, setGoals] = useState([]);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [progressDraft, setProgressDraft] = useState({});

  const load = async () => {
    setError('');
    try {
      const { data } = await goalApi.myGoals();
      setGoals(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load goals');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      await goalApi.create(form);
      setModalOpen(false);
      setForm(emptyForm);
      load();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Could not create goal');
    } finally {
      setSaving(false);
    }
  };

  const handleProgressSave = async (goalId) => {
    const progress = progressDraft[goalId];
    if (progress === undefined) return;
    try {
      await goalApi.updateOwn(goalId, { progress: Number(progress) });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update progress');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">My goals</h1>
        <Button onClick={() => setModalOpen(true)}>Add goal</Button>
      </div>

      {error && (
        <div className="mt-4">
          <Banner>{error}</Banner>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {goals.length === 0 ? (
          <div className="sm:col-span-2">
            <EmptyState title="No goals yet" description="Add a goal to start tracking your progress." />
          </div>
        ) : (
          goals.map((g) => (
            <div key={g._id} className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-start justify-between">
                <p className="font-semibold text-slate-900">{g.title}</p>
                <GoalStatusBadge status={g.status} />
              </div>
              {g.description && <p className="mt-1 text-sm text-slate-500">{g.description}</p>}
              {g.dueDate && (
                <p className="mt-1 text-xs text-slate-400">Due {new Date(g.dueDate).toLocaleDateString()}</p>
              )}

              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Progress</span>
                  <span>{g.progress}%</span>
                </div>
                <div className="mt-1">
                  <ProgressBar value={g.progress} />
                </div>
              </div>

              {!['completed', 'cancelled'].includes(g.status) && (
                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    defaultValue={g.progress}
                    onChange={(e) => setProgressDraft({ ...progressDraft, [g._id]: e.target.value })}
                    className="w-full"
                  />
                  <Button variant="ghost" onClick={() => handleProgressSave(g._id)}>
                    Save
                  </Button>
                </div>
              )}

              {g.reviewComment && (
                <p className="mt-3 rounded-lg bg-slate-50 p-2.5 text-xs text-slate-600">
                  <span className="font-medium">Manager note:</span> {g.reviewComment}
                </p>
              )}
            </div>
          ))
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add goal">
        <form className="space-y-4" onSubmit={handleCreate}>
          <TextField label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <TextField
            label="Description (optional)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <TextField
            label="Due date (optional)"
            type="date"
            value={form.dueDate}
            onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
          />
          {formError && <Banner>{formError}</Banner>}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Add goal
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
