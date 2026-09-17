import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationApi } from '../../api/notificationApi.js';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef(null);
  const navigate = useNavigate();

  const load = async () => {
    try {
      const { data } = await notificationApi.list();
      setNotifications(data.data.notifications);
      setUnread(data.data.unread);
    } catch {
      // Silently ignore - a failed notification fetch shouldn't break the UI.
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000); // light polling until Phase 8's real-time layer
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpen = async () => {
    setOpen((o) => !o);
  };

  const handleClickNotification = async (n) => {
    if (!n.isRead) {
      await notificationApi.markRead(n._id);
      load();
    }
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  const handleMarkAllRead = async () => {
    await notificationApi.markAllRead();
    load();
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleOpen}
        className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100"
        aria-label="Notifications"
      >
        🔔
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-2 w-80 rounded-xl border border-slate-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <span className="text-sm font-semibold text-slate-900">Notifications</span>
            {unread > 0 && (
              <button onClick={handleMarkAllRead} className="text-xs text-primary-700 hover:underline">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-slate-400">You're all caught up</p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n._id}
                  onClick={() => handleClickNotification(n)}
                  className={`block w-full border-b border-slate-50 px-4 py-3 text-left text-sm hover:bg-slate-50 ${
                    n.isRead ? '' : 'bg-primary-50/40'
                  }`}
                >
                  <p className="font-medium text-slate-800">{n.title}</p>
                  {n.message && <p className="mt-0.5 text-xs text-slate-500">{n.message}</p>}
                  <p className="mt-1 text-[11px] text-slate-400">
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
