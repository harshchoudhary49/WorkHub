import { useEffect, useState } from 'react';
import { officeApi } from '../../api/officeApi.js';
import Button from '../../components/ui/Button.jsx';
import TextField from '../../components/ui/TextField.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Banner from '../../components/ui/Banner.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';

const emptyForm = { name: '', address: '', timezone: 'Asia/Kolkata' };

export default function Offices() {
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
      const { data } = await officeApi.list();
      setOffices(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load offices');
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

  const openEdit = (office) => {
    setEditingId(office._id);
    setForm({ name: office.name, address: office.address, timezone: office.timezone });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editingId) await officeApi.update(editingId, form);
      else await officeApi.create(form);
      setModalOpen(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save office');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this office?')) return;
    try {
      await officeApi.remove(id);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete office');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">Offices</h1>
        <Button onClick={openCreate}>Add office</Button>
      </div>

      {error && (
        <div className="mt-4">
          <Banner>{error}</Banner>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <p className="text-sm text-slate-500">Loading...</p>
        ) : offices.length === 0 ? (
          <EmptyState title="No offices yet" description="Add your first office location." />
        ) : (
          offices.map((office) => (
            <div key={office._id} className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="font-semibold text-slate-900">{office.name}</p>
              <p className="mt-1 text-sm text-slate-500">{office.address || 'No address set'}</p>
              <p className="mt-1 text-xs text-slate-400">{office.timezone}</p>
              <div className="mt-4 flex gap-3 text-sm">
                <button onClick={() => openEdit(office)} className="text-primary-700 hover:underline">
                  Edit
                </button>
                <button onClick={() => handleDelete(office._id)} className="text-red-500 hover:underline">
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit office' : 'Add office'}>
        <form className="space-y-4" onSubmit={handleSave}>
          <TextField label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <TextField label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <TextField label="Timezone" value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} />
          {error && <Banner>{error}</Banner>}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {editingId ? 'Save changes' : 'Create office'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
