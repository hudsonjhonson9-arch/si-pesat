/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { UserProfile } from '../types';
import { supabase } from '../lib/supabase';
import {
  Users,
  Search,
  ShieldCheck,
  Shield,
  User as UserIcon,
  Mail,
  Hash,
  Edit2,
  Save,
  X,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Crown,
  Star,
} from 'lucide-react';

interface UserManagementViewProps {
  userProfiles: UserProfile[];
  currentUserRole: string;
  currentUserId?: string;
  onShowToast?: (message: string, type: 'success' | 'info' | 'error') => void;
  onRefreshProfiles?: () => void;
}

const ROLE_OPTIONS = ['Auditor', 'Inspektur Pembantu', 'Inspektur'] as const;
type RoleType = typeof ROLE_OPTIONS[number];

const ROLE_CONFIG: Record<string, { label: string; icon: React.ReactNode; bg: string; text: string; border: string }> = {
  Auditor: {
    label: 'Auditor',
    icon: <UserIcon className="w-3.5 h-3.5" />,
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
  },
  'Inspektur Pembantu': {
    label: 'Irban',
    icon: <Star className="w-3.5 h-3.5" />,
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
  },
  Inspektur: {
    label: 'Inspektur',
    icon: <Crown className="w-3.5 h-3.5" />,
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
  },
};

export default function UserManagementView({
  userProfiles,
  currentUserRole,
  currentUserId,
  onShowToast,
  onRefreshProfiles,
}: UserManagementViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('Semua');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<RoleType>('Auditor');
  const [editNip, setEditNip] = useState('');
  const [editGolongan, setEditGolongan] = useState('');
  const [editPangkat, setEditPangkat] = useState('');
  const [editFullName, setEditFullName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const canEdit = currentUserRole === 'Inspektur' || currentUserRole === 'Inspektur Pembantu';

  const filteredProfiles = useMemo(() => {
    return userProfiles.filter(p => {
      const matchSearch =
        (p.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.nip || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchRole = roleFilter === 'Semua' || p.role === roleFilter;
      return matchSearch && matchRole;
    });
  }, [userProfiles, searchQuery, roleFilter]);

  const roleCounts = useMemo(() => {
    const counts: Record<string, number> = { Semua: userProfiles.length };
    ROLE_OPTIONS.forEach(r => {
      counts[r] = userProfiles.filter(p => p.role === r).length;
    });
    return counts;
  }, [userProfiles]);

  const startEdit = (profile: UserProfile) => {
    setEditingUserId(profile.id);
    setEditRole((profile.role as RoleType) || 'Auditor');
    setEditNip(profile.nip || '');
    setEditGolongan(profile.golongan || '');
    setEditPangkat(profile.pangkat || '');
    setEditFullName(profile.full_name || '');
  };

  const cancelEdit = () => {
    setEditingUserId(null);
  };

  const saveEdit = async (userId: string) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          role: editRole,
          nip: editNip || null,
          golongan: editGolongan || null,
          pangkat: editPangkat || null,
          full_name: editFullName || null,
        })
        .eq('id', userId);

      if (error) throw error;
      onShowToast?.(`Profil pengguna berhasil diperbarui.`, 'success');
      setEditingUserId(null);
      onRefreshProfiles?.();
    } catch (err: any) {
      onShowToast?.(`Gagal memperbarui profil: ${err.message}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      onRefreshProfiles?.();
      onShowToast?.('Data pengguna diperbarui.', 'info');
    } finally {
      setTimeout(() => setIsRefreshing(false), 800);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" id="user-management-view">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-dark-gray flex items-center gap-2">
            <Users className="w-5 h-5 text-dark-gray/70" /> Manajemen Pengguna
          </h2>
          <p className="text-xs text-dark-gray/60 mt-1">
            Kelola peran, data kepegawaian, dan hak akses pengguna sistem SI-PESAT.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="inline-flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl bg-white border border-dark-gray/15 text-dark-gray hover:bg-baby-blue transition-all shadow-sm cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          Perbarui
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Pengguna', value: userProfiles.length, icon: <Users className="w-5 h-5 text-slate-600" />, bg: 'bg-slate-100' },
          { label: 'Auditor', value: roleCounts['Auditor'] || 0, icon: <UserIcon className="w-5 h-5 text-blue-600" />, bg: 'bg-blue-100' },
          { label: 'Inspektur Pembantu', value: roleCounts['Inspektur Pembantu'] || 0, icon: <Star className="w-5 h-5 text-amber-600" />, bg: 'bg-amber-100' },
          { label: 'Inspektur', value: roleCounts['Inspektur'] || 0, icon: <Crown className="w-5 h-5 text-purple-600" />, bg: 'bg-purple-100' },
        ].map((card, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 border border-dark-gray/10 shadow-sm">
            <div className={`w-10 h-10 ${card.bg} rounded-xl flex items-center justify-center mb-3`}>{card.icon}</div>
            <p className="text-2xl font-black text-slate-800 leading-none">{card.value}</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="bg-baby-blue rounded-xl border border-dark-gray/10 p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-gray/40 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari nama, email, atau NIP..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-dark-gray/15 rounded-lg text-sm bg-white/70 focus:bg-white outline-none text-dark-gray font-medium placeholder-dark-gray/50"
            />
          </div>
        </div>

        {/* Role filter chips */}
        <div className="flex flex-wrap gap-2">
          {['Semua', ...ROLE_OPTIONS].map(role => {
            const count = roleCounts[role] ?? 0;
            const cfg = ROLE_CONFIG[role];
            return (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                  roleFilter === role
                    ? 'bg-dark-gray text-white border-dark-gray shadow-sm'
                    : 'bg-white text-dark-gray/60 border-dark-gray/15 hover:border-dark-gray/30 hover:text-dark-gray'
                }`}
              >
                {cfg?.icon}
                {role}
                <span className={`ml-0.5 font-mono text-[10px] ${roleFilter === role ? 'text-white/70' : 'text-dark-gray/40'}`}>
                  ({count})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Access Control Notice */}
      {!canEdit && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-bold text-amber-800">Hak Akses Terbatas</p>
            <p className="text-[11px] text-amber-700 mt-0.5">Anda hanya dapat melihat daftar pengguna. Hanya Inspektur dan Inspektur Pembantu yang dapat mengubah peran dan data kepegawaian.</p>
          </div>
        </div>
      )}

      {/* User List */}
      <div className="bg-white rounded-2xl border border-dark-gray/10 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-extrabold text-dark-gray text-sm">
            Daftar Pengguna ({filteredProfiles.length})
          </h3>
          {canEdit && (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <ShieldCheck className="w-3 h-3" />
              Mode Edit Aktif
            </span>
          )}
        </div>

        {filteredProfiles.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            <p className="text-sm font-bold text-slate-400">Tidak ada pengguna ditemukan</p>
            <p className="text-xs text-slate-400 mt-1">Coba ubah filter pencarian</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {filteredProfiles.map(profile => {
              const isEditing = editingUserId === profile.id;
              const isCurrentUser = profile.id === currentUserId;
              const roleConf = ROLE_CONFIG[profile.role] || ROLE_CONFIG['Auditor'];
              return (
                <div
                  key={profile.id}
                  className={`px-6 py-4 transition-all ${isEditing ? 'bg-blue-50/40' : 'hover:bg-slate-50/50'}`}
                >
                  {isEditing ? (
                    /* Edit Form Row */
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-blue-700 flex items-center gap-1.5">
                          <Edit2 className="w-3.5 h-3.5" /> Ubah Profil: {profile.email}
                        </span>
                        <button
                          onClick={cancelEdit}
                          className="p-1 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nama Lengkap</label>
                          <input
                            type="text"
                            value={editFullName}
                            onChange={e => setEditFullName(e.target.value)}
                            className="w-full text-xs font-bold border border-slate-200 p-2 rounded-lg bg-white text-slate-700 outline-none focus:ring-1 focus:ring-blue-400"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Peran / Role</label>
                          <select
                            value={editRole}
                            onChange={e => setEditRole(e.target.value as RoleType)}
                            disabled={currentUserRole !== 'Inspektur'}
                            className="w-full text-xs font-bold border border-slate-200 p-2 rounded-lg bg-white text-slate-700 outline-none focus:ring-1 focus:ring-blue-400 disabled:opacity-60"
                          >
                            {ROLE_OPTIONS.map(r => (
                              <option key={r} value={r}>{r}</option>
                            ))}
                          </select>
                          {currentUserRole !== 'Inspektur' && (
                            <p className="text-[9px] text-amber-600 font-semibold">Hanya Inspektur yang dapat mengubah peran.</p>
                          )}
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">NIP</label>
                          <input
                            type="text"
                            value={editNip}
                            onChange={e => setEditNip(e.target.value)}
                            placeholder="Contoh: 198001012005011001"
                            className="w-full text-xs font-bold border border-slate-200 p-2 rounded-lg bg-white text-slate-700 outline-none focus:ring-1 focus:ring-blue-400 font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Golongan</label>
                          <select
                            value={editGolongan}
                            onChange={e => setEditGolongan(e.target.value)}
                            className="w-full text-xs font-bold border border-slate-200 p-2 rounded-lg bg-white text-slate-700 outline-none focus:ring-1 focus:ring-blue-400"
                          >
                            <option value="">— Pilih Golongan —</option>
                            {['I/a','I/b','I/c','I/d','II/a','II/b','II/c','II/d','III/a','III/b','III/c','III/d','IV/a','IV/b','IV/c','IV/d','IV/e'].map(g => (
                              <option key={g} value={g}>{g}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1 md:col-span-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pangkat</label>
                          <input
                            type="text"
                            value={editPangkat}
                            onChange={e => setEditPangkat(e.target.value)}
                            placeholder="Contoh: Penata Muda, Penata, Penata Tingkat I, Pembina..."
                            className="w-full text-xs font-bold border border-slate-200 p-2 rounded-lg bg-white text-slate-700 outline-none focus:ring-1 focus:ring-blue-400"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 pt-2 border-t border-blue-100">
                        <button
                          onClick={cancelEdit}
                          className="flex-1 text-xs py-2 rounded-lg font-bold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          onClick={() => saveEdit(profile.id)}
                          disabled={isSaving}
                          className="flex-1 text-xs py-2 rounded-lg font-bold bg-blue-600 text-white hover:bg-blue-700 transition cursor-pointer disabled:opacity-60 flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          {isSaving ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Menyimpan...
                            </>
                          ) : (
                            <>
                              <Save className="w-3.5 h-3.5" /> Simpan Perubahan
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Read-only Row */
                    <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-peach-accent to-amber-300 flex items-center justify-center shrink-0 text-dark-gray font-black text-sm shadow-sm">
                        {(profile.full_name || profile.email || '?')[0].toUpperCase()}
                      </div>

                      {/* Main info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-slate-800 truncate">
                            {profile.full_name || '(Nama belum diisi)'}
                          </span>
                          {isCurrentUser && (
                            <span className="text-[9px] font-black text-emerald-700 bg-emerald-100 border border-emerald-200 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                              Anda
                            </span>
                          )}
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${roleConf.bg} ${roleConf.text} ${roleConf.border}`}>
                            {roleConf.icon}
                            {roleConf.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                            <Mail className="w-3 h-3" /> {profile.email}
                          </span>
                          {profile.nip && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 font-mono">
                              <Hash className="w-3 h-3" /> {profile.nip}
                            </span>
                          )}
                        </div>
                        {(profile.pangkat || profile.golongan) && (
                          <div className="mt-1">
                            <span className="text-[10px] text-slate-400 font-medium">
                              {[profile.pangkat, profile.golongan].filter(Boolean).join(' · Gol. ')}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Edit button */}
                      {canEdit && (
                        <button
                          onClick={() => startEdit(profile)}
                          className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg border border-dark-gray/15 bg-white text-dark-gray hover:bg-baby-blue transition-all cursor-pointer shadow-xs shrink-0"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span className="hidden md:inline">Edit</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Info box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <Shield className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
        <div>
          <p className="text-xs font-bold text-blue-800">Hak Akses Peran</p>
          <ul className="text-[11px] text-blue-700 mt-1.5 space-y-1">
            <li>• <strong>Auditor</strong>: Mengerjakan KKA dan mengunggah bukti dokumen pada kategori yang ditugaskan.</li>
            <li>• <strong>Inspektur Pembantu (Irban)</strong>: Meninjau KKA, mengatur tim, mengedit profil OPD, dan mengelola pengguna.</li>
            <li>• <strong>Inspektur</strong>: Akses penuh termasuk mengubah peran pengguna dan pengaturan master sistem.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
