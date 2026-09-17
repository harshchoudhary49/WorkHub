import { useEffect, useState } from 'react';
import { goalApi } from '../../api/goalApi.js';
import { employeeApi } from '../../api/employeeApi.js';
import Select from '../../components/ui/Select.jsx';
import Button from '../../components/ui/Button.jsx';
import TextField from '../../components/ui/TextField.jsx';
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

export default function HrGoals() {
  const [goals, setGoals] = useState([]);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [reviewGoal, setReviewGoal] = useState(null);
  const [reviewStatus, setReviewStatus] = useState('completed');
  const [reviewComment, setReviewComment] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (status) params.status = status;
      const { data } = await goalApi.allGoals(params);
      setGoals(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load goals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

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
      <h1 className="text-xl font-bold text-slate-900">Goals</h1>

      <div className="mt-4 max-w-xs">
        <Select label="Status" placeholder="All statuses" options={STATUS_OPTIONS} value={status} onChange={(e) => setStatus(e.target.value)} />
      </div>

      {error && (
        <div className="mt-4">
          <Banner>{error}</Banner>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <p className="text-sm text-slate-500">Loading...</p>
        ) : goals.length === 0 ? (
          <EmptyState title="No goals" description="Nothing matches these filters." />
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
