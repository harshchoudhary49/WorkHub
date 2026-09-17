import { useEffect, useState } from 'react';
import { goalApi } from '../../api/goalApi.js';
import { employeeApi } from '../../api/employeeApi.js';
import Button from '../../components/ui/Button.jsx';
import TextField from '../../components/ui/TextField.jsx';
import Select from '../../components/ui/Select.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Banner from '../../components/ui/Banner.jsx';
import ProgressBar from '../../components/ui/ProgressBar.jsx';
import GoalStatusBadge from '../../components/ui/GoalStatusBadge.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';

const STATUS_OPTIONS = [
  { value: 'not-started', label: 'Not started' },
  { value: 'in-progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const createEmptyForm = { employee: '', title: '', description: '', dueDate: '' };

export default function ManagerGoals() {
  const [goals, setGoals] = useState([]);
  const [members, setMembers] = useState([]);
  const [error, setError] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState(createEmptyForm);
  const [saving, setSaving] = useState(false);

  const [reviewGoal, setReviewGoal] = useState(null);
  const [reviewStatus, setReviewStatus] = useState('completed');
  const [reviewComment, setReviewComment] = useState('');

  const load = async () => {
    setError('');
    try {
      const [goalRes, empRes] = await Promise.all([goalApi.teamGoals(), employeeApi.list()]);
      setGoals(goalRes.data.data);
      setMembers(empRes.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load team goals');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await goalApi.create(createForm);
      setCreateOpen(false);
      setCreateForm(createEmptyForm);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create goal');
    } finally {
      setSaving(false);
    }
  };

  const openReview = (goal) => {
    setReviewGoal(goal);
    setReviewStatus('completed');
    setReviewComment('');
  };

  const handleReview = async (e) => {
    e.preventDefault();
    try {
      await goalApi.review(reviewGoal._id, { status: reviewStatus, comment: reviewComment });
      setReviewGoal(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not review goal');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">Team goals</h1>
        <Button onClick={() => setCreateOpen(true)}>Assign goal</Button>
      </div>

      {error && (
        <div className="mt-4">
          <Banner>{error}</Banner>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {goals.length === 0 ? (
          <div className="sm:col-span-2">
            <EmptyState title="No goals yet" description="Assign a goal to a team member to get started." />
          </div>
        ) : (
          goals.map((g) => (
            <div key={g._id} className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-slate-900">{g.title}</p>
                  <p className="text-xs text-slate-500">{g.employee?.name}</p>
                </div>
                <GoalStatusBadge status={g.status} />
              </div>
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
                <Button variant="ghost" className="mt-3" onClick={() => openReview(g)}>
                  Review
                </Button>
              )}
            </div>
          ))
        )}
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Assign goal">
        <form className="space-y-4" onSubmit={handleCreate}>
          <Select
            label="Team member"
            placeholder="Select someone"
            options={members.map((m) => ({ value: m._id, label: m.name }))}
            value={createForm.employee}
            onChange={(e) => setCreateForm({ ...createForm, employee: e.target.value })}
            required
          />
          <TextField label="Title" value={createForm.title} onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })} required />
          <TextField
            label="Description (optional)"
            value={createForm.description}
            onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
          />
          <TextField
            label="Due date (optional)"
            type="date"
            value={createForm.dueDate}
            onChange={(e) => setCreateForm({ ...createForm, dueDate: e.target.value })}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Assign
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!reviewGoal} onClose={() => setReviewGoal(null)} title={`Review: ${reviewGoal?.title || ''}`}>
        <form className="space-y-4" onSubmit={handleReview}>
          <Select label="New status" options={STATUS_OPTIONS} value={reviewStatus} onChange={(e) => setReviewStatus(e.target.value)} />
          <TextField label="Comment (optional)" value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setReviewGoal(null)}>
              Cancel
            </Button>
            <Button type="submit">Save review</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
