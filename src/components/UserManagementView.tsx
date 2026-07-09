/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { UserProfile } from '../types';
import { supabase } from '../lib/supabase';
import { logActivity } from '../lib/log';
import { createClient } from '@supabase/supabase-js';
import {
  Users, Search, ShieldCheck, Shield, User as UserIcon,
  Mail, Hash, Edit2, Save, X, AlertTriangle, RefreshCw,
  Crown, Star, Smartphone, KeyRound, UserPlus, Eye, EyeOff, Lock,
} from 'lucide-react';

// Instance terpisah agar signup pengguna baru tidak mematikan sesi admin
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder_key';
const secondarySupabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { storageKey: 'si_pesat_secondary_auth', autoRefreshToken: false, persistSession: false }
});

interface UserManagementViewProps {
  userProfiles: UserProfile[];
  currentUserRole: string;
  isAdmin?: boolean;
  currentUserId?: string;
  bidangList?: { id: number; name: string }[];
  onShowToast?: (message: string, type: 'success' | 'info' | 'error') => void;
  onRefreshProfiles?: () => void;
}

const ROLE_OPTIONS = [
  'Inspektur', 'Sekretaris', 'Inspektur Pembantu',
  'Auditor Ahli Utama', 'Auditor Ahli Madya', 'Auditor Ahli Muda', 'Auditor Ahli Pertama',
  'Auditor Penyelia', 'Auditor Pelaksana Lanjutan', 'Auditor Pelaksana',
  'PPUPD Ahli Utama', 'PPUPD Ahli Madya', 'PPUPD Ahli Muda', 'PPUPD Ahli Pertama',
  'PPPK'
] as const;
type RoleType = typeof ROLE_OPTIONS[number];

const ROLE_ORDER: Record<string, number> = {
  'Inspektur': 0, 'Sekretaris': 1, 'Inspektur Pembantu': 2,
  'Auditor Ahli Utama': 3, 'Auditor Ahli Madya': 4, 'Auditor Ahli Muda': 5, 'Auditor Ahli Pertama': 6,
  'Auditor Penyelia': 7, 'Auditor Pelaksana Lanjutan': 8, 'Auditor Pelaksana': 9,
  'PPUPD Ahli Utama': 10, 'PPUPD Ahli Madya': 11, 'PPUPD Ahli Muda': 12, 'PPUPD Ahli Pertama': 13,
  'PPPK': 14,
};

const GOLONGAN_ORDER: Record<string, number> = {
  'IV/e': 0, 'IV/d': 1, 'IV/c': 2, 'IV/b': 3, 'IV/a': 4,
  'III/d': 5, 'III/c': 6, 'III/b': 7, 'III/a': 8,
  'II/d': 9, 'II/c': 10, 'II/b': 11, 'II/a': 12,
  'I/d': 13, 'I/c': 14, 'I/b': 15, 'I/a': 16,
};

const PNS_GOLONGAN = ['I/a','I/b','I/c','I/d','II/a','II/b','II/c','II/d','III/a','III/b','III/c','III/d','IV/a','IV/b','IV/c','IV/d','IV/e'];
const PPPK_GOLONGAN = ['IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII'];

const ROLE_CONFIG: Record<string, { label: string; icon: React.ReactNode; bg: string; text: string; border: string }> = {
  Inspektur: { label: 'Inspektur', icon: <Crown className="w-3.5 h-3.5" />, bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  Sekretaris: { label: 'Sekretaris', icon: <ShieldCheck className="w-3.5 h-3.5" />, bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  'Inspektur Pembantu': { label: 'Irban', icon: <Star className="w-3.5 h-3.5" />, bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  'Auditor Ahli Utama': { label: 'Ahli Utama', icon: <UserIcon className="w-3.5 h-3.5" />, bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  'Auditor Ahli Madya': { label: 'Ahli Madya', icon: <UserIcon className="w-3.5 h-3.5" />, bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  'Auditor Ahli Muda': { label: 'Ahli Muda', icon: <UserIcon className="w-3.5 h-3.5" />, bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  'Auditor Ahli Pertama': { label: 'Ahli Pertama', icon: <UserIcon className="w-3.5 h-3.5" />, bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  'Auditor Penyelia': { label: 'Penyelia', icon: <UserIcon className="w-3.5 h-3.5" />, bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  'Auditor Pelaksana Lanjutan': { label: 'Pelaksana Lanjutan', icon: <UserIcon className="w-3.5 h-3.5" />, bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  'Auditor Pelaksana': { label: 'Pelaksana', icon: <UserIcon className="w-3.5 h-3.5" />, bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  'PPUPD Ahli Utama': { label: 'PPUPD Ahli Utama', icon: <Shield className="w-3.5 h-3.5" />, bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
  'PPUPD Ahli Madya': { label: 'PPUPD Ahli Madya', icon: <Shield className="w-3.5 h-3.5" />, bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
  'PPUPD Ahli Muda': { label: 'PPUPD Ahli Muda', icon: <Shield className="w-3.5 h-3.5" />, bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
  'PPUPD Ahli Pertama': { label: 'PPUPD Ahli Pertama', icon: <Shield className="w-3.5 h-3.5" />, bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
  PPPK: { label: 'PPPK', icon: <ShieldCheck className="w-3.5 h-3.5" />, bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
};

export default function UserManagementView({
  userProfiles, currentUserRole, isAdmin = false, currentUserId, bidangList = [], onShowToast, onRefreshProfiles,
}: UserManagementViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('Semua');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<RoleType>('Auditor Pelaksana');
  const [editNip, setEditNip] = useState('');
  const [editGolongan, setEditGolongan] = useState('');
  const [editPangkat, setEditPangkat] = useState('');
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editMfaRequired, setEditMfaRequired] = useState(false);
  const [editIsAdmin, setEditIsAdmin] = useState(false);
  const [editJenisAsn, setEditJenisAsn] = useState<'PNS' | 'PPPK' | ''>('');
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ── Tambah Pengguna Modal ──
  const [showAddModal, setShowAddModal] = useState(false);
  const [addEmail, setAddEmail] = useState('');
  const [addPassword, setAddPassword] = useState('');
  const [addFullName, setAddFullName] = useState('');
  const [addRole, setAddRole] = useState<RoleType>('Auditor Pelaksana');
  const [addNip, setAddNip] = useState('');
  const [addGolongan, setAddGolongan] = useState('');
  const [addPangkat, setAddPangkat] = useState('');
  const [addIsAdmin, setAddIsAdmin] = useState(false);
  const [addJenisAsn, setAddJenisAsn] = useState<'PNS' | 'PPPK' | ''>('');
  const [addBidangId, setAddBidangId] = useState<number | ''>('');
  const [editBidangId, setEditBidangId] = useState<number | ''>('');
  const [showPassword, setShowPassword] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const getAutoAdmin = (role: string) => role === 'Inspektur' || role === 'Sekretaris';

  useEffect(() => {
    setAddIsAdmin(getAutoAdmin(addRole));
  }, [addRole]);

  useEffect(() => {
    setEditIsAdmin(getAutoAdmin(editRole));
  }, [editRole]);

  const resetAddForm = () => {
    setAddEmail(''); setAddPassword(''); setAddFullName('');
    setAddRole('Auditor Pelaksana'); setAddNip('');
    setAddGolongan(''); setAddPangkat('');
    setAddIsAdmin(false); setAddJenisAsn(''); setAddBidangId('');
    setAddError(null); setShowPassword(false);
  };

  const handleAddUser = async () => {
    if (!addEmail.trim() || !addPassword.trim() || !addFullName.trim()) {
      setAddError('Email, password, dan nama lengkap wajib diisi.');
      return;
    }
    const pwdErrors: string[] = [];
    if (addPassword.length < 8) pwdErrors.push('minimal 8 karakter');
    if (!/[A-Z]/.test(addPassword)) pwdErrors.push('huruf besar');
    if (!/[a-z]/.test(addPassword)) pwdErrors.push('huruf kecil');
    if (!/[0-9]/.test(addPassword)) pwdErrors.push('angka');
    if (!/[!@#$%^&*(),.?":{}|<>_\-]/.test(addPassword)) pwdErrors.push('karakter khusus');
    if (pwdErrors.length > 0) {
      setAddError('Password harus mengandung: ' + pwdErrors.join(', ') + '.');
      return;
    }
    setIsAdding(true);
    setAddError(null);
    try {
      // Daftarkan via instance terpisah agar sesi admin tidak terputus
      const { data, error: signUpError } = await secondarySupabase.auth.signUp({
        email: addEmail.trim(),
        password: addPassword,
        options: { data: { full_name: addFullName.trim() } },
      });
      if (signUpError) throw signUpError;
      if (!data.user) throw new Error('Gagal membuat akun — coba lagi.');

      // Upsert profil langsung ke tabel profiles
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: data.user.id,
        email: addEmail.trim(),
        full_name: addFullName.trim(),
        role: addRole,
        nip: addNip.trim() || null,
        golongan: addGolongan || null,
        pangkat: addPangkat.trim() || null,
        is_admin: addIsAdmin,
        jenis_asn: addJenisAsn || null,
        bidang_id: addBidangId || null,
      }, { onConflict: 'id' });
      if (profileError) throw profileError;

      // Sign out instance terpisah agar bersih
      await secondarySupabase.auth.signOut();

      logActivity('create_user', 'user', addFullName.trim(), { email: addEmail.trim(), role: addRole });
      onShowToast?.(`Pengguna ${addFullName.trim()} berhasil ditambahkan.`, 'success');
      setShowAddModal(false);
      resetAddForm();
      onRefreshProfiles?.();
    } catch (err: any) {
      const msg = err?.message || JSON.stringify(err);
      if (msg.includes('already registered') || msg.includes('already been registered')) {
        setAddError('Email sudah terdaftar. Gunakan email lain.');
      } else {
        setAddError(`Gagal: ${msg}`);
      }
    } finally {
      setIsAdding(false);
    }
  };

  const canEdit = currentUserRole === 'Inspektur' || currentUserRole === 'Sekretaris' || currentUserRole === 'Inspektur Pembantu' || isAdmin;
  const canEditRole = currentUserRole === 'Inspektur' || currentUserRole === 'Sekretaris' || isAdmin;
  const canToggleMfa = currentUserRole === 'Inspektur' || currentUserRole === 'Sekretaris' || isAdmin;

  const filteredProfiles = useMemo(() => {
    return userProfiles
      .filter(p => {
        const matchSearch =
          (p.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.nip || '').toLowerCase().includes(searchQuery.toLowerCase());
        return matchSearch && (roleFilter === 'Semua' || p.role === roleFilter);
      })
      .sort((a, b) => {
        const roleDiff = (ROLE_ORDER[a.role] ?? 99) - (ROLE_ORDER[b.role] ?? 99);
        if (roleDiff !== 0) return roleDiff;

        const golA = GOLONGAN_ORDER[a.golongan || ''] ?? 99;
        const golB = GOLONGAN_ORDER[b.golongan || ''] ?? 99;
        if (golA !== golB) return golA - golB;

        return (a.full_name || a.email || '').localeCompare(b.full_name || b.email || '');
      });
  }, [userProfiles, searchQuery, roleFilter]);

  const FUNGSIONAL_COUNT = userProfiles.filter(p => 
    ['Auditor Pelaksana', 'Auditor Pelaksana Lanjutan', 'Auditor Penyelia',
     'Auditor Ahli Pertama', 'Auditor Ahli Muda', 'Auditor Ahli Madya', 'Auditor Ahli Utama',
     'PPUPD Ahli Pertama', 'PPUPD Ahli Muda', 'PPUPD Ahli Madya', 'PPUPD Ahli Utama',
     'Auditor'].includes(p.role)
  ).length;

  const roleCounts = useMemo(() => {
    const counts: Record<string, number> = { Semua: userProfiles.length };
    ROLE_OPTIONS.forEach(r => { counts[r] = userProfiles.filter(p => p.role === r).length; });
    return counts;
  }, [userProfiles]);

  const startEdit = (profile: UserProfile) => {
    setEditingUserId(profile.id);
    setEditRole((profile.role as RoleType) || 'Auditor Pelaksana');
    setEditNip(profile.nip || '');
    setEditGolongan(profile.golongan || '');
    setEditPangkat(profile.pangkat || '');
    setEditFullName(profile.full_name || '');
    setEditEmail(profile.email || '');
    setEditMfaRequired((profile as any).mfa_required || false);
    setEditIsAdmin((profile as any).is_admin || false);
    setEditJenisAsn((profile as any).jenis_asn || '');
    setEditBidangId(profile.bidang_id ?? '');
  };

  const cancelEdit = () => setEditingUserId(null);

  const saveEdit = async (profile: UserProfile) => {
    setIsSaving(true);
    try {
      const userId = profile.id;
      const isEditingSelf = userId === currentUserId;
      const emailChanged = editEmail.trim() !== '' && editEmail.trim() !== profile.email;

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          role: editRole,
          nip: editNip || null,
          golongan: editGolongan || null,
          pangkat: editPangkat || null,
          full_name: editFullName || null,
          mfa_required: editMfaRequired,
          is_admin: editIsAdmin,
          jenis_asn: editJenisAsn || null,
          bidang_id: editBidangId || null,
          ...(emailChanged && !isEditingSelf ? { email_pending: editEmail.trim() } : {}),
          ...(emailChanged && isEditingSelf ? { email: editEmail.trim() } : {}),
        })
        .eq('id', userId);

      if (profileError) throw profileError;

      if (emailChanged && isEditingSelf) {
        const { error: emailError } = await supabase.auth.updateUser(
          { email: editEmail.trim() },
          { emailRedirectTo: 'https://si-pesat.vercel.app' }
        );
        if (emailError) {
          onShowToast?.(`Profil disimpan, tapi gagal update email: ${emailError.message}`, 'info');
        } else {
          onShowToast?.('Email diperbarui — cek kotak masuk untuk konfirmasi.', 'info');
        }
      } else if (emailChanged && !isEditingSelf) {
        const { error: fnError } = await supabase.functions.invoke('update-user-email', {
          body: { userId, newEmail: editEmail.trim() }
        });
        if (fnError) {
          console.error('Edge function error:', fnError);
          onShowToast?.(`Email tersimpan sebagai pending — ${fnError.message}`, 'info');
        } else {
          await supabase.from('profiles').update({ email: editEmail.trim(), email_pending: null }).eq('id', userId);
          onShowToast?.('Email berhasil diperbarui.', 'success');
        }
      } else {
        onShowToast?.('Profil pengguna berhasil diperbarui.', 'success');
      }

      logActivity('update_user', 'user', profile.full_name || profile.email, { role: editRole, nip: editNip, golongan: editGolongan });
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
    try { onRefreshProfiles?.(); onShowToast?.('Data pengguna diperbarui.', 'info'); }
    finally { setTimeout(() => setIsRefreshing(false), 800); }
  };

  return (
    <div className="space-y-6 animate-fade-in" id="user-management-view">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-dark-gray flex items-center gap-2">
            <Users className="w-5 h-5 text-dark-gray/70" /> Manajemen Pengguna
          </h2>
          <p className="text-xs text-dark-gray/60 mt-1">Kelola peran, data kepegawaian, dan hak akses pengguna sistem SI-PESAT.</p>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && (
            <button onClick={() => { resetAddForm(); setSearchQuery(''); setShowAddModal(true); }}
              className="inline-flex items-center gap-2 text-xs font-black px-4 py-2 rounded-xl bg-dark-gray text-white hover:bg-dark-gray/85 transition-all shadow-sm cursor-pointer">
              <UserPlus className="w-3.5 h-3.5" /> Tambah Pengguna
            </button>
          )}
          <button onClick={handleRefresh} className="inline-flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl bg-white border border-dark-gray/15 text-dark-gray hover:bg-baby-blue transition-all shadow-sm cursor-pointer">
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} /> Perbarui
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total Pengguna', value: userProfiles.length, icon: <Users className="w-5 h-5 text-slate-600" />, bg: 'bg-slate-100' },
          { label: 'Auditor Fungsional', value: FUNGSIONAL_COUNT, icon: <UserIcon className="w-5 h-5 text-blue-600" />, bg: 'bg-blue-100' },
          { label: 'Inspektur Pembantu', value: roleCounts['Inspektur Pembantu'] || 0, icon: <Star className="w-5 h-5 text-amber-600" />, bg: 'bg-amber-100' },
          { label: 'Inspektur', value: roleCounts['Inspektur'] || 0, icon: <Crown className="w-5 h-5 text-purple-600" />, bg: 'bg-purple-100' },
          { label: 'Sekretaris', value: roleCounts['Sekretaris'] || 0, icon: <ShieldCheck className="w-5 h-5 text-indigo-600" />, bg: 'bg-indigo-100' },
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
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-gray/40 pointer-events-none" />
          <input type="text" placeholder="Cari nama, email, atau NIP..." value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            autoComplete="off"
            name="search_users"
            className="w-full pl-9 pr-4 py-2 border border-dark-gray/15 rounded-lg text-sm bg-white/70 focus:bg-white outline-none text-dark-gray font-medium placeholder-dark-gray/50" />
        </div>
        <div className="flex flex-wrap gap-2">
          {['Semua', ...ROLE_OPTIONS].map(role => {
            const count = roleCounts[role] ?? 0;
            const cfg = ROLE_CONFIG[role];
            return (
              <button key={role} onClick={() => setRoleFilter(role)}
                className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full border transition-all cursor-pointer ${roleFilter === role ? 'bg-dark-gray text-white border-dark-gray shadow-sm' : 'bg-white text-dark-gray/60 border-dark-gray/15 hover:border-dark-gray/30 hover:text-dark-gray'}`}>
                {cfg?.icon}{role}
                <span className={`ml-0.5 font-mono text-[10px] ${roleFilter === role ? 'text-white/70' : 'text-dark-gray/40'}`}>({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {!canEdit && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-bold text-amber-800">Hak Akses Terbatas</p>
            <p className="text-[11px] text-amber-700 mt-0.5">Anda hanya dapat melihat daftar pengguna. Hanya Inspektur, Sekretaris, dan Inspektur Pembantu yang dapat mengubah data kepegawaian.</p>
          </div>
        </div>
      )}

      {/* User List */}
      <div className="bg-white rounded-2xl border border-dark-gray/10 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-extrabold text-dark-gray text-sm">
            Daftar Pengguna ({filteredProfiles.length})
            <span className="ml-2 text-[10px] font-medium text-slate-400">diurutkan berdasarkan role dan golongan</span>
          </h3>
          {canEdit && (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <ShieldCheck className="w-3 h-3" /> Mode Edit Aktif
            </span>
          )}
        </div>

        {filteredProfiles.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            <p className="text-sm font-bold text-slate-400">Tidak ada pengguna ditemukan</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {filteredProfiles.map(profile => {
              const isEditing = editingUserId === profile.id;
              const isCurrentUser = profile.id === currentUserId;
              const roleConf = ROLE_CONFIG[profile.role] || ROLE_CONFIG['Auditor Pelaksana'];
              const hasMfa = (profile as any).mfa_required === true;
              return (
                <div key={profile.id} className={`px-6 py-4 transition-all ${isEditing ? 'bg-blue-50/40' : 'hover:bg-slate-50/50'}`}>
                  {isEditing ? (
                    /* ── Edit Form ── */
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-blue-700 flex items-center gap-1.5">
                          <Edit2 className="w-3.5 h-3.5" /> Ubah Profil: {profile.email}
                        </span>
                        <button onClick={cancelEdit} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-4 h-4" /></button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* Nama */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nama Lengkap</label>
                          <input type="text" value={editFullName} onChange={e => setEditFullName(e.target.value)}
                            className="w-full text-xs font-bold border border-slate-200 p-2 rounded-lg bg-white text-slate-700 outline-none focus:ring-1 focus:ring-blue-400" />
                        </div>

                        {/* Email */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                            <Mail className="w-3 h-3" /> Email
                            {isCurrentUser
                              ? <span className="text-[9px] text-emerald-600 font-semibold ml-1">(perlu konfirmasi via email)</span>
                              : <span className="text-[9px] text-amber-600 font-semibold ml-1">(tersimpan sebagai pending)</span>
                            }
                          </label>
                          <input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)}
                            placeholder={profile.email}
                            className="w-full text-xs font-bold border border-slate-200 p-2 rounded-lg bg-white text-slate-700 outline-none focus:ring-1 focus:ring-blue-400" />
                        </div>

                        {/* Peran */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Peran / Role</label>
                          <select value={editRole} onChange={e => setEditRole(e.target.value as RoleType)} disabled={!canEditRole}
                            className="w-full text-xs font-bold border border-slate-200 p-2 rounded-lg bg-white text-slate-700 outline-none focus:ring-1 focus:ring-blue-400 disabled:opacity-60">
                            {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                          {!canEditRole && <p className="text-[9px] text-amber-600 font-semibold">Hanya Inspektur yang dapat mengubah peran.</p>}
                        </div>

                        {/* NIP */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">NIP</label>
                          <input type="text" value={editNip} onChange={e => setEditNip(e.target.value)}
                            placeholder="Contoh: 198001012005011001"
                            className="w-full text-xs font-bold border border-slate-200 p-2 rounded-lg bg-white text-slate-700 outline-none focus:ring-1 focus:ring-blue-400 font-mono" />
                        </div>

                        {/* Jenis ASN */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Jenis ASN</label>
                          <select value={editJenisAsn} onChange={e => { setEditJenisAsn(e.target.value as 'PNS' | 'PPPK' | ''); if (!e.target.value) setEditGolongan(''); }}
                            className="w-full text-xs font-bold border border-slate-200 p-2 rounded-lg bg-white text-slate-700 outline-none focus:ring-1 focus:ring-blue-400">
                            <option value="">— Pilih Jenis ASN —</option>
                            <option value="PNS">PNS</option>
                            <option value="PPPK">PPPK / P3K</option>
                          </select>
                        </div>

                        {/* Golongan */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Golongan</label>
                          <select value={editGolongan} onChange={e => setEditGolongan(e.target.value)}
                            className="w-full text-xs font-bold border border-slate-200 p-2 rounded-lg bg-white text-slate-700 outline-none focus:ring-1 focus:ring-blue-400">
                            <option value="">— Pilih Golongan —</option>
                            {(editJenisAsn === 'PPPK' ? PPPK_GOLONGAN : PNS_GOLONGAN).map(g => (
                              <option key={g} value={g}>{g}</option>
                            ))}
                          </select>
                        </div>

                        {/* Pangkat */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pangkat</label>
                          <input type="text" value={editPangkat} onChange={e => setEditPangkat(e.target.value)}
                            placeholder="Contoh: Penata Muda, Pembina..."
                            className="w-full text-xs font-bold border border-slate-200 p-2 rounded-lg bg-white text-slate-700 outline-none focus:ring-1 focus:ring-blue-400" />
                        </div>

                        {/* Bidang */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Bidang</label>
                          <select value={editBidangId} onChange={e => setEditBidangId(e.target.value ? Number(e.target.value) : '')}
                            className="w-full text-xs font-bold border border-slate-200 p-2 rounded-lg bg-white text-slate-700 outline-none focus:ring-1 focus:ring-blue-400">
                            <option value="">— Pilih Bidang —</option>
                            {bidangList.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                          </select>
                        </div>

                        {/* Toggle MFA */}
                        <div className="md:col-span-2">
                          <div className={`flex items-center justify-between p-3 rounded-xl border transition-all ${editMfaRequired ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${editMfaRequired ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                                {editMfaRequired ? <Smartphone className="w-4 h-4 text-emerald-600" /> : <KeyRound className="w-4 h-4 text-slate-500" />}
                              </div>
                              <div>
                                <p className="text-xs font-bold text-slate-700">Autentikator Dua Langkah (MFA)</p>
                                <p className="text-[10px] text-slate-500 mt-0.5">
                                  {editMfaRequired ? 'Aktif — pengguna wajib verifikasi OTP saat login' : 'Nonaktif — login hanya dengan email & password'}
                                </p>
                              </div>
                            </div>
                            {canToggleMfa ? (
                              <button type="button" onClick={() => setEditMfaRequired(v => !v)}
                                className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer border-2 ${editMfaRequired ? 'bg-emerald-500 border-emerald-600' : 'bg-slate-300 border-slate-400'}`}>
                                <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${editMfaRequired ? 'translate-x-5' : 'translate-x-0'}`} />
                              </button>
                            ) : (
                              <span className="text-[9px] text-slate-400 font-bold italic">Hanya Inspektur</span>
                            )}
                          </div>
                        </div>

                        {/* Toggle is_admin */}
                        {canEditRole && (
                          <div className="md:col-span-2">
                            <div className={`flex items-center justify-between p-3 rounded-xl border transition-all ${editIsAdmin ? 'bg-purple-50 border-purple-200' : 'bg-slate-50 border-slate-200'}`}>
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${editIsAdmin ? 'bg-purple-100' : 'bg-slate-100'}`}>
                                  <ShieldCheck className={`w-4 h-4 ${editIsAdmin ? 'text-purple-600' : 'text-slate-500'}`} />
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-slate-700">Administrator Sistem</p>
                                  <p className="text-[10px] text-slate-500 mt-0.5">
                                    {editIsAdmin ? 'Aktif — dapat mengedit data pegawai, menghapus & membuat KKA' : 'Nonaktif — akses terbatas sesuai peran'}
                                  </p>
                                </div>
                              </div>
                              <button type="button" onClick={() => setEditIsAdmin(v => !v)}
                                className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer border-2 ${editIsAdmin ? 'bg-purple-500 border-purple-600' : 'bg-slate-300 border-slate-400'}`}>
                                <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${editIsAdmin ? 'translate-x-5' : 'translate-x-0'}`} />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 pt-2 border-t border-blue-100">
                        <button onClick={cancelEdit} className="flex-1 text-xs py-2 rounded-lg font-bold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition cursor-pointer">Batal</button>
                        <button onClick={() => saveEdit(profile)} disabled={isSaving}
                          className="flex-1 text-xs py-2 rounded-lg font-bold bg-blue-600 text-white hover:bg-blue-700 transition cursor-pointer disabled:opacity-60 flex items-center justify-center gap-1.5 shadow-sm">
                          {isSaving ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Menyimpan...</> : <><Save className="w-3.5 h-3.5" /> Simpan Perubahan</>}
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* ── Read-only Row ── */
                    <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-peach-accent to-amber-300 flex items-center justify-center shrink-0 text-dark-gray font-black text-sm shadow-sm">
                        {(profile.full_name || profile.email || '?')[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-slate-800 truncate">{profile.full_name || '(Nama belum diisi)'}</span>
                          {isCurrentUser && (
                            <span className="text-[9px] font-black text-emerald-700 bg-emerald-100 border border-emerald-200 px-1.5 py-0.5 rounded-full uppercase tracking-wider">Anda</span>
                          )}
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${roleConf.bg} ${roleConf.text} ${roleConf.border}`}>
                            {roleConf.icon} {roleConf.label}
                          </span>
                          {hasMfa ? (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <Smartphone className="w-2.5 h-2.5" /> MFA Aktif
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                              <KeyRound className="w-2.5 h-2.5" /> No MFA
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-500"><Mail className="w-3 h-3" /> {profile.email}</span>
                          {profile.nip && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 font-mono"><Hash className="w-3 h-3" /> {profile.nip}</span>
                          )}
                        </div>
                        {(profile.pangkat || profile.golongan) && (
                          <div className="mt-1">
                            <span className="text-[10px] text-slate-400 font-medium">{[profile.pangkat, profile.golongan].filter(Boolean).join(' · Gol. ')}</span>
                          </div>
                        )}
                        {profile.jenis_asn && (
                          <div className="mt-1">
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              profile.jenis_asn === 'PPPK' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-blue-50 text-blue-700 border-blue-200'
                            }`}>{profile.jenis_asn}</span>
                          </div>
                        )}
                        {profile.bidang_id && (() => {
                          const bidang = bidangList.find(b => b.id === profile.bidang_id);
                          return bidang ? (
                            <div className="mt-1">
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">{bidang.name}</span>
                            </div>
                          ) : null;
                        })()}
                      </div>
                      {canEdit && (
                        <button onClick={() => startEdit(profile)}
                          className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg border border-dark-gray/15 bg-white text-dark-gray hover:bg-baby-blue transition-all cursor-pointer shadow-xs shrink-0">
                          <Edit2 className="w-3.5 h-3.5" /><span className="hidden md:inline">Edit</span>
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

      {/* ── Modal Tambah Pengguna ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={e => { if (e.target === e.currentTarget) setShowAddModal(false); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-dark-gray/10 overflow-hidden animate-fade-in">
            {/* Honeypot fields — cegah autofill browser */}
            <input type="text" name="username" style={{display:'none'}} autoComplete="username" readOnly />
            <input type="password" name="password" style={{display:'none'}} autoComplete="current-password" readOnly />
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-baby-blue">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-dark-gray rounded-xl flex items-center justify-center">
                  <UserPlus className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-extrabold text-dark-gray text-sm">Tambah Pengguna Baru</h3>
                  <p className="text-[10px] text-dark-gray/60 font-semibold">Daftarkan akun pengguna SI-PESAT</p>
                </div>
              </div>
              <button onClick={() => { setShowAddModal(false); resetAddForm(); }} className="p-1.5 hover:bg-white/50 rounded-lg transition">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {addError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                  <p className="text-xs font-semibold text-red-700">{addError}</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Nama Lengkap */}
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nama Lengkap <span className="text-red-400">*</span></label>
                  <input type="text" value={addFullName} onChange={e => setAddFullName(e.target.value)}
                    autoComplete="off" name="add_fullname"
                    placeholder="Contoh: Budi Santoso, S.Ak."
                    className="w-full text-xs font-bold border border-slate-200 p-2.5 rounded-xl bg-slate-50 text-slate-700 outline-none focus:ring-2 focus:ring-peach-accent/30 focus:border-peach-accent focus:bg-white transition-all placeholder:font-normal placeholder:text-slate-300" />
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1"><Mail className="w-3 h-3" /> Email <span className="text-red-400">*</span></label>
                  <input type="email" value={addEmail} onChange={e => setAddEmail(e.target.value)}
                    autoComplete="off" name="add_email"
                    placeholder="pegawai@example.com"
                    className="w-full text-xs font-bold border border-slate-200 p-2.5 rounded-xl bg-slate-50 text-slate-700 outline-none focus:ring-2 focus:ring-peach-accent/30 focus:border-peach-accent focus:bg-white transition-all placeholder:font-normal placeholder:text-slate-300" />
                </div>

                {/* Password */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1"><Lock className="w-3 h-3" /> Password Awal <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} value={addPassword} onChange={e => setAddPassword(e.target.value)}
                      autoComplete="new-password" name="add_password"
                      placeholder="Min. 8 karakter"
                      className="w-full text-xs font-bold border border-slate-200 p-2.5 pr-9 rounded-xl bg-slate-50 text-slate-700 outline-none focus:ring-2 focus:ring-peach-accent/30 focus:border-peach-accent focus:bg-white transition-all placeholder:font-normal placeholder:text-slate-300" />
                    <button type="button" onClick={() => setShowPassword(v => !v)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-[9px] text-slate-400 font-semibold">Pengguna dapat mengubah password setelah login pertama.</p>
                </div>

                {/* Role */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Peran / Role</label>
                  <select value={addRole} onChange={e => setAddRole(e.target.value as RoleType)}
                    className="w-full text-xs font-bold border border-slate-200 p-2.5 rounded-xl bg-slate-50 text-slate-700 outline-none focus:ring-2 focus:ring-peach-accent/30 focus:border-peach-accent focus:bg-white transition-all">
                    {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>

                {/* NIP */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1"><Hash className="w-3 h-3" /> NIP</label>
                  <input type="text" value={addNip} onChange={e => setAddNip(e.target.value)}
                    placeholder="198001012005011001"
                    className="w-full text-xs font-bold font-mono border border-slate-200 p-2.5 rounded-xl bg-slate-50 text-slate-700 outline-none focus:ring-2 focus:ring-peach-accent/30 focus:border-peach-accent focus:bg-white transition-all placeholder:font-normal placeholder:text-slate-300" />
                </div>

                {/* Jenis ASN */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Jenis ASN</label>
                  <select value={addJenisAsn} onChange={e => { setAddJenisAsn(e.target.value as 'PNS' | 'PPPK' | ''); if (!e.target.value) setAddGolongan(''); }}
                    className="w-full text-xs font-bold border border-slate-200 p-2.5 rounded-xl bg-slate-50 text-slate-700 outline-none focus:ring-2 focus:ring-peach-accent/30 focus:border-peach-accent focus:bg-white transition-all">
                    <option value="">— Pilih Jenis ASN —</option>
                    <option value="PNS">PNS</option>
                    <option value="PPPK">PPPK / P3K</option>
                  </select>
                </div>

                {/* Golongan */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Golongan</label>
                  <select value={addGolongan} onChange={e => setAddGolongan(e.target.value)}
                    className="w-full text-xs font-bold border border-slate-200 p-2.5 rounded-xl bg-slate-50 text-slate-700 outline-none focus:ring-2 focus:ring-peach-accent/30 focus:border-peach-accent focus:bg-white transition-all">
                    <option value="">— Pilih Golongan —</option>
                    {(addJenisAsn === 'PPPK' ? PPPK_GOLONGAN : PNS_GOLONGAN).map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                {/* Pangkat */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pangkat</label>
                  <input type="text" value={addPangkat} onChange={e => setAddPangkat(e.target.value)}
                    placeholder="Contoh: Penata Muda, Pembina..."
                    className="w-full text-xs font-bold border border-slate-200 p-2.5 rounded-xl bg-slate-50 text-slate-700 outline-none focus:ring-2 focus:ring-peach-accent/30 focus:border-peach-accent focus:bg-white transition-all placeholder:font-normal placeholder:text-slate-300" />
                </div>

                {/* Bidang */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Bidang</label>
                  <select value={addBidangId} onChange={e => setAddBidangId(e.target.value ? Number(e.target.value) : '')}
                    className="w-full text-xs font-bold border border-slate-200 p-2.5 rounded-xl bg-slate-50 text-slate-700 outline-none focus:ring-2 focus:ring-peach-accent/30 focus:border-peach-accent focus:bg-white transition-all">
                    <option value="">— Pilih Bidang —</option>
                    {bidangList.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>

                {/* Admin Toggle */}
                {canEditRole && (
                  <div className="sm:col-span-2">
                    <button type="button" onClick={() => setAddIsAdmin(v => !v)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${addIsAdmin ? 'bg-purple-50 border-purple-200' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${addIsAdmin ? 'bg-purple-100' : 'bg-slate-100'}`}>
                          <ShieldCheck className={`w-4 h-4 ${addIsAdmin ? 'text-purple-600' : 'text-slate-400'}`} />
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-bold text-slate-700">Administrator Sistem</p>
                          <p className="text-[10px] text-slate-500">{addIsAdmin ? 'Aktif — dapat mengedit data pegawai & KKA' : 'Nonaktif — akses standar sesuai peran'}</p>
                        </div>
                      </div>
                      <div className={`relative w-11 h-6 rounded-full transition-colors border-2 ${addIsAdmin ? 'bg-purple-500 border-purple-600' : 'bg-slate-300 border-slate-400'}`}>
                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${addIsAdmin ? 'translate-x-5' : 'translate-x-0'}`} />
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex gap-2 bg-slate-50/50">
              <button onClick={() => { setShowAddModal(false); resetAddForm(); }}
                className="flex-1 text-xs py-2.5 rounded-xl font-bold border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 transition cursor-pointer">
                Batal
              </button>
              <button onClick={handleAddUser} disabled={isAdding}
                className="flex-1 text-xs py-2.5 rounded-xl font-black bg-dark-gray text-white hover:bg-dark-gray/85 transition cursor-pointer disabled:opacity-60 flex items-center justify-center gap-1.5 shadow-sm">
                {isAdding
                  ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Mendaftarkan...</>
                  : <><UserPlus className="w-3.5 h-3.5" /> Daftarkan Pengguna</>
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <Shield className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
        <div>
          <p className="text-xs font-bold text-blue-800">Hak Akses Peran</p>
          <ul className="text-[11px] text-blue-700 mt-1.5 space-y-1">
            <li>• <strong>Auditor & PPUPD Fungsional</strong>: Mengerjakan KKA, mengunggah bukti dokumen, dan dapat ditugaskan sebagai Ketua Tim atau Anggota Tim sesuai jenjang.</li>
            <li>• <strong>Inspektur Pembantu (Irban)</strong>: Meninjau KKA, mengatur tim, mengedit profil OPD, dan mengelola pengguna.</li>
            <li>• <strong>Inspektur</strong>: Akses penuh termasuk mengubah peran pengguna, toggle MFA, dan pengaturan master sistem.</li>
          </ul>
          <p className="text-[11px] text-blue-600 mt-2 font-semibold">
            🔐 MFA Aktif = pengguna wajib scan QR autentikator (Google/Microsoft Authenticator) saat login pertama kali setelah diaktifkan.
          </p>
        </div>
      </div>
    </div>
  );
}
