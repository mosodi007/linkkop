import { useState, useEffect } from 'react';
import { UserPlus, MessageCircle, Heart, Bell } from 'lucide-react';
import { fetchMyNotifications, markNotificationRead, type NotificationItem } from '@/app/lib/notifications';

const ICON_BY_TYPE: Record<string, typeof UserPlus> = {
  connection: UserPlus,
  comment: MessageCircle,
  like: Heart,
};

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchMyNotifications().then((list) => {
      if (!cancelled) {
        setNotifications(list);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleNotificationClick(n: NotificationItem) {
    if (n.readAt) return;
    const ok = await markNotificationRead(n.id);
    if (ok) {
      setNotifications((prev) =>
        prev.map((item) => (item.id === n.id ? { ...item, readAt: new Date().toISOString() } : item))
      );
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 pb-24">
      <div className="max-w-xl mx-auto px-4 pt-6">
        <h1 className="text-xl font-semibold text-neutral-900 mb-1">Notifications</h1>
        <p className="text-sm text-neutral-500 mb-6">Activity and connection updates</p>

        {loading ? (
          <p className="text-neutral-500 text-sm py-8">Loading notifications…</p>
        ) : notifications.length > 0 ? (
          <div className="space-y-1 bg-white rounded-2xl border border-neutral-200 overflow-hidden">
            {notifications.map((n) => {
              const Icon = ICON_BY_TYPE[n.type] ?? Bell;
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => handleNotificationClick(n)}
                  className={`w-full flex items-center gap-4 p-4 text-left hover:bg-neutral-50 transition-colors ${n.readAt ? 'opacity-70' : ''}`}
                >
                  <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-neutral-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-neutral-900">
                      {n.body ?? n.title ?? n.type}
                    </p>
                    <p className="text-xs text-neutral-500 mt-0.5">{n.timeAgo}</p>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-center py-12 text-neutral-500 text-sm">
            No notifications yet.
          </p>
        )}
      </div>
    </div>
  );
}
