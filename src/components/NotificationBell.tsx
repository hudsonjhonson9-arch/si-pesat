import React, { useState, useRef, useEffect } from 'react';
import { Bell, CheckCheck, X, FileCheck, FolderSync, TrendingDown, Info, CheckCircle, AlertTriangle } from 'lucide-react';
import { Notification, markAsRead, markAllAsRead } from '../lib/notifications';

interface NotificationBellProps {
  notifications: Notification[];
  userId: string;
  onNavigate: (hash: string) => void;
}

const typeIcons: Record<string, React.ReactNode> = {
  review_requested: <FileCheck className="w-4 h-4 text-blue-600" />,
  approved: <CheckCircle className="w-4 h-4 text-emerald-600" />,
  revision_requested: <FolderSync className="w-4 h-4 text-amber-600" />,
  info: <Info className="w-4 h-4 text-sky-600" />,
  warning: <AlertTriangle className="w-4 h-4 text-rose-600" />
};

export default function NotificationBell({ notifications, userId, onNavigate }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const unread = notifications.filter(n => !n.is_read).length;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleClick = async (n: Notification) => {
    if (!n.is_read) await markAsRead(n.id);
    setIsOpen(false);
    if (n.link) onNavigate(n.link);
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'baru saja';
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}j`;
    const days = Math.floor(hours / 24);
    return `${days}h`;
  };

  return (
    <div ref={ref} className="relative" data-dropdown="notifications">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl hover:bg-white/40 transition text-dark-gray/70 hover:text-dark-gray"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-sm border-2 border-baby-blue leading-none">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-[calc(100%+8px)] right-0 bg-white rounded-2xl shadow-xl border border-dark-gray/10 w-[360px] max-w-[90vw] z-50 flex flex-col max-h-[70vh]">
            <div className="flex items-center justify-between px-4 py-3 border-b border-dark-gray/10">
              <h3 className="text-xs font-black text-dark-gray uppercase tracking-wider">Notifikasi</h3>
              {unread > 0 && (
                <button
                  onClick={() => { markAllAsRead(userId); }}
                  className="text-[10px] font-bold text-peach-accent hover:underline flex items-center gap-1"
                >
                  <CheckCheck className="w-3 h-3" /> Tandai Dibaca
                </button>
              )}
            </div>

            <div className="overflow-y-auto flex-1">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-dark-gray/40">
                  <Bell className="w-8 h-8 mb-2" />
                  <p className="text-xs font-medium">Tidak ada notifikasi</p>
                </div>
              ) : (
                notifications.slice(0, 30).map(n => (
                  <button
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-dark-gray/[0.02] transition border-b border-dark-gray/5 last:border-0 ${
                      !n.is_read ? 'bg-peach-accent/10' : ''
                    }`}
                  >
                    <span className="mt-0.5 shrink-0">
                      {typeIcons[n.type] || typeIcons.info}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={`text-[11px] leading-snug ${!n.is_read ? 'font-bold text-dark-gray' : 'font-medium text-dark-gray/70'}`}>
                        {n.title}
                      </p>
                      {n.message && (
                        <p className="text-[10px] text-dark-gray/50 mt-0.5 line-clamp-2">{n.message}</p>
                      )}
                      <p className="text-[9px] text-dark-gray/40 mt-1 font-medium">{timeAgo(n.created_at)}</p>
                    </div>
                    {!n.is_read && (
                      <span className="w-2 h-2 rounded-full bg-peach-accent shrink-0 mt-1.5" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
