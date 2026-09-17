import { useEffect, useState } from 'react';
import { departmentApi } from '../../api/departmentApi.js';
import { officeApi } from '../../api/officeApi.js';
import Button from '../../components/ui/Button.jsx';
import TextField from '../../components/ui/TextField.jsx';
import Select from '../../components/ui/Select.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Banner from '../../components/ui/Banner.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';

const emptyForm = { name: '', office: '' };

export default function Departments() {
  const [departments, setDepartments] = useState([]);
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [deptRes, officeRes] = await Promise.all([departmentApi.list(), officeApi.list()]);
      setDepartments(deptRes.data.data);
      setOffices(officeRes.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load departments');
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

  const openEdit = (dept) => {
    setEditingId(dept._id);
    setForm({ name: dept.name, office: dept.office?._id || '' });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editingId) await departmentApi.update(editingId, form);
      else await departmentApi.create(form);
      setModalOpen(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save department');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this department?')) return;
    try {
      await departmentApi.remove(id);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete department');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">Departments</h1>
        <Button onClick={openCreate}>Add department</Button>
      </div>

      {error && (
        <div className="mt-4">
          <Banner>{error}</Banner>
        </div>
      )}

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
        {loading ? (
          <p className="p-6 text-sm text-slate-500">Loading...</p>
        ) : departments.length === 0 ? (
          <div className="p-6">
            <EmptyState title="No departments yet" description="Create one to start organizing teams." />
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Office</th>
                <th className="px-4 py-3">Head</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {departments.map((dept) => (
                <tr key={dept._id}>
                  <td className="px-4 py-3 font-medium text-slate-900">{dept.name}</td>
                  <td className="px-4 py-3 text-slate-500">{dept.office?.name || '—'}</td>
                  <td className="px-4 py-3 text-slate-500">{dept.head?.name || '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openEdit(dept)} className="mr-3 text-primary-700 hover:underline">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(dept._id)} className="text-red-500 hover:underline">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit department' : 'Add department'}>
        <form className="space-y-4" onSubmit={handleSave}>
          <TextField label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Select
            label="Office"
            placeholder="Select an office"
            options={offices.map((o) => ({ value: o._id, label: o.name }))}
            value={form.office}
            onChange={(e) => setForm({ ...form, office: e.target.value })}
            required
          />
          {error && <Banner>{error}</Banner>}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {editingId ? 'Save changes' : 'Create department'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
