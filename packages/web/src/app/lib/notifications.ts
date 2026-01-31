import { supabase } from '@/app/lib/supabase';
import type { NotificationRow } from '@/app/types/database';

export interface NotificationItem {
  id: string;
  type: string;
  title: string | null;
  body: string | null;
  readAt: string | null;
  createdAt: string;
  timeAgo: string;
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

const MOCK_NOTIFICATIONS: NotificationItem[] = [
  { id: '1', type: 'connection', title: 'Connection accepted', body: 'Amina Okonkwo accepted your connection request', readAt: null, createdAt: new Date(Date.now() - 120000).toISOString(), timeAgo: '2m ago' },
  { id: '2', type: 'comment', title: 'New comment', body: 'Chukwudi Eze commented on your post', readAt: null, createdAt: new Date(Date.now() - 3600000).toISOString(), timeAgo: '1h ago' },
  { id: '3', type: 'like', title: 'Like', body: 'Funmi Adeyemi liked your post', readAt: null, createdAt: new Date(Date.now() - 10800000).toISOString(), timeAgo: '3h ago' },
  { id: '4', type: 'connection', title: 'Connection request', body: 'Zainab Ibrahim wants to connect', readAt: null, createdAt: new Date(Date.now() - 86400000).toISOString(), timeAgo: 'Yesterday' },
];

export async function fetchMyNotifications(): Promise<NotificationItem[]> {
  if (!supabase) {
    return MOCK_NOTIFICATIONS.map((n) => ({ ...n, timeAgo: formatTimeAgo(n.createdAt) }));
  }
  const { data: session } = await supabase.auth.getSession();
  const userId = session?.data?.session?.user?.id;
  if (!userId) return [];

  const { data, error } = await supabase
    .from('notifications')
    .select('id, type, title, body, read_at, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) return [];
  return (data ?? []).map((row) => {
    const r = row as NotificationRow;
    return {
      id: r.id,
      type: r.type,
      title: r.title,
      body: r.body,
      readAt: r.read_at,
      createdAt: r.created_at,
      timeAgo: formatTimeAgo(r.created_at),
    };
  });
}

export async function markNotificationRead(id: string): Promise<boolean> {
  if (!supabase) return false;
  const { data: session } = await supabase.auth.getSession();
  const userId = session?.data?.session?.user?.id;
  if (!userId) return false;
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', userId);
  return !error;
}
