import { useEffect, useState } from 'react';
import { announcementApi } from '../../api/announcementApi.js';
import { departmentApi } from '../../api/departmentApi.js';
import { teamApi } from '../../api/teamApi.js';
import { useAuth } from '../../hooks/useAuth.js';
import Button from '../../components/ui/Button.jsx';
import TextField from '../../components/ui/TextField.jsx';
import Select from '../../components/ui/Select.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Banner from '../../components/ui/Banner.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';

const TYPE_OPTIONS = [
  { value: 'notice', label: 'Notice' },
  { value: 'company', label: 'Company' },
  { value: 'holiday', label: 'Holiday' },
  { value: 'policy', label: 'Policy' },
  { value: 'event', label: 'Event' },
];
const SCOPE_OPTIONS = [
  { value: 'company', label: 'Entire company' },
  { value: 'department', label: 'A department' },
  { value: 'team', label: 'A team' },
];

const emptyForm = { title: '', body: '', type: 'notice', scope: 'company', refId: '' };

export default function Announcements() {
  const { user } = useAuth();
  const canManage = user.role === 'hr' || user.role === 'admin';

  const [announcements, setAnnouncements] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [teams, setTeams] = useState([]);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const { data } = await announcementApi.list();
      setAnnouncements(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load announcements');
    }
  };

  useEffect(() => {
    load();
    if (canManage) {
      departmentApi.list().then(({ data }) => setDepartments(data.data));
      teamApi.list().then(({ data }) => setTeams(data.data));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await announcementApi.create({ ...form, refId: form.refId || undefined });
      setModalOpen(false);
      setForm(emptyForm);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not publish announcement');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this announcement?')) return;
    await announcementApi.remove(id);
    load();
  };

  const scopeOptions = form.scope === 'department' ? departments : teams;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">Announcements</h1>
        {canManage && <Button onClick={() => setModalOpen(true)}>Publish announcement</Button>}
      </div>

      {error && (
        <div className="mt-4">
          <Banner>{error}</Banner>
        </div>
      )}

      <div className="mt-6 space-y-4">
        {announcements.length === 0 ? (
          <EmptyState title="No announcements yet" description="Company news and updates will show up here." />
        ) : (
          announcements.map((a) => (
            <div key={a._id} className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-start justify-between">
                <div>
                  <span className="rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium capitalize text-primary-700">
                    {a.type}
                  </span>
                  <p className="mt-2 font-semibold text-slate-900">{a.title}</p>
                </div>
                {canManage && (
                  <button onClick={() => handleDelete(a._id)} className="text-xs text-red-500 hover:underline">
                    Delete
                  </button>
                )}
              </div>
              <p className="mt-2 text-sm text-slate-600">{a.body}</p>
              <p className="mt-3 text-xs text-slate-400">
                {a.createdBy?.name} · {new Date(a.publishedAt).toLocaleDateString()}
              </p>
            </div>
          ))
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Publish announcement">
        <form className="space-y-4" onSubmit={handleCreate}>
          <TextField label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <TextField
            label="Body"
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            required
          />
          <Select label="Type" options={TYPE_OPTIONS} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} />
          <Select
            label="Audience"
            options={SCOPE_OPTIONS}
            value={form.scope}
            onChange={(e) => setForm({ ...form, scope: e.target.value, refId: '' })}
          />
          {form.scope !== 'company' && (
            <Select
              label={form.scope === 'department' ? 'Department' : 'Team'}
              placeholder="Select one"
              options={scopeOptions.map((o) => ({ value: o._id, label: o.name }))}
              value={form.refId}
              onChange={(e) => setForm({ ...form, refId: e.target.value })}
              required
            />
          )}
          {error && <Banner>{error}</Banner>}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Publish
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
