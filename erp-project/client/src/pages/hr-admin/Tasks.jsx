import { useEffect, useState } from 'react';
import { taskApi } from '../../api/taskApi.js';
import { employeeApi } from '../../api/employeeApi.js';
import Select from '../../components/ui/Select.jsx';
import Banner from '../../components/ui/Banner.jsx';
import TaskStatusBadge from '../../components/ui/TaskStatusBadge.jsx';
import PriorityBadge from '../../components/ui/PriorityBadge.jsx';
import ProgressBar from '../../components/ui/ProgressBar.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import CountUp from '../../components/ui/CountUp.jsx';

const STATUS_OPTIONS = [
  { value: 'TODO', label: 'To do' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'REVIEW', label: 'In review' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'BLOCKED', label: 'Blocked' },
];

const isOverdue = (task) =>
  task.status !== 'COMPLETED' && new Date(task.dueDate) < new Date(new Date().toDateString());

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
    <div className="page-enter space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">Tasks</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Organization-wide task tracking and management
        </p>
      </div>

      {/* Stat cards */}
      {stats && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 stagger">
          <div className="rounded-2xl border border-slate-200 dark:border-gunmetal-700 bg-white dark:bg-gunmetal-800 p-5 shadow-card stat-card-blue">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Completion rate</p>
            <p className="mt-2 text-3xl font-extrabold text-primary-600 dark:text-primary-400">
              <CountUp end={stats.completionPercentage} />%
            </p>
            <div className="mt-3">
              <ProgressBar value={stats.completionPercentage} showLabel={false} />
            </div>
          </div>
          <div className="rounded-2xl border border-red-200/60 dark:border-red-800/30 bg-white dark:bg-gunmetal-800 p-5 shadow-card stat-card-red">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Overdue</p>
            <p className="mt-2 text-3xl font-extrabold text-red-600 dark:text-red-400">
              <CountUp end={stats.overdue} />
            </p>
            <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">Need immediate attention</p>
          </div>
          <div className="rounded-2xl border border-slate-200 dark:border-gunmetal-700 bg-white dark:bg-gunmetal-800 p-5 shadow-card">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total tasks</p>
            <p className="mt-2 text-3xl font-extrabold text-slate-800 dark:text-white">
              <CountUp end={stats.total} />
            </p>
            <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">Across all employees</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex max-w-lg gap-3">
        <div className="flex-1">
          <Select label="Status" placeholder="All statuses" options={STATUS_OPTIONS} value={status} onChange={(e) => setStatus(e.target.value)} />
        </div>
        <div className="flex-1">
          <Select
            label="Employee"
            placeholder="All employees"
            options={employees.map((e) => ({ value: e._id, label: e.name }))}
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
          />
        </div>
      </div>

      {error && <Banner>{error}</Banner>}

      {/* Task table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-gunmetal-700 bg-white dark:bg-gunmetal-800 shadow-card">
        {loading ? (
          <Skeleton.Table rows={8} cols={5} />
        ) : tasks.length === 0 ? (
          <div className="p-10">
            <EmptyState title="No tasks" description="Nothing matches these filters." icon="✅" />
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="w-full text-left text-sm min-w-[640px]">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-gunmetal-900/40 border-b border-slate-200 dark:border-gunmetal-700">
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Task</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Assignee</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Priority</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Due date</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-gunmetal-700/60">
                {tasks.map((t) => (
                  <tr
                    key={t._id}
                    className={`group transition-colors ${
                      isOverdue(t)
                        ? 'bg-red-50/30 dark:bg-red-900/5 hover:bg-red-50/50 dark:hover:bg-red-900/10'
                        : 'hover:bg-slate-50/80 dark:hover:bg-gunmetal-700/30'
                    }`}
                  >
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-slate-800 dark:text-white leading-tight">{t.title}</p>
                      {t.description && (
                        <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500 truncate max-w-[240px]">
                          {t.description}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-600 dark:text-slate-300">
                      {t.assignee?.name || '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <PriorityBadge priority={t.priority} />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className={`text-sm tabular-nums ${isOverdue(t) ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}`}>
                        {new Date(t.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        {isOverdue(t) && (
                          <span className="ml-1.5 inline-flex items-center rounded-md bg-red-100 dark:bg-red-900/20 px-1.5 py-0.5 text-[10px] font-semibold text-red-600 dark:text-red-400">
                            overdue
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <TaskStatusBadge status={t.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
