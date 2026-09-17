import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { messageApi } from '../../api/messageApi.js';
import { employeeApi } from '../../api/employeeApi.js';
import { useAuth } from '../../hooks/useAuth.js';
import Button from '../../components/ui/Button.jsx';
import Select from '../../components/ui/Select.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Banner from '../../components/ui/Banner.jsx';

export default function Messages() {
  const { employee: me } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeWith = searchParams.get('with');
  const activeTeam = searchParams.get('team');

  const [contacts, setContacts] = useState([]);
  const [teams, setTeams] = useState([]);
  const [thread, setThread] = useState([]);
  const [threadTitle, setThreadTitle] = useState('');
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [newRecipient, setNewRecipient] = useState('');
  const bottomRef = useRef(null);

  const loadSidebar = async () => {
    try {
      const [inboxRes, teamsRes] = await Promise.all([messageApi.inbox(), messageApi.myTeams()]);
      setContacts(inboxRes.data.data);
      setTeams(teamsRes.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load messages');
    }
  };

  useEffect(() => {
    loadSidebar();
    employeeApi.list().then(({ data }) => setEmployees(data.data));
  }, []);

  const loadThread = async () => {
    try {
      if (activeWith) {
        const { data } = await messageApi.conversation(activeWith);
        setThread(data.data);
        const contact = contacts.find((c) => c.contact._id === activeWith);
        setThreadTitle(contact?.contact.name || employees.find((e) => e._id === activeWith)?.name || 'Conversation');
      } else if (activeTeam) {
        const { data } = await messageApi.teamMessages(activeTeam);
        setThread(data.data);
        setThreadTitle(teams.find((t) => t._id === activeTeam)?.name || 'Team channel');
      } else {
        setThread([]);
        setThreadTitle('');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load conversation');
    }
  };

  useEffect(() => {
    loadThread();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeWith, activeTeam, contacts, teams]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!draft.trim()) return;
    try {
      if (activeWith) await messageApi.sendDirect({ recipient: activeWith, body: draft });
      else if (activeTeam) await messageApi.sendTeam(activeTeam, draft);
      setDraft('');
      loadThread();
      loadSidebar();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send message');
    }
  };

  const startNewConversation = () => {
    if (!newRecipient) return;
    setSearchParams({ with: newRecipient });
    setNewModalOpen(false);
    setNewRecipient('');
  };

  return (
    <div className="flex h-[calc(100vh-160px)] gap-4">
      <aside className="w-64 shrink-0 overflow-y-auto rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <span className="text-sm font-semibold text-slate-900">Direct</span>
          <button onClick={() => setNewModalOpen(true)} className="text-xs font-medium text-primary-700 hover:underline">
            + New
          </button>
        </div>
        {contacts.length === 0 ? (
          <p className="px-4 py-4 text-xs text-slate-400">No conversations yet</p>
        ) : (
          contacts.map((c) => (
            <button
              key={c.contact._id}
              onClick={() => setSearchParams({ with: c.contact._id })}
              className={`flex w-full items-center justify-between border-b border-slate-50 px-4 py-3 text-left text-sm hover:bg-slate-50 ${
                activeWith === c.contact._id ? 'bg-primary-50' : ''
              }`}
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-800">{c.contact.name}</p>
                <p className="truncate text-xs text-slate-400">{c.lastMessage.body}</p>
              </div>
              {c.unreadCount > 0 && (
                <span className="ml-2 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-600 text-[10px] font-bold text-white">
                  {c.unreadCount}
                </span>
              )}
            </button>
          ))
        )}

        <div className="border-b border-t border-slate-100 px-4 py-3">
          <span className="text-sm font-semibold text-slate-900">Team channels</span>
        </div>
        {teams.length === 0 ? (
          <p className="px-4 py-4 text-xs text-slate-400">Not on a team yet</p>
        ) : (
          teams.map((t) => (
            <button
              key={t._id}
              onClick={() => setSearchParams({ team: t._id })}
              className={`block w-full border-b border-slate-50 px-4 py-3 text-left text-sm hover:bg-slate-50 ${
                activeTeam === t._id ? 'bg-primary-50' : ''
              }`}
            >
              # {t.name}
            </button>
          ))
        )}
      </aside>

      <section className="flex flex-1 flex-col rounded-xl border border-slate-200 bg-white">
        {error && (
          <div className="p-4">
            <Banner>{error}</Banner>
          </div>
        )}
        {!activeWith && !activeTeam ? (
          <div className="flex flex-1 items-center justify-center text-sm text-slate-400">
            Select a conversation or start a new one
          </div>
        ) : (
          <>
            <div className="border-b border-slate-100 px-5 py-3">
              <p className="font-semibold text-slate-900">{threadTitle}</p>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto p-5">
              {thread.map((m) => {
                const isMe = m.sender?._id === me?._id;
                return (
                  <div key={m._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs rounded-2xl px-4 py-2 text-sm ${isMe ? 'bg-primary-700 text-white' : 'bg-slate-100 text-slate-800'}`}>
                      {!isMe && activeTeam && <p className="mb-0.5 text-xs font-semibold opacity-70">{m.sender?.name}</p>}
                      <p>{m.body}</p>
                      <p className={`mt-1 text-[10px] ${isMe ? 'text-primary-200' : 'text-slate-400'}`}>
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
            <form onSubmit={handleSend} className="flex gap-2 border-t border-slate-100 p-4">
              <input
                className="flex-1 rounded-lg border border-slate-300 px-3.5 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                placeholder="Type a message..."
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
              <Button type="submit">Send</Button>
            </form>
          </>
        )}
      </section>

      <Modal open={newModalOpen} onClose={() => setNewModalOpen(false)} title="New conversation">
        <div className="space-y-4">
          <Select
            label="Message"
            placeholder="Select someone"
            options={employees.filter((e) => e._id !== me?._id).map((e) => ({ value: e._id, label: e.name }))}
            value={newRecipient}
            onChange={(e) => setNewRecipient(e.target.value)}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setNewModalOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={startNewConversation}>
              Start
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
