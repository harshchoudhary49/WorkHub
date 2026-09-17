import { useEffect, useState } from 'react';
import { teamApi } from '../../api/teamApi.js';
import { departmentApi } from '../../api/departmentApi.js';
import { employeeApi } from '../../api/employeeApi.js';
import Button from '../../components/ui/Button.jsx';
import TextField from '../../components/ui/TextField.jsx';
import Select from '../../components/ui/Select.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Banner from '../../components/ui/Banner.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';

const emptyForm = { name: '', department: '', manager: '', members: [] };

export default function Teams() {
  const [teams, setTeams] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [teamRes, deptRes, empRes] = await Promise.all([
        teamApi.list(),
        departmentApi.list(),
        employeeApi.list(),
      ]);
      setTeams(teamRes.data.data);
      setDepartments(deptRes.data.data);
      setEmployees(empRes.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (team) => {
    setEditingId(team._id);
    setForm({
      name: team.name,
      department: team.department?._id || '',
      manager: team.manager?._id || '',
      members: team.members?.map((m) => m._id) || [],
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = { ...form, manager: form.manager || null };
      if (editingId) await teamApi.update(editingId, payload);
      else await teamApi.create(payload);
      setModalOpen(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save team');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this team?')) return;
    try {
      await teamApi.remove(id);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete team');
    }
  };

  const toggleMember = (id) => {
    setForm((prev) => ({
      ...prev,
      members: prev.members.includes(id)
        ? prev.members.filter((m) => m !== id)
        : [...prev.members, id],
    }));
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">Teams</h1>
        <Button onClick={openCreate}>Add team</Button>
      </div>

      {error && (
        <div className="mt-4">
          <Banner>{error}</Banner>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <p className="text-sm text-slate-500">Loading...</p>
        ) : teams.length === 0 ? (
          <EmptyState title="No teams yet" description="Create a team and assign a manager." />
        ) : (
          teams.map((team) => (
            <div key={team._id} className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="font-semibold text-slate-900">{team.name}</p>
              <p className="mt-1 text-sm text-slate-500">{team.department?.name}</p>
              <p className="mt-2 text-xs text-slate-400">
                Manager: {team.manager?.name || 'Unassigned'}
              </p>
              <p className="mt-1 text-xs text-slate-400">{team.members?.length || 0} members</p>
              <div className="mt-4 flex gap-3 text-sm">
                <button onClick={() => openEdit(team)} className="text-primary-700 hover:underline">
                  Edit
                </button>
                <button onClick={() => handleDelete(team._id)} className="text-red-500 hover:underline">
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit team' : 'Add team'}>
        <form className="space-y-4" onSubmit={handleSave}>
          <TextField label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Select
            label="Department"
            placeholder="Select a department"
            options={departments.map((d) => ({ value: d._id, label: d.name }))}
            value={form.department}
            onChange={(e) => setForm({ ...form, department: e.target.value })}
            required
          />
          <Select
            label="Manager"
            placeholder="Unassigned"
            options={employees.map((e) => ({ value: e._id, label: e.name }))}
            value={form.manager}
            onChange={(e) => setForm({ ...form, manager: e.target.value })}
          />

          <div>
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Members</span>
            <div className="max-h-40 space-y-1.5 overflow-y-auto rounded-lg border border-slate-200 p-3">
              {employees.map((emp) => (
                <label key={emp._id} className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.members.includes(emp._id)}
                    onChange={() => toggleMember(emp._id)}
                  />
                  {emp.name}
                </label>
              ))}
            </div>
          </div>

          {error && <Banner>{error}</Banner>}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {editingId ? 'Save changes' : 'Create team'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
