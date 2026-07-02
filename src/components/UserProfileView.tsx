/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { UserProfile, OpdAudit } from '../types';
import { CheckCircle, AlertTriangle, Clock, FileText, User, ChevronRight, Upload, TrendingUp } from 'lucide-react';
import { toDisplay } from '../lib/formatDate';

interface UserProfileViewProps {
  currentUser: UserProfile | null;
  userRole: string;
  isAdmin?: boolean;
  audits: OpdAudit[];
  onSelectAudit: (audit: OpdAudit, catId?: string) => void;
}

export default function UserProfileView({ currentUser, userRole, isAdmin = false, audits, onSelectAudit }: UserProfileViewProps) {
  const FUNGSIONAL_ROLES = ['Auditor', 'Auditor Pelaksana', 'Auditor Pelaksana Lanjutan', 'Auditor Penyelia', 'Auditor Ahli Pertama', 'Auditor Ahli Muda', 'Auditor Ahli Madya', 'Auditor Ahli Utama', 'PPUPD Ahli Pertama', 'PPUPD Ahli Muda', 'PPUPD Ahli Madya', 'PPUPD Ahli Utama'];

  const pendingReviews = audits.flatMap(a =>
    a.categories
      .filter(c => c.status === 'Direview')
      .map(c => ({ audit: a, category: c }))
  );

  const reviewedCategories = audits.flatMap(a =>
    a.categories
      .filter(c => c.status === 'Selesai')
      .map(c => ({ audit: a, category: c }))
  );

  const myAssignments = currentUser
    ? audits.filter(a =>
        a.categories.some(c =>
          c.auditorName === currentUser.full_name ||
          (c.teamMembers || []).includes(currentUser.full_name || '')
        )
      )
    : [];

  // Overdue milestones
  const overdueItems = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const result: { audit: OpdAudit; milestoneName: string; targetDate: string; daysOverdue: number }[] = [];
    audits.forEach(audit => {
      if (audit.status === 'Selesai') return;
      (audit.schedule || []).forEach(milestone => {
        if (milestone.status === 'Selesai') return;
        const target = new Date(milestone.targetDate);
        target.setHours(0, 0, 0, 0);
        const diff = Math.floor((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));
        if (diff > 0) result.push({ audit, milestoneName: milestone.name, targetDate: milestone.targetDate, daysOverdue: diff });
      });
    });
    return result.sort((a, b) => b.daysOverdue - a.daysOverdue);
  }, [audits]);

  // Upload progress per audit (untuk panel Auditor)
  const uploadProgressMap = useMemo(() => {
    const map: Record<string, { uploaded: number; total: number; pct: number }> = {};
    audits.forEach(a => {
      let total = 0, uploaded = 0;
      a.categories.forEach(c => c.items.forEach(item => {
        total++;
        if (item.evidenceFiles && item.evidenceFiles.length > 0) uploaded++;
      }));
      map[a.id] = { uploaded, total, pct: total > 0 ? Math.round((uploaded / total) * 100) : 0 };
    });
    return map;
  }, [audits]);

  const roleIcon = userRole === 'Inspektur' ? '👑' : userRole === 'Inspektur Pembantu' ? '🔍' : '🕵️';
  const roleLabel = userRole === 'Inspektur' ? 'Inspektur' : userRole === 'Inspektur Pembantu' ? 'Inspektur Pembantu (Irban)' : userRole || 'Auditor Pelaksana';

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
      <h2 className="text-xl font-black text-dark-gray">Profil Pengguna</h2>

      {/* Profile Card */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-peach-accent/20 border-2 border-peach-accent/40 flex items-center justify-center text-3xl font-black text-peach-accent flex-shrink-0">
            {(currentUser?.full_name || 'U').charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-black text-white truncate">{currentUser?.full_name || 'Pengguna'}</h3>
            <p className="text-xs text-white/50 font-semibold mt-0.5 truncate">{currentUser?.email || '—'}</p>
            <div className="mt-2">
              <span className="text-[10px] bg-peach-accent text-dark-gray px-2.5 py-1 rounded-lg font-black uppercase tracking-wider">
                {roleIcon} {roleLabel}
              </span>
            </div>
          </div>
        </div>

        {/* NIP / Golongan / Pangkat */}
        <div className="mt-5 pt-4 border-t border-white/10 grid grid-cols-3 gap-4">
          {[
            { label: 'NIP', value: currentUser?.nip },
            { label: 'Golongan', value: currentUser?.golongan },
            { label: 'Pangkat', value: currentUser?.pangkat },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-[9px] text-white/40 font-bold uppercase tracking-wider">{label}</p>
              <p className="text-xs font-bold text-white mt-0.5">{value || <span className="text-white/30 italic font-normal">Belum diatur</span>}</p>
            </div>
          ))}
        </div>
      </div>

      {/* === PANEL UNTUK INSPEKTUR / IRBAN === */}
      {(userRole === 'Inspektur Pembantu' || userRole === 'Inspektur') && (
        <>
          {/* Pending Reviews */}
          <div className="bg-white rounded-2xl p-6 border border-dark-gray/10 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Clock className="w-4.5 h-4.5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-dark-gray text-sm">Menunggu Review Anda</h3>
                <p className="text-[10px] text-dark-gray/50 font-semibold">
                  {pendingReviews.length > 0
                    ? `${pendingReviews.length} jenis audit diajukan oleh tim`
                    : 'Tidak ada pengajuan saat ini'}
                </p>
              </div>
            </div>

            {pendingReviews.length === 0 ? (
              <div className="text-center py-8 text-slate-300 text-xs font-bold italic border-2 border-dashed border-slate-100 rounded-xl">
                Semua KKA sudah tertangani ✓
              </div>
            ) : (
              <div className="space-y-2">
                {pendingReviews.map(({ audit, category }) => (
                  <button
                    key={`${audit.id}-${category.id}`}
                    onClick={() => onSelectAudit(audit, category.id)}
                    className="w-full flex items-center justify-between p-3.5 bg-amber-50 border border-amber-100 rounded-xl hover:bg-amber-100/70 transition text-left group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-slate-800 truncate">{audit.opdName}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          {category.name} • TA {audit.fiscalYear} • Ketua: {category.auditorName || '—'}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-amber-400 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Already Approved */}
          {reviewedCategories.length > 0 && (
            <div className="bg-white rounded-2xl p-6 border border-dark-gray/10 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-4.5 h-4.5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-bold text-dark-gray text-sm">Sudah Disetujui</h3>
                  <p className="text-[10px] text-dark-gray/50 font-semibold">{reviewedCategories.length} jenis audit selesai</p>
                </div>
              </div>
              <div className="space-y-1.5 max-h-[280px] overflow-y-auto pr-1">
                {reviewedCategories.map(({ audit, category }) => (
                  <button
                    key={`${audit.id}-${category.id}`}
                    onClick={() => onSelectAudit(audit, category.id)}
                    className="w-full flex items-center justify-between p-2.5 bg-emerald-50/60 border border-emerald-100 rounded-lg hover:bg-emerald-50 transition text-left text-xs"
                  >
                    <div className="min-w-0">
                      <span className="font-bold text-slate-700 truncate block">{audit.opdName}</span>
                      <span className="text-slate-400 text-[10px]">{category.name} • TA {audit.fiscalYear}</span>
                    </div>
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Overview stats for inspector */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total KKA', value: audits.length, color: 'bg-blue-50 border-blue-100', textColor: 'text-blue-700' },
              { label: 'Perlu Direview', value: pendingReviews.length, color: 'bg-amber-50 border-amber-100', textColor: 'text-amber-700' },
              { label: 'Sudah Selesai', value: reviewedCategories.length, color: 'bg-emerald-50 border-emerald-100', textColor: 'text-emerald-700' },
            ].map(s => (
              <div key={s.label} className={`rounded-2xl p-4 border ${s.color}`}>
                <p className={`text-2xl font-black ${s.textColor}`}>{s.value}</p>
                <p className={`text-[10px] font-bold uppercase tracking-wider mt-1 ${s.textColor} opacity-70`}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Overdue Milestones Panel */}
          {overdueItems.length > 0 && (
            <div className="bg-white rounded-2xl p-6 border border-rose-200 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 bg-rose-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 text-rose-600" />
                </div>
                <div>
                  <h3 className="font-bold text-dark-gray text-sm">Tenggat Waktu Terlewat</h3>
                  <p className="text-[10px] text-rose-600 font-semibold">
                    {overdueItems.length} milestone melewati target — perlu tindak lanjut segera
                  </p>
                </div>
              </div>
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {overdueItems.map(({ audit, milestoneName, targetDate, daysOverdue }, idx) => (
                  <button
                    key={`${audit.id}-${milestoneName}-${idx}`}
                    onClick={() => onSelectAudit(audit)}
                    className="w-full flex items-center justify-between p-3 bg-rose-50 border border-rose-100 rounded-xl hover:bg-rose-100/70 transition text-left group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-slate-800 truncate">{audit.opdName}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          {milestoneName.split(' (')[0]} • Target: {toDisplay(targetDate)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      <span className="text-[9px] font-black text-white bg-rose-500 px-2 py-0.5 rounded-full">
                        +{daysOverdue} hari
                      </span>
                      <ChevronRight className="w-4 h-4 text-rose-400 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* === PANEL UNTUK AUDITOR === */}
      {FUNGSIONAL_ROLES.includes(userRole) && (
        <div className="bg-white rounded-2xl p-6 border border-dark-gray/10 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <FileText className="w-4.5 h-4.5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-dark-gray text-sm">Penugasan Saya</h3>
              <p className="text-[10px] text-dark-gray/50 font-semibold">
                {myAssignments.length > 0 ? `${myAssignments.length} audit` : 'Belum ada penugasan'}
              </p>
            </div>
          </div>

          {myAssignments.length === 0 ? (
            <div className="text-center py-8 text-slate-300 text-xs font-bold italic border-2 border-dashed border-slate-100 rounded-xl">
              Belum ada penugasan audit yang diterima.<br />Hubungi Inspektur Pembantu untuk mendapatkan penugasan.
            </div>
          ) : (
            <div className="space-y-2">
              {myAssignments.map(a => {
                const myCategories = a.categories.filter(c =>
                  c.auditorName === currentUser?.full_name ||
                  (c.teamMembers || []).includes(currentUser?.full_name || '')
                );
                const prog = uploadProgressMap[a.id] || { uploaded: 0, total: 0, pct: 0 };
                return (
                  <button
                    key={a.id}
                    onClick={() => onSelectAudit(a)}
                    className="w-full flex flex-col p-3.5 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100/70 transition text-left group"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-slate-800 truncate">{a.opdName}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          TA {a.fiscalYear} • {a.auditType} • {myCategories.length} jenis audit
                        </p>
                      </div>
                      <span className={`text-[9px] ml-1 px-2 py-0.5 rounded-full font-black uppercase border flex-shrink-0 ${
                        a.status === 'Selesai' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        a.status === 'Direview' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>{a.status}</span>
                    </div>
                    {/* Upload progress bar */}
                    {prog.total > 0 && (
                      <div className="w-full">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[9px] font-semibold text-slate-400 flex items-center gap-1">
                            <Upload className="w-2.5 h-2.5" />
                            Dokumen terupload
                          </span>
                          <span className="text-[9px] font-black text-slate-600 font-mono">{prog.uploaded}/{prog.total}</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full transition-all duration-500 ${
                              prog.pct === 100 ? 'bg-emerald-500' :
                              prog.pct >= 50 ? 'bg-blue-500' :
                              prog.pct > 0 ? 'bg-amber-500' : 'bg-slate-300'
                            }`}
                            style={{ width: `${prog.pct}%` }}
                          />
                        </div>
                        <p className="text-right text-[9px] font-black text-slate-500 mt-0.5">{prog.pct}%</p>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Informasi tambahan */}
      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-xs text-slate-500 font-semibold">
        <div className="flex items-start gap-2">
          <User className="w-4 h-4 flex-shrink-0 mt-0.5 text-slate-400" />
          <div>
            <p className="font-bold text-slate-600 mb-0.5">Informasi Akun</p>
            <p>Data profil diambil dari tabel <code className="bg-white px-1 py-0.5 rounded border border-slate-200 text-slate-700">profiles</code> Supabase.
              Untuk memperbarui NIP, golongan, dan pangkat, silakan hubungi administrator sistem.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
