import { useEffect, useState } from 'react';
import { taskApi } from '../../api/taskApi.js';
import Button from '../../components/ui/Button.jsx';
import TextField from '../../components/ui/TextField.jsx';
import Select from '../../components/ui/Select.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Banner from '../../components/ui/Banner.jsx';
import TaskStatusBadge from '../../components/ui/TaskStatusBadge.jsx';
import PriorityBadge from '../../components/ui/PriorityBadge.jsx';
import WorkloadBadge from '../../components/ui/WorkloadBadge.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

const emptyForm = { title: '', description: '', assignee: '', priority: 'medium', dueDate: '', estimatedHours: '' };

const isOverdue = (task) => task.status !== 'COMPLETED' && new Date(task.dueDate) < new Date(new Date().toDateString());

export default function ManagerTasks() {
  const [tasks, setTasks] = useState([]);
  const [workload, setWorkload] = useState([]);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const load = async () => {
    setError('');
    try {
      const { data } = await taskApi.teamTasks();
      setTasks(data.data.tasks);
      setWorkload(data.data.workload);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load team tasks');
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
      await taskApi.create({
        ...form,
        estimatedHours: form.estimatedHours ? Number(form.estimatedHours) : undefined,
      });
      setModalOpen(false);
      setForm(emptyForm);
      load();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Could not create task');
    } finally {
      setSaving(false);
    }
  };

  const teamMembers = workload.map((w) => w.employee);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">Team tasks</h1>
        <Button onClick={() => setModalOpen(true)}>Assign task</Button>
      </div>

      {error && (
        <div className="mt-4">
          <Banner>{error}</Banner>
        </div>
      )}

      <div className="mt-6">
        <p className="text-sm font-medium text-slate-700">Workload by team member</p>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workload.length === 0 ? (
            <EmptyState title="No team members" description="You'll see workload here once HR assigns your team." />
          ) : (
            workload.map((w) => (
              <div key={w.employee._id} className="rounded-xl border border-slate-200 bg-white p-5">
                <p className="font-semibold text-slate-900">{w.employee.name}</p>
                <div className="mt-2">
                  <WorkloadBadge workload={w.workloadLabel} />
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  {w.active} active · {w.completed} completed
                  {w.overdue > 0 && <span className="ml-1 font-medium text-red-500">· {w.overdue} overdue</span>}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white">
        {tasks.length === 0 ? (
          <div className="p-6">
            <EmptyState title="No tasks yet" description="Assign your first task to a team member." />
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Assign task">
        <form className="space-y-4" onSubmit={handleCreate}>
          <TextField label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <TextField
            label="Description (optional)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <Select
            label="Assignee"
            placeholder="Select a team member"
            options={teamMembers.map((m) => ({ value: m._id, label: m.name }))}
            value={form.assignee}
            onChange={(e) => setForm({ ...form, assignee: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Priority"
              options={PRIORITY_OPTIONS}
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
            />
            <TextField
              label="Due date"
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              required
            />
          </div>
          <TextField
            label="Estimated hours (optional)"
            type="number"
            min="0"
            value={form.estimatedHours}
            onChange={(e) => setForm({ ...form, estimatedHours: e.target.value })}
          />
          {formError && <Banner>{formError}</Banner>}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Assign task
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
