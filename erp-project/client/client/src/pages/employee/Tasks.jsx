import { useEffect, useState } from 'react';
import { taskApi } from '../../api/taskApi.js';
import Select from '../../components/ui/Select.jsx';
import Banner from '../../components/ui/Banner.jsx';
import TaskStatusBadge from '../../components/ui/TaskStatusBadge.jsx';
import PriorityBadge from '../../components/ui/PriorityBadge.jsx';
import ProgressBar from '../../components/ui/ProgressBar.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';

const STATUS_OPTIONS = [
  { value: 'TODO', label: 'To do' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'REVIEW', label: 'In review' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'BLOCKED', label: 'Blocked' },
];

const isOverdue = (task) => task.status !== 'COMPLETED' && new Date(task.dueDate) < new Date(new Date().toDateString());

export default function EmployeeTasks() {
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    setError('');
    try {
      const { data } = await taskApi.myTasks();
      setTasks(data.data.tasks);
      setStats(data.data.stats);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load tasks');
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
    <div>
      <h1 className="text-xl font-bold text-slate-900">My tasks</h1>

      {error && (
        <div className="mt-4">
          <Banner>{error}</Banner>
        </div>
      )}

      {stats && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Completion</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{stats.completionPercentage}%</p>
            <div className="mt-2">
              <ProgressBar value={stats.completionPercentage} />
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Overdue</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{stats.overdue}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Active tasks</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{stats.active}</p>
          </div>
        </div>
      )}

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
        {tasks.length === 0 ? (
          <div className="p-6">
            <EmptyState title="No tasks assigned yet" description="Your manager will assign tasks here." />
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Task</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Due</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Update</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tasks.map((t) => (
                <tr key={t._id} className={isOverdue(t) ? 'bg-red-50/30' : ''}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{t.title}</p>
                    {t.description && <p className="mt-0.5 text-xs text-slate-500">{t.description}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <PriorityBadge priority={t.priority} />
                  </td>
                  <td className="px-4 py-3 text-slate-500">
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
    </div>
  );
}
