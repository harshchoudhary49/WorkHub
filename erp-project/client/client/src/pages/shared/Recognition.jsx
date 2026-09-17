import { useEffect, useState } from 'react';
import { recognitionApi } from '../../api/recognitionApi.js';
import { employeeApi } from '../../api/employeeApi.js';
import Button from '../../components/ui/Button.jsx';
import TextField from '../../components/ui/TextField.jsx';
import Select from '../../components/ui/Select.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Banner from '../../components/ui/Banner.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';

const CATEGORY_OPTIONS = [
  { value: 'teamwork', label: 'Teamwork' },
  { value: 'leadership', label: 'Leadership' },
  { value: 'innovation', label: 'Innovation' },
  { value: 'helping', label: 'Helping others' },
  { value: 'excellence', label: 'Excellent work' },
];

const CATEGORY_EMOJI = {
  teamwork: '🤝',
  leadership: '🚀',
  innovation: '💡',
  helping: '🙌',
  excellence: '⭐',
};

const emptyForm = { to: '', category: 'teamwork', message: '' };

export default function Recognition() {
  const [tab, setTab] = useState('feed');
  const [feed, setFeed] = useState([]);
  const [mine, setMine] = useState({ received: [], given: [] });
  const [employees, setEmployees] = useState([]);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const [feedRes, mineRes, empRes] = await Promise.all([
        recognitionApi.feed(),
        recognitionApi.mine(),
        employeeApi.list(),
      ]);
      setFeed(feedRes.data.data);
      setMine(mineRes.data.data);
      setEmployees(empRes.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load recognitions');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleGive = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await recognitionApi.give(form);
      setModalOpen(false);
      setForm(emptyForm);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send recognition');
    } finally {
      setSaving(false);
    }
  };

  const list = tab === 'feed' ? feed : tab === 'received' ? mine.received : mine.given;

  const Card = ({ r }) => (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-2">
        <span className="text-xl">{CATEGORY_EMOJI[r.category]}</span>
        <p className="text-sm text-slate-700">
          <span className="font-semibold text-slate-900">{r.from?.name}</span> recognized{' '}
          <span className="font-semibold text-slate-900">{r.to?.name}</span> for{' '}
          <span className="capitalize">{r.category}</span>
        </p>
      </div>
      <p className="mt-2 text-sm text-slate-600">{r.message}</p>
      <p className="mt-2 text-xs text-slate-400">{new Date(r.createdAt).toLocaleDateString()}</p>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">Recognition</h1>
        <Button onClick={() => setModalOpen(true)}>Give recognition</Button>
      </div>

      {error && (
        <div className="mt-4">
          <Banner>{error}</Banner>
        </div>
      )}

      <div className="mt-4 flex gap-2">
        {['feed', 'received', 'given'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium capitalize ${
              tab === t ? 'bg-primary-700 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {list.length === 0 ? (
          <div className="sm:col-span-2">
            <EmptyState title="Nothing here yet" description="Recognitions you give or receive will show up here." />
          </div>
        ) : (
          list.map((r) => <Card key={r._id} r={r} />)
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Give recognition">
        <form className="space-y-4" onSubmit={handleGive}>
          <Select
            label="Recognize"
            placeholder="Select someone"
            options={employees.map((e) => ({ value: e._id, label: e.name }))}
            value={form.to}
            onChange={(e) => setForm({ ...form, to: e.target.value })}
            required
          />
          <Select label="For" options={CATEGORY_OPTIONS} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <TextField label="Message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required />
          {error && <Banner>{error}</Banner>}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Send
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
