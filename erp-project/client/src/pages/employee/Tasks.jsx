import { useEffect, useState } from 'react';
import { taskApi } from '../../api/taskApi.js';
import Select from '../../components/ui/Select.jsx';
import Banner from '../../components/ui/Banner.jsx';
import TaskStatusBadge from '../../components/ui/TaskStatusBadge.jsx';
import PriorityBadge from '../../components/ui/PriorityBadge.jsx';
import ProgressBar from '../../components/ui/ProgressBar.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import KanbanBoard from '../../components/ui/KanbanBoard.jsx';

const STATUS_OPTIONS = [
  { value: 'TODO',        label: 'To do' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'REVIEW',      label: 'In review' },
  { value: 'COMPLETED',   label: 'Completed' },
  { value: 'BLOCKED',     label: 'Blocked' },
];

const isOverdue = (task) =>
  task.status !== 'COMPLETED' && new Date(task.dueDate) < new Date(new Date().toDateString());

function ListIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
    </svg>
  );
}

function BoardIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
      <rect x="3" y="3" width="7" height="18" rx="1" />
      <rect x="14" y="3" width="7" height="11" rx="1" />
      <rect x="14" y="18" width="7" height="3" rx="1" />
    </svg>
  );
}

export default function EmployeeTasks() {
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list'); // 'list' | 'board'

  const load = async () => {
    setError('');
    setLoading(true);
    try {
      const { data } = await taskApi.myTasks();
      setTasks(data.data.tasks);
      setStats(data.data.stats);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleStatusChange = async (taskId, status) => {
    setBusyId(taskId);
    try {
      await taskApi.updateStatus(taskId, { status });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update task');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="page-enter">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">My tasks</h1>
        {/* View toggle */}
        <div className="flex items-center rounded-lg border border-slate-200 dark:border-gunmetal-600 bg-white dark:bg-gunmetal-800 p-0.5">
          <button
            onClick={() => setView('list')}
            title="List view"
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              view === 'list'
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-slate-500 dark:text-gunmetal-300 hover:text-slate-700 dark:hover:text-white'
            }`}
          >
            <ListIcon /> List
          </button>
          <button
            onClick={() => setView('board')}
            title="Board view"
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              view === 'board'
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-slate-500 dark:text-gunmetal-300 hover:text-slate-700 dark:hover:text-white'
            }`}
          >
            <BoardIcon /> Board
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4">
          <Banner>{error}</Banner>
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 dark:border-gunmetal-700 bg-white dark:bg-gunmetal-800 p-5">
            <p className="text-sm text-slate-500 dark:text-gunmetal-300">Completion</p>
            <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{stats.completionPercentage}%</p>
            <div className="mt-2">
              <ProgressBar value={stats.completionPercentage} />
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-gunmetal-700 bg-white dark:bg-gunmetal-800 p-5">
            <p className="text-sm text-slate-500 dark:text-gunmetal-300">Overdue</p>
            <p className={`mt-1 text-2xl font-bold ${stats.overdue > 0 ? 'text-red-500' : 'text-slate-900 dark:text-white'}`}>
              {stats.overdue}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-gunmetal-700 bg-white dark:bg-gunmetal-800 p-5">
            <p className="text-sm text-slate-500 dark:text-gunmetal-300">Active tasks</p>
            <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{stats.active}</p>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="mt-6">
          <Skeleton.Table rows={6} cols={5} />
        </div>
      )}

      {/* Board view */}
      {!loading && view === 'board' && (
        <div className="mt-6">
          {tasks.length === 0 ? (
            <EmptyState title="No tasks assigned yet" description="Your manager will assign tasks here." />
          ) : (
            <KanbanBoard tasks={tasks} onStatusChange={handleStatusChange} />
          )}
        </div>
      )}

      {/* List view */}
      {!loading && view === 'list' && (
        <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 dark:border-gunmetal-700 bg-white dark:bg-gunmetal-800">
          {tasks.length === 0 ? (
            <div className="p-6">
              <EmptyState title="No tasks assigned yet" description="Your manager will assign tasks here." />
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-gunmetal-900 text-xs uppercase tracking-wide text-slate-500 dark:text-gunmetal-400">
                <tr>
                  <th className="px-4 py-3">Task</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Due</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Update</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-gunmetal-700">
                {tasks.map((t) => (
                  <tr key={t._id} className={`transition-colors ${isOverdue(t) ? 'bg-red-50/30 dark:bg-red-900/10' : 'hover:bg-slate-50 dark:hover:bg-gunmetal-700/30'}`}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900 dark:text-white">{t.title}</p>
                      {t.description && <p className="mt-0.5 text-xs text-slate-500 dark:text-gunmetal-400">{t.description}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <PriorityBadge priority={t.priority} />
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-gunmetal-400">
                      {new Date(t.dueDate).toLocaleDateString()}
                      {isOverdue(t) && <span className="ml-1 text-xs font-medium text-red-500">overdue</span>}
                    </td>
                    <td className="px-4 py-3">
                      <TaskStatusBadge status={t.status} />
                    </td>
                    <td className="px-4 py-3">
                      <Select
                        options={STATUS_OPTIONS}
                        value={t.status}
                        disabled={busyId === t._id}
                        onChange={(e) => handleStatusChange(t._id, e.target.value)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
