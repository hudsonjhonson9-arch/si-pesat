import React, { useState } from 'react';
import { TargetEntity, Bidang } from '../types';
import { supabase } from '../lib/supabase';
import { Plus, Search, Trash2, Edit2, X, Check, Building } from 'lucide-react';

const OPD_TYPE_OPTIONS = ['OPD', 'Desa', 'Sekolah', 'Puskesmas', 'Lainnya'] as const;

interface ObjekAuditViewProps {
  targetEntities: TargetEntity[];
  bidangList: Bidang[];
  onRefresh: () => void;
}

export default function ObjekAuditView({ targetEntities, bidangList, onRefresh }: ObjekAuditViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('Semua');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', type: 'OPD' as string, head_name: '', contact: '', address: '', bidang_id: '' });

  const filtered = targetEntities.filter(e => {
    const matchSearch = !searchQuery || e.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchType = typeFilter === 'Semua' || e.type === typeFilter;
    return matchSearch && matchType;
  });

  const resetForm = () => {
    setForm({ name: '', type: 'OPD', head_name: '', contact: '', address: '', bidang_id: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    const payload = {
      name: form.name.trim(),
      type: form.type,
      head_name: form.head_name.trim() || null,
      contact: form.contact.trim() || null,
      address: form.address.trim() || null,
      bidang_id: form.bidang_id ? parseInt(form.bidang_id) : null,
    };

    if (editingId) {
      await supabase.from('target_entities').update(payload).eq('id', editingId);
    } else {
      await supabase.from('target_entities').insert(payload);
    }

    resetForm();
    onRefresh();
  };

  const handleEdit = (e: TargetEntity) => {
    setForm({
      name: e.name,
      type: e.type,
      head_name: e.head_name || '',
      contact: e.contact || '',
      address: e.address || '',
      bidang_id: e.bidang_id?.toString() || '',
    });
    setEditingId(e.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Hapus objek audit "${name}"?`)) return;
    await supabase.from('target_entities').delete().eq('id', id);
    onRefresh();
  };

  return (
    <div className="space-y-4 text-dark-gray">
      <div className="flex items-center gap-2">
        <div className="w-1 h-6 bg-peach-accent rounded-full" />
        <h2 className="text-lg font-black tracking-tight">Objek Audit</h2>
      </div>

      <div className="bg-baby-blue rounded-xl border border-dark-gray/10 p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-dark-gray/50 pointer-events-none">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Cari objek audit..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-dark-gray/15 rounded-lg text-sm bg-white/70 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-peach-accent/30 focus:border-peach-accent outline-none transition text-dark-gray placeholder-dark-gray/50 font-medium"
            />
          </div>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="text-xs font-bold border border-dark-gray/15 p-2 rounded-lg bg-white text-dark-gray focus:outline-hidden focus:border-peach-accent"
          >
            <option value="Semua">Semua Tipe</option>
            {OPD_TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="inline-flex items-center gap-1.5 bg-dark-gray text-white text-xs font-extrabold px-4 py-2 rounded-lg hover:bg-dark-gray/80 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Tambah
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border-2 border-dashed border-dark-gray/30 rounded-xl p-4 space-y-3 shadow-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1 sm:col-span-2">
              <label className="text-[10px] font-bold text-dark-gray/65 uppercase tracking-wide">Nama Instansi / OPD</label>
              <input required type="text" placeholder="Misal: Dinas Kesehatan" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full text-xs font-bold border border-dark-gray/15 p-2 rounded-lg bg-white outline-none focus:ring-2 focus:ring-dark-gray/20" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-dark-gray/65 uppercase tracking-wide">Tipe</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                className="w-full text-xs font-bold border border-dark-gray/15 p-2 rounded-lg bg-white outline-none">
                {OPD_TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-dark-gray/65 uppercase tracking-wide">Bidang / Wilayah</label>
              <select value={form.bidang_id} onChange={e => setForm({ ...form, bidang_id: e.target.value })}
                className="w-full text-xs font-bold border border-dark-gray/15 p-2 rounded-lg bg-white outline-none">
                <option value="">-- Pilih Bidang --</option>
                {bidangList.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-dark-gray/65 uppercase tracking-wide">Kepala / Pimpinan</label>
              <input type="text" placeholder="Nama kepala" value={form.head_name}
                onChange={e => setForm({ ...form, head_name: e.target.value })}
                className="w-full text-xs font-bold border border-dark-gray/15 p-2 rounded-lg bg-white outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-dark-gray/65 uppercase tracking-wide">Kontak</label>
              <input type="text" placeholder="Telepon/HP" value={form.contact}
                onChange={e => setForm({ ...form, contact: e.target.value })}
                className="w-full text-xs font-bold border border-dark-gray/15 p-2 rounded-lg bg-white outline-none" />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="text-[10px] font-bold text-dark-gray/65 uppercase tracking-wide">Alamat</label>
              <input type="text" placeholder="Alamat lengkap" value={form.address}
                onChange={e => setForm({ ...form, address: e.target.value })}
                className="w-full text-xs font-bold border border-dark-gray/15 p-2 rounded-lg bg-white outline-none" />
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <button type="submit" className="text-[10px] font-extrabold bg-dark-gray text-white px-4 py-1.5 rounded-lg hover:bg-dark-gray/80 transition cursor-pointer">
              {editingId ? 'Simpan' : 'Tambah'}
            </button>
            <button type="button" onClick={resetForm}
              className="text-[10px] font-bold text-dark-gray/70 hover:text-dark-gray px-3 py-1.5 rounded-lg border border-dark-gray/20 hover:bg-dark-gray/5 transition cursor-pointer">
              Batal
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border border-dark-gray/10 overflow-hidden shadow-xs">
        {filtered.length === 0 ? (
          <div className="p-8 text-center">
            <Building className="w-10 h-10 text-dark-gray/30 mx-auto mb-2" />
            <p className="text-sm font-bold text-dark-gray/50">Tidak ada objek audit</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-dark-gray/5 border-b border-dark-gray/10">
                  <th className="text-left px-4 py-2.5 font-extrabold text-dark-gray/70 text-[10px] uppercase tracking-wider">Nama</th>
                  <th className="text-left px-4 py-2.5 font-extrabold text-dark-gray/70 text-[10px] uppercase tracking-wider">Tipe</th>
                  <th className="text-left px-4 py-2.5 font-extrabold text-dark-gray/70 text-[10px] uppercase tracking-wider">Bidang</th>
                  <th className="text-left px-4 py-2.5 font-extrabold text-dark-gray/70 text-[10px] uppercase tracking-wider">Kepala</th>
                  <th className="text-left px-4 py-2.5 font-extrabold text-dark-gray/70 text-[10px] uppercase tracking-wider">Kontak</th>
                  <th className="text-right px-4 py-2.5 font-extrabold text-dark-gray/70 text-[10px] uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-gray/5">
                {filtered.map(e => (
                  <tr key={e.id} className="hover:bg-baby-blue/40 transition">
                    <td className="px-4 py-2.5 font-bold">{e.name}</td>
                    <td className="px-4 py-2.5">
                      <span className="text-[10px] bg-peach-accent/30 border border-peach-accent/50 text-dark-gray px-2 py-0.5 rounded-full font-bold uppercase">{e.type}</span>
                    </td>
                    <td className="px-4 py-2.5 font-medium text-dark-gray/70">{bidangList.find(b => b.id === e.bidang_id)?.name || '-'}</td>
                    <td className="px-4 py-2.5 font-medium">{e.head_name || '-'}</td>
                    <td className="px-4 py-2.5 font-medium">{e.contact || '-'}</td>
                    <td className="px-4 py-2.5 text-right">
                      <button onClick={() => handleEdit(e)} className="p-1.5 text-dark-gray/50 hover:text-dark-gray hover:bg-dark-gray/5 rounded transition cursor-pointer" title="Edit">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(e.id, e.name)} className="p-1.5 text-rose-500/70 hover:text-rose-700 hover:bg-rose-50 rounded transition cursor-pointer ml-1" title="Hapus">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
