import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationApi } from '../../api/notificationApi.js';

function BellIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
    </svg>
  );
}

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
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:text-white/50 dark:hover:bg-white/8 transition-all duration-200"
        aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ''}`}
      >
        <BellIcon />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-white dark:ring-gunmetal-900">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 animate-scale-in">
          <div className="rounded-2xl border border-slate-200 dark:border-gunmetal-700 bg-white dark:bg-gunmetal-800 shadow-modal overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-gunmetal-700 px-4 py-3.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900 dark:text-white">Notifications</span>
                {unread > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 px-1.5 text-[10px] font-bold text-red-600 dark:text-red-400">
                    {unread}
                  </span>
                )}
              </div>
              {unread > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 px-4">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-gunmetal-700 text-xl">
                    🎉
                  </div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300">All caught up!</p>
                  <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">No new notifications</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n._id}
                    onClick={() => handleClickNotification(n)}
                    className={`block w-full border-b border-slate-50 dark:border-gunmetal-700/60 px-4 py-3.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-gunmetal-700/50 ${
                      n.isRead ? '' : 'bg-primary-50/50 dark:bg-primary-900/10'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      {!n.isRead && (
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary-500" />
                      )}
                      <div className={n.isRead ? 'pl-4' : ''}>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-tight">
                          {n.title}
                        </p>
                        {n.message && (
                          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                            {n.message}
                          </p>
                        )}
                        <p className="mt-1.5 text-[10px] text-slate-400 dark:text-slate-500">
                          {new Date(n.createdAt).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
