import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ActivityLog } from '../types';
import { Clock, Search, Filter } from 'lucide-react';

const ACTION_LABELS: Record<string, string> = {
  login: 'Login',
  logout: 'Logout',
  login_failed: 'Login Gagal',
  create_audit: 'Buat KKA',
  update_audit: 'Edit KKA',
  delete_audit: 'Hapus KKA',
  update_user: 'Edit Pengguna',
  create_role: 'Buat Role',
  update_role_permissions: 'Ubah Permission Role',
  delete_template: 'Hapus Template',
  reset_templates: 'Reset Template',
};

const ACTION_FILTERS = ['Semua', ...Object.keys(ACTION_LABELS)];

export default function ActivityLogView() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('Semua');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 50;

  useEffect(() => {
    setLoading(true);
    let q = supabase.from('activity_logs').select('*', { count: 'exact' }).order('created_at', { ascending: false }).range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    if (actionFilter !== 'Semua') q = q.eq('action', actionFilter);
    q.then(({ data, error }) => {
      if (!error && data) setLogs(data as ActivityLog[]);
      setLoading(false);
    });
  }, [page, actionFilter]);

  const filtered = logs.filter(l => !search || l.user_name.toLowerCase().includes(search.toLowerCase()) || (l.entity_name || '').toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-black text-dark-gray text-lg flex items-center gap-2"><Clock className="w-5 h-5 text-peach-accent" /> Log Aktivitas</h2>
          <p className="text-xs text-dark-gray/60 mt-0.5">Seluruh aktivitas pengguna sistem SI-PESAT</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input type="text" placeholder="Cari pengguna atau entitas..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-8 pr-3 py-2 text-xs border border-dark-gray/15 rounded-lg outline-none focus:border-peach-accent" />
        </div>
        <div className="flex items-center gap-1 overflow-x-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          {ACTION_FILTERS.map(a => (
            <button key={a} onClick={() => { setActionFilter(a); setPage(0); }} className={`text-[10px] font-bold px-2 py-1 rounded-lg border whitespace-nowrap transition-all ${actionFilter === a ? 'bg-peach-accent text-dark-gray border-dark-gray/10 shadow-sm' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>{ACTION_LABELS[a] || a}</button>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-dark-gray/10 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs font-bold">Memuat...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs font-bold">Tidak ada log aktivitas</div>
        ) : (
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-slate-50 z-10">
                <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-3">Waktu</th>
                  <th className="p-3">Pengguna</th>
                  <th className="p-3">Aksi</th>
                  <th className="p-3">Entitas</th>
                  <th className="p-3">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/50">
                    <td className="p-3 text-slate-500 font-mono text-[10px] whitespace-nowrap">{new Date(log.created_at).toLocaleString('id-ID')}</td>
                    <td className="p-3 font-bold text-dark-gray whitespace-nowrap">{log.user_name}</td>
                    <td className="p-3"><span className="px-2 py-0.5 rounded bg-slate-100 text-dark-gray font-bold text-[10px]">{ACTION_LABELS[log.action] || log.action}</span></td>
                    <td className="p-3 text-slate-600">{log.entity_name || <span className="text-slate-300 italic">-</span>}</td>
                    <td className="p-3 text-slate-500 text-[10px] max-w-[200px] truncate">{log.details ? JSON.stringify(log.details) : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="flex justify-center gap-2">
        <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 text-xs font-bold border rounded-lg disabled:opacity-30 disabled:cursor-default hover:bg-slate-50">Sebelumnya</button>
        <button onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 text-xs font-bold border rounded-lg hover:bg-slate-50">Selanjutnya</button>
      </div>
    </div>
  );
}
