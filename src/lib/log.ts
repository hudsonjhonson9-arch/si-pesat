import { supabase } from './supabase';

export async function logActivity(
  action: string,
  entity_type?: string,
  entity_name?: string,
  details?: Record<string, unknown>,
  userOverride?: { id: string; name: string }
) {
  let authUser;
  try { const { data } = await supabase.auth.getUser(); authUser = data?.user; } catch {}
  if (!authUser && !userOverride) return;
  const uid = userOverride?.id || authUser!.id;
  const uname = userOverride?.name || authUser?.user_metadata?.full_name || authUser?.email || '';

  await supabase.from('activity_logs').insert({
    user_id: uid,
    user_name: uname,
    action,
    entity_type: entity_type || null,
    entity_name: entity_name || null,
    details: details || {},
  });
}
