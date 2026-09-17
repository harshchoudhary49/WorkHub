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
import Skeleton from '../../components/ui/Skeleton.jsx';

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

const STATUS_BADGE = {
  active: 'bg-rivet-400/15 text-rivet-600 dark:text-rivet-400 ring-1 ring-rivet-400/30',
  inactive: 'bg-slate-100 dark:bg-gunmetal-700 text-slate-500 dark:text-slate-400',
  'on-leave': 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 ring-1 ring-amber-400/30',
};

function getAvatarUrl(name) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'U')}&background=2563eb&color=fff&bold=true&size=48`;
}

function SearchIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

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
      email: '',
      password: '',
      role: '',
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
    <div className="page-enter space-y-6">
      {/* ── Page Header ─────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Employees
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {employees.length} {employees.length === 1 ? 'person' : 'people'} in your organization
          </p>
        </div>
        <Button
          onClick={openCreate}
          icon={<PlusIcon />}
          size="md"
        >
          Add employee
        </Button>
      </div>

      {/* ── Search Bar ──────────────────────────────────────── */}
      <form onSubmit={handleSearch} className="flex gap-2 max-w-sm">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
            <SearchIcon />
          </span>
          <input
            className="w-full rounded-[10px] border border-slate-200 dark:border-gunmetal-600 bg-white dark:bg-gunmetal-800 pl-10 pr-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none transition-all focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20 hover:border-slate-300 dark:hover:border-gunmetal-500"
            placeholder="Search by name or ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button type="submit" variant="secondary" size="md">Search</Button>
      </form>

      {error && (
        <Banner>{error}</Banner>
      )}

      {/* ── Table ───────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-gunmetal-700 bg-white dark:bg-gunmetal-800 shadow-card">
        {loading ? (
          <Skeleton.Table rows={8} cols={5} />
        ) : employees.length === 0 ? (
          <div className="p-10">
            <EmptyState
              title="No employees yet"
              description="Add your first employee to get started."
            />
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="w-full text-left text-sm min-w-[640px]">
              <thead>
                <tr className="border-b border-slate-200 dark:border-gunmetal-700 bg-slate-50/80 dark:bg-gunmetal-900/40">
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Employee
                  </th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    ID
                  </th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Department
                  </th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Team
                  </th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Status
                  </th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-gunmetal-700/60">
                {employees.map((emp) => (
                  <tr
                    key={emp._id}
                    className="group hover:bg-slate-50/80 dark:hover:bg-gunmetal-700/30 transition-colors"
                  >
                    {/* Name + Avatar */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <img
                          src={getAvatarUrl(emp.name)}
                          alt={emp.name}
                          className="h-8 w-8 rounded-lg object-cover shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 dark:text-white truncate">
                            {emp.name}
                          </p>
                          {emp.designation && (
                            <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                              {emp.designation}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      <span className="font-mono text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-gunmetal-700 rounded-md px-2 py-1">
                        {emp.employeeId}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-sm text-slate-600 dark:text-slate-300">
                      {emp.department?.name || (
                        <span className="text-slate-400 dark:text-slate-500">—</span>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-sm text-slate-600 dark:text-slate-300">
                      {emp.team?.name || (
                        <span className="text-slate-400 dark:text-slate-500">—</span>
                      )}
                    </td>

                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold capitalize ${
                          STATUS_BADGE[emp.status] || STATUS_BADGE.inactive
                        }`}
                      >
                        {emp.status?.replace('-', ' ')}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(emp)}
                          className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeactivate(emp._id)}
                          className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-gunmetal-700 transition-colors"
                        >
                          Deactivate
                        </button>
                        {user.role === 'admin' && (
                          <button
                            onClick={() => handleRemove(emp._id)}
                            className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modal ───────────────────────────────────────────── */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit employee' : 'Add new employee'}
        subtitle={editingId ? 'Update employee details below.' : 'Fill in details to create a new employee account.'}
      >
        <form className="space-y-4" onSubmit={handleSave}>
          <TextField
            label="Full name"
            placeholder="Jane Smith"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          {!editingId && (
            <>
              <TextField
                label="Work email"
                type="email"
                placeholder="jane@company.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
              <TextField
                label="Temporary password"
                type="password"
                placeholder="Min. 8 characters"
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
            label="Designation / Job title"
            placeholder="e.g. Senior Engineer"
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

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100 dark:border-gunmetal-700 mt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalOpen(false)}
            >
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
