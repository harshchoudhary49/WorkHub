import { useEffect, useState } from 'react';
import { taskApi } from '../../api/taskApi.js';
import { employeeApi } from '../../api/employeeApi.js';
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

export default function HrTasks() {
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [status, setStatus] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    employeeApi.list().then(({ data }) => setEmployees(data.data));
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (status) params.status = status;
      if (employeeId) params.employee = employeeId;
      const { data } = await taskApi.allTasks(params);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, employeeId]);

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-900">Tasks</h1>

      {stats && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Org-wide completion</p>
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
            <p className="text-sm text-slate-500">Total tasks</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{stats.total}</p>
          </div>
        </div>
      )}

      <div className="mt-6 flex max-w-lg gap-3">
        <Select label="Status" placeholder="All statuses" options={STATUS_OPTIONS} value={status} onChange={(e) => setStatus(e.target.value)} />
        <Select
          label="Employee"
          placeholder="All employees"
          options={employees.map((e) => ({ value: e._id, label: e.name }))}
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}
        />
      </div>

      {error && (
        <div className="mt-4">
          <Banner>{error}</Banner>
        </div>
      )}

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
        {loading ? (
          <p className="p-6 text-sm text-slate-500">Loading...</p>
        ) : tasks.length === 0 ? (
          <div className="p-6">
            <EmptyState title="No tasks" description="Nothing matches these filters." />
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Task</th>
                <th className="px-4 py-3">Assignee</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Due</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tasks.map((t) => (
                <tr key={t._id} className={isOverdue(t) ? 'bg-red-50/30' : ''}>
                  <td className="px-4 py-3 font-medium text-slate-900">{t.title}</td>
                  <td className="px-4 py-3 text-slate-500">{t.assignee?.name}</td>
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
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
