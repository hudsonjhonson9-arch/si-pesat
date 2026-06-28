import { supabase } from './supabase';

export async function logActivity(
  action: string,
  entity_type?: string,
  entity_name?: string,
  details?: Record<string, unknown>,
  userOverride?: { id: string; name: string }
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user && !userOverride) return;
  const uid = userOverride?.id || user!.id;
  const uname = userOverride?.name || user?.user_metadata?.full_name || user?.email || '';

  await supabase.from('activity_logs').insert({
    user_id: uid,
    user_name: uname,
    action,
    entity_type: entity_type || null,
    entity_name: entity_name || null,
    details: details || {},
  });
}
