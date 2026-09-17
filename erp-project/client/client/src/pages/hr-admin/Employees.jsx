import { useEffect, useState } from 'react';
import { employeeApi } from '../../api/employeeApi.js';
import { departmentApi } from '../../api/departmentApi.js';
import { teamApi } from '../../api/teamApi.js';
import { useAuth } from '../../hooks/useAuth.js';
import Button from '../../components/ui/Button.jsx';
import TextField from '../../components/ui/TextField.jsx';
import Select from '../../components/ui/Select.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Banner from '../../components/ui/Banner.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'on-leave', label: 'On leave' },
];
const ROLE_OPTIONS = [
  { value: 'employee', label: 'Employee' },
  { value: 'manager', label: 'Manager' },
  { value: 'hr', label: 'HR' },
  { value: 'admin', label: 'Admin' },
];

const emptyForm = {
  name: '',
  email: '',
  password: '',
  role: 'employee',
  designation: '',
  department: '',
  team: '',
};

export default function Employees() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [teams, setTeams] = useState([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const loadAll = async (params = {}) => {
    setLoading(true);
    try {
      const [empRes, deptRes, teamRes] = await Promise.all([
        employeeApi.list(params),
        departmentApi.list(),
        teamApi.list(),
      ]);
      setEmployees(empRes.data.data);
      setDepartments(deptRes.data.data);
      setTeams(teamRes.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    loadAll({ search });
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (employee) => {
    setEditingId(employee._id);
    setForm({
      name: employee.name,
      email: '', // not editable here
      password: '',
      role: '', // fetched fresh below only if needed; admin edit doesn't require re-typing
      designation: employee.designation || '',
      department: employee.department?._id || '',
      team: employee.team?._id || '',
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editingId) {
        await employeeApi.updateAdmin(editingId, {
          name: form.name,
          designation: form.designation,
          department: form.department || null,
          team: form.team || null,
        });
      } else {
        await employeeApi.create(form);
      }
      setModalOpen(false);
      loadAll({ search });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save employee');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (id) => {
    await employeeApi.deactivate(id);
    loadAll({ search });
  };

  const handleRemove = async (id) => {
    if (!confirm('Permanently remove this employee? This cannot be undone.')) return;
    await employeeApi.remove(id);
    loadAll({ search });
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Employees</h1>
          <p className="mt-1 text-sm text-slate-500">{employees.length} people</p>
        </div>
        <Button onClick={openCreate}>Add employee</Button>
      </div>

      <form onSubmit={handleSearch} className="mt-6 flex max-w-sm gap-2">
        <input
          className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
          placeholder="Search by name or ID"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button type="submit" variant="ghost">
          Search
        </Button>
      </form>

      {error && (
        <div className="mt-4">
          <Banner>{error}</Banner>
        </div>
      )}

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
        {loading ? (
          <p className="p-6 text-sm text-slate-500">Loading...</p>
        ) : employees.length === 0 ? (
          <div className="p-6">
            <EmptyState title="No employees yet" description="Add your first employee to get started." />
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Employee ID</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Team</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employees.map((emp) => (
                <tr key={emp._id}>
                  <td className="px-4 py-3 font-medium text-slate-900">{emp.name}</td>
                  <td className="px-4 py-3 text-slate-500">{emp.employeeId}</td>
                  <td className="px-4 py-3 text-slate-500">{emp.department?.name || '—'}</td>
                  <td className="px-4 py-3 text-slate-500">{emp.team?.name || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium capitalize text-slate-600">
                      {emp.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => openEdit(emp)}
                      className="mr-3 text-primary-700 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeactivate(emp._id)}
                      className="mr-3 text-slate-500 hover:underline"
                    >
                      Deactivate
                    </button>
                    {user.role === 'admin' && (
                      <button
                        onClick={() => handleRemove(emp._id)}
                        className="text-red-500 hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit employee' : 'Add employee'}>
        <form className="space-y-4" onSubmit={handleSave}>
          <TextField
            label="Full name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          {!editingId && (
            <>
              <TextField
                label="Work email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
              <TextField
                label="Temporary password"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                minLength={8}
                required
              />
              <Select
                label="Role"
                options={ROLE_OPTIONS}
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              />
            </>
          )}
          <TextField
            label="Designation"
            value={form.designation}
            onChange={(e) => setForm({ ...form, designation: e.target.value })}
          />
          <Select
            label="Department"
            placeholder="No department"
            options={departments.map((d) => ({ value: d._id, label: d.name }))}
            value={form.department}
            onChange={(e) => setForm({ ...form, department: e.target.value })}
          />
          <Select
            label="Team"
            placeholder="No team"
            options={teams.map((t) => ({ value: t._id, label: t.name }))}
            value={form.team}
            onChange={(e) => setForm({ ...form, team: e.target.value })}
          />

          {error && <Banner>{error}</Banner>}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {editingId ? 'Save changes' : 'Create employee'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
