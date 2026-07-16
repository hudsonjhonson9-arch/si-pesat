/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder_key';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials are not fully configured in environment variables.');
}

// ponytail: window.name bertahan pas refresh, ilang pas tab ditutup — pake ini buat deteksi tab baru
if (typeof window !== 'undefined' && window.name !== 'si_pesat_session') {
  window.sessionStorage.removeItem('si_pesat_session');
}
if (typeof window !== 'undefined') window.name = 'si_pesat_session';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: typeof window !== 'undefined' ? window.sessionStorage : undefined,
    storageKey: 'si_pesat_session',
    persistSession: true,
  }
});
export { supabaseAnonKey };
