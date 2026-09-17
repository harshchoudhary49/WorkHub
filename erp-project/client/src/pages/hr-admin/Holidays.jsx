import { useEffect, useState } from 'react';
import { holidayApi } from '../../api/holidayApi.js';
import { officeApi } from '../../api/officeApi.js';
import Button from '../../components/ui/Button.jsx';
import TextField from '../../components/ui/TextField.jsx';
import Select from '../../components/ui/Select.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Banner from '../../components/ui/Banner.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';

const emptyForm = { name: '', date: '', office: '' };

export default function Holidays() {
  const [holidays, setHolidays] = useState([]);
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [holRes, officeRes] = await Promise.all([holidayApi.list(), officeApi.list()]);
      setHolidays(holRes.data.data);
      setOffices(officeRes.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load holidays');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await holidayApi.create({ ...form, office: form.office || null });
      setModalOpen(false);
      setForm(emptyForm);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save holiday');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this holiday?')) return;
    await holidayApi.remove(id);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">Holidays</h1>
        <Button onClick={() => setModalOpen(true)}>Add holiday</Button>
      </div>

      {error && (
        <div className="mt-4">
          <Banner>{error}</Banner>
        </div>
      )}

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
        {loading ? (
          <p className="p-6 text-sm text-slate-500">Loading...</p>
        ) : holidays.length === 0 ? (
          <div className="p-6">
            <EmptyState title="No holidays configured" description="Add company holidays so attendance % excludes them." />
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Office</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {holidays.map((h) => (
                <tr key={h._id}>
                  <td className="px-4 py-3 font-medium text-slate-900">{h.name}</td>
                  <td className="px-4 py-3 text-slate-500">{new Date(h.date).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-slate-500">{h.office?.name || 'All offices'}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleDelete(h._id)} className="text-red-500 hover:underline">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add holiday">
        <form className="space-y-4" onSubmit={handleSave}>
          <TextField label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <TextField
            label="Date"
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            required
          />
          <Select
            label="Office"
            placeholder="All offices"
            options={offices.map((o) => ({ value: o._id, label: o.name }))}
            value={form.office}
            onChange={(e) => setForm({ ...form, office: e.target.value })}
          />
          {error && <Banner>{error}</Banner>}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Add holiday
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
