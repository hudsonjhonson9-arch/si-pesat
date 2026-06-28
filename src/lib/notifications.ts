import { supabase } from './supabase';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string | null;
  type: string;
  is_read: boolean;
  link: string | null;
  related_entity_type: string | null;
  related_entity_id: string | null;
  created_at: string;
}

export async function createNotification(
  userId: string,
  title: string,
  message?: string,
  type: string = 'info',
  link?: string,
  entityType?: string,
  entityId?: string
) {
  await supabase.from('notifications').insert({
    user_id: userId,
    title,
    message: message || null,
    type,
    link: link || null,
    related_entity_type: entityType || null,
    related_entity_id: entityId || null
  });
}

export async function markAsRead(notificationId: string) {
  await supabase.from('notifications').update({ is_read: true }).eq('id', notificationId);
}

export async function markAllAsRead(userId: string) {
  await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).is('is_read', false);
}
