/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { KKATemplate, OpdAudit, UserProfile, TargetEntity, AuditMilestone } from '../types';
import { toDisplay, fromDisplay } from '../lib/formatDate';
import { getWorkingDays } from '../lib/workingDays';

const byNipAge = (a: UserProfile, b: UserProfile) => {
  if (a.nip && b.nip) return a.nip.localeCompare(b.nip);
  if (a.nip) return -1;
  if (b.nip) return 1;
  return (a.full_name || '').localeCompare(b.full_name || '');
};
import {
  ArrowLeft, Plus, Trash2, ChevronDown, FileCheck, Building,
  Calendar, User, Users, ClipboardList, Sparkles, X, Check, Clock
} from 'lucide-react';

interface CategoryDraft {
  id: string;
  templateId: string;
  categoryId: string;
  auditorName: string;
  teamMembers: string[];
}

interface NewAuditViewProps {
  audits: OpdAudit[];
  templates: KKATemplate[];
  userProfiles: UserProfile[];
  targetEntities?: TargetEntity[];
  defaultAuditorName?: string;
  isAdmin?: boolean;
  onBack: () => void;
  onCreateAudit: (
    opdName: string,
    opdType: OpdAudit['opdType'],
    _legacy: string,
    fiscalYear: string,
    auditorName: string,
    teamMembers: string[],
    templateId: string,
    initialCategoryId?: string,
    schedule?: AuditMilestone[]
  ) => void;
}

const OPD_TYPES: OpdAudit['opdType'][] = ['SD', 'SMP', 'Dinas', 'Badan', 'Kecamatan', 'Desa', 'Kelurahan', 'Puskesmas', 'Sekretariat Daerah', 'Lainnya'];
const FISCAL_YEARS = ['2026', '2025', '2024', '2023'];

const STRUKTURAL_ROLES = ['Inspektur', 'Sekretaris', 'Inspektur Pembantu'];

const KETUA_TIM_ROLES = [
  'Auditor Ahli Muda', 'Auditor Ahli Madya', 'Auditor Ahli Utama',
  'PPUPD Ahli Muda', 'PPUPD Ahli Madya', 'PPUPD Ahli Utama',
];

const ANGGOTA_TIM_ROLES = [
  'Auditor Ahli Pertama',
  'PPUPD Ahli Pertama',
];

export default function NewAuditView({
  audits,
  templates,
  userProfiles,
  targetEntities = [],
  defaultAuditorName = '',
  isAdmin = false,
  onBack,
  onCreateAudit,
}: NewAuditViewProps) {
  const [opdName, setOpdName] = useState('');
  const [opdType, setOpdType] = useState<OpdAudit['opdType']>('Dinas');
  const [fiscalYear, setFiscalYear] = useState('2026');
  const [categories, setCategories] = useState<CategoryDraft[]>([]);
  const [isAddingCat, setIsAddingCat] = useState(false);
  const [isOpdDropdownOpen, setIsOpdDropdownOpen] = useState(false);

  // Jadwal milestone — user bisa atur tanggal mulai & selesai tiap tahap
  const getFutureDate = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  const [schedule, setSchedule] = useState<AuditMilestone[]>([
    { id: 'milestone_2', name: 'Pelaksanaan Audit', startDate: getFutureDate(0), targetDate: getFutureDate(0), status: 'Belum Mulai', notes: 'Evaluasi dokumen pertanggungjawaban fisik' },
  ]);

  const updateMilestone = (id: string, field: keyof AuditMilestone, value: string) => {
    setSchedule(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const getDayCount = (startDate: string | undefined, endDate: string) => {
    if (!startDate) return null;
    return getWorkingDays(startDate, endDate);
  };

  // For the add-category panel
  const [selCategoryId, setSelCategoryId] = useState('');
  const [catAuditorName, setCatAuditorName] = useState('');
  const [catTeamMembers, setCatTeamMembers] = useState<string[]>([]);
  const [catAuditorSearch, setCatAuditorSearch] = useState('');
  const [catTeamSearch, setCatTeamSearch] = useState('');
  const [isAuditorDropdownOpen, setIsAuditorDropdownOpen] = useState(false);
  const [isTeamDropdownOpen, setIsTeamDropdownOpen] = useState(false);

  const existingAudit = audits.find(a => a.opdName.toLowerCase() === opdName.trim().toLowerCase() && a.fiscalYear === fiscalYear);
  const existingCategoryIds = existingAudit ? existingAudit.categories.map(c => (c.templateId || '') + '|' + c.id) : [];

  const addedCategoryIds = [...categories.map(c => c.templateId + '|' + c.categoryId), ...existingCategoryIds];

  const allFlatCategories = useMemo(() => {
    return templates.flatMap(t =>
      t.categories.map(c => ({ ...c, _templateId: t.id }))
    );
  }, [templates]);

  const availableCategories = allFlatCategories.filter(
    c => !addedCategoryIds.includes(c._templateId + '|' + c.id)
  );

  const handleAddCategory = () => {
    if (!selCategoryId) return;
    const found = allFlatCategories.find(c => c.id === selCategoryId);
    if (!found) return;
    setCategories(prev => [
      ...prev,
      {
        id: `draft_${Date.now()}`,
        templateId: found._templateId,
        categoryId: selCategoryId,
        auditorName: catAuditorName,
        teamMembers: catTeamMembers,
      }
    ]);
    setSelCategoryId('');
    setCatAuditorName(defaultAuditorName);
    setCatTeamMembers([]);
    setIsAddingCat(false);
  };

  const removeCat = (id: string) => setCategories(prev => prev.filter(c => c.id !== id));

  const getCategoryName = (draft: CategoryDraft) => {
    const tmpl = templates.find(t => t.id === draft.templateId);
    return tmpl?.categories.find(c => c.id === draft.categoryId)?.name || '—';
  };

  const handleSubmit = () => {
    if (!opdName.trim()) return;
    if (categories.length === 0) {
      alert('Tambahkan minimal 1 jenis audit terlebih dahulu.');
      return;
    }
    // Create one audit per category (App architecture supports 1 category per creation)
    // We create the audit with the first category, then the rest are added via workspace
    // But since handleCreateAudit creates one audit file total, we create just one with first cat
    // and instruct user to add more in workspace.
    // Better: create audit with no initial category and then the user adds via workspace
    const firstCat = categories[0];
    onCreateAudit(
      opdName.trim(),
      opdType,
      '',
      fiscalYear,
      firstCat.auditorName,
      firstCat.teamMembers,
      firstCat.templateId,
      firstCat.categoryId,
      schedule
    );
  };

  const isValid = opdName.trim().length > 0 && categories.length > 0;

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-xl bg-white border border-dark-gray/15 flex items-center justify-center hover:bg-peach-accent/20 transition cursor-pointer shadow-xs"
        >
          <ArrowLeft className="w-4 h-4 text-dark-gray" />
        </button>
        <div>
          <h1 className="text-xl font-black text-dark-gray flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-peach-accent" />
            Mulai Audit Baru
          </h1>
          <p className="text-xs text-dark-gray/60 mt-0.5">Isi informasi dasar OPD dan tambahkan jenis audit yang akan dilakukan</p>
        </div>
      </div>

      {/* Section 1: OPD Info */}
      <div className="bg-white rounded-2xl border border-dark-gray/10 shadow-sm p-6 space-y-4">
        <h2 className="text-sm font-black text-dark-gray flex items-center gap-2">
          <Building className="w-4 h-4 text-peach-accent" />
          Informasi Auditi
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* OPD Name */}
          <div className="md:col-span-2 space-y-1 relative">
            <label className="text-[10px] font-bold text-dark-gray/70 uppercase tracking-wide block">
              Nama Instansi <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={opdName}
                onChange={e => {
                  setOpdName(e.target.value);
                  setIsOpdDropdownOpen(true);
                }}
                onFocus={() => setIsOpdDropdownOpen(true)}
                onBlur={() => setTimeout(() => setIsOpdDropdownOpen(false), 200)}
                placeholder="Contoh: Dinas Pendidikan Kabupaten Sumba Barat"
                className="w-full text-sm font-bold border border-dark-gray/15 px-3 py-2.5 rounded-xl bg-white text-dark-gray outline-none focus:border-peach-accent focus:ring-2 focus:ring-peach-accent/20"
              />
              {isOpdDropdownOpen && targetEntities && targetEntities.length > 0 && (() => {
                const filtered = targetEntities.filter(t => t.name.toLowerCase().includes(opdName.toLowerCase()));
                return filtered.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-dark-gray/15 rounded-xl shadow-xl overflow-hidden max-h-48 flex flex-col">
                    <div className="overflow-y-auto p-1 space-y-0.5">
                      {filtered.map(t => (
                        <button
                          key={t.id}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setOpdName(t.name);
                            setIsOpdDropdownOpen(false);
                            const mappedType = OPD_TYPES.find(ot => ot.toLowerCase() === t.type.toLowerCase());
                            if (mappedType) setOpdType(mappedType);
                            else if (t.type === 'Sekolah' && t.name.toUpperCase().includes('SD')) setOpdType('SD');
                            else if (t.type === 'Sekolah' && t.name.toUpperCase().includes('SMP')) setOpdType('SMP');
                          }}
                          className="w-full text-left px-3 py-2 rounded text-xs font-bold hover:bg-slate-50 text-dark-gray transition-colors cursor-pointer"
                        >
                          {t.name}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* OPD Type */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-dark-gray/70 uppercase tracking-wide block">
              <Building className="w-3 h-3 inline mr-1" />Tipe Instansi
            </label>
            <select
              value={opdType}
              onChange={e => setOpdType(e.target.value as OpdAudit['opdType'])}
              className="w-full text-sm font-bold border border-dark-gray/15 px-3 py-2.5 rounded-xl bg-white text-dark-gray outline-none focus:border-peach-accent"
            >
              {OPD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Fiscal Year */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-dark-gray/70 uppercase tracking-wide block">
              <Calendar className="w-3 h-3 inline mr-1" />Tahun
             </label>
            <select
              value={fiscalYear}
              onChange={e => setFiscalYear(e.target.value)}
              className="w-full text-sm font-bold border border-dark-gray/15 px-3 py-2.5 rounded-xl bg-white text-dark-gray outline-none focus:border-peach-accent"
            >
              {FISCAL_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Section 2: Jenis Audit */}
      <div className="bg-white rounded-2xl border border-dark-gray/10 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-dark-gray flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-peach-accent" />
            Jenis Audit yang Dilakukan
            {categories.length > 0 && (
              <span className="text-[10px] bg-peach-accent text-dark-gray border border-dark-gray/10 px-2 py-0.5 rounded font-bold font-mono">
                {categories.length} dipilih
              </span>
            )}
          </h2>
          {!isAddingCat && (
            <button
              onClick={() => { setIsAddingCat(true); setSelCategoryId(availableCategories[0]?.id || ''); }}
              className="flex items-center gap-1.5 text-[11px] font-black bg-dark-gray text-white px-3 py-1.5 rounded-lg hover:bg-dark-gray/85 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Tambah Jenis Audit
            </button>
          )}
        </div>

        {/* Added categories list */}
        {categories.length === 0 && !isAddingCat && (
          <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-dark-gray/15">
            <FileCheck className="w-8 h-8 mx-auto text-dark-gray/25 mb-2" />
            <p className="text-xs font-bold text-dark-gray/50">Belum ada jenis audit yang ditambahkan.</p>
            <p className="text-[10px] text-dark-gray/35 mt-0.5">Klik tombol "Tambah Jenis Audit" di atas.</p>
          </div>
        )}

        {categories.length > 0 && (
          <div className="space-y-2">
            {categories.map((draft) => (
              <div key={draft.id} className="flex items-center gap-3 bg-slate-50 border border-dark-gray/10 rounded-xl px-4 py-3">
                <div className="w-8 h-8 rounded-lg bg-peach-accent/20 flex items-center justify-center shrink-0">
                  <FileCheck className="w-4 h-4 text-peach-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-dark-gray truncate">{getCategoryName(draft)}</p>
                  <p className="text-[10px] text-dark-gray/50 font-medium">
                    Ketua: {draft.auditorName || '—'}
                    {draft.teamMembers.length > 0 && ` · ${draft.teamMembers.length} anggota`}
                  </p>
                </div>
                <button onClick={() => removeCat(draft.id)} className="p-1 text-dark-gray/30 hover:text-rose-500 transition cursor-pointer rounded-lg hover:bg-rose-50">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add category panel */}
        {isAddingCat && (
          <div className="bg-baby-blue/30 border border-dark-gray/10 rounded-2xl p-4 space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <p className="text-xs font-black text-dark-gray">Tambah Jenis Audit</p>
              <button onClick={() => setIsAddingCat(false)} className="p-0.5 text-dark-gray/40 hover:text-dark-gray cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Jenis Audit selector */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-dark-gray/70 uppercase">Jenis Audit</label>
              <select
                value={selCategoryId}
                onChange={e => setSelCategoryId(e.target.value)}
                className="w-full text-xs font-bold border border-dark-gray/15 p-2 rounded-lg bg-white text-dark-gray outline-none focus:border-peach-accent"
              >
                <option value="">-- Pilih Jenis --</option>
                {availableCategories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Ketua Tim */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1 relative">
                <label className="text-[10px] font-bold text-dark-gray/70 uppercase">Ketua Tim</label>
                <div
                  onClick={() => setIsAuditorDropdownOpen(!isAuditorDropdownOpen)}
                  className="w-full text-xs font-bold border border-dark-gray/15 p-2 rounded-lg bg-white text-dark-gray cursor-pointer flex justify-between items-center"
                >
                  <span className="truncate">{catAuditorName || '-- Pilih Ketua --'}</span>
                  <ChevronDown className="w-4 h-4 text-dark-gray/50 shrink-0" />
                </div>
                {isAuditorDropdownOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-dark-gray/15 rounded-lg shadow-lg overflow-hidden max-h-44 flex flex-col">
                    <div className="p-2 border-b border-dark-gray/10 bg-slate-50">
                      <input type="text" placeholder="Cari nama..." value={catAuditorSearch}
                        onChange={e => setCatAuditorSearch(e.target.value)}
                        onClick={e => e.stopPropagation()}
                        className="w-full text-[10px] font-medium border border-dark-gray/20 px-2 py-1.5 rounded bg-white focus:outline-none focus:border-peach-accent" />
                    </div>
                    <div className="overflow-y-auto p-1 space-y-0.5">
                      {/* Opsi ketik manual */}
                      {catAuditorSearch.trim() && !userProfiles.find(p => (p.full_name || p.email).toLowerCase() === catAuditorSearch.toLowerCase()) && (
                        <button
                          onClick={() => { setCatAuditorName(catAuditorSearch.trim()); setIsAuditorDropdownOpen(false); setCatAuditorSearch(''); }}
                          className="w-full text-left px-3 py-1.5 rounded text-[10px] font-bold flex items-center gap-2 cursor-pointer transition-colors hover:bg-peach-accent/20 text-dark-gray border-b border-dark-gray/10">
                          <Plus className="w-3 h-3 shrink-0 text-peach-accent" />
                          Gunakan "{catAuditorSearch.trim()}"
                        </button>
                      )}
                      {/* Semua profil */}
                      {userProfiles
                        .filter(p => KETUA_TIM_ROLES.includes(p.role))
                        .filter(p => (p.full_name || p.email).toLowerCase().includes(catAuditorSearch.toLowerCase()))
                        .sort(byNipAge)
                        .map(p => {
                        const name = p.full_name || p.email;
                        const isSel = catAuditorName === name;
                        return (
                          <button key={p.id} onClick={() => { setCatAuditorName(name); setIsAuditorDropdownOpen(false); setCatAuditorSearch(''); }}
                            className={`w-full text-left px-3 py-1.5 rounded text-[10px] font-bold flex items-center gap-2 cursor-pointer transition-colors ${isSel ? 'bg-peach-accent text-dark-gray' : 'hover:bg-slate-50 text-dark-gray'}`}>
                            {isSel && <Check className="w-3 h-3 shrink-0" />}
                            <User className="w-3 h-3 shrink-0 text-dark-gray/40" />
                            {name}
                            <span className="ml-auto text-[9px] text-dark-gray/40 font-normal">{p.role}</span>
                          </button>
                        );
                      })}
                      {userProfiles.filter(p => (p.full_name || p.email).toLowerCase().includes(catAuditorSearch.toLowerCase())).length === 0
                        && !catAuditorSearch.trim() && (
                        <div className="px-3 py-2 text-[10px] text-dark-gray/40 italic">Tidak ada data pengguna</div>
                      )}
                    </div>
                  </div>
                )}
                {/* Info role */}
                {catAuditorName && (
                  <p className="text-[9px] text-slate-500 font-semibold">Ketua tim yang dipilih: {catAuditorName}</p>
                )}
              </div>

              {/* Anggota Tim */}
              <div className="space-y-1 relative">
                <label className="text-[10px] font-bold text-dark-gray/70 uppercase">
                  Anggota Tim <span className="text-dark-gray/40">({catTeamMembers.length} dipilih)</span>
                </label>
                <div
                  onClick={() => setIsTeamDropdownOpen(!isTeamDropdownOpen)}
                  className="w-full text-xs font-bold border border-dark-gray/15 p-2 rounded-lg bg-white text-dark-gray cursor-pointer flex justify-between items-center"
                >
                  <span className="truncate">
                    {catTeamMembers.length > 0 ? `${catTeamMembers.length} anggota dipilih` : '-- Pilih Anggota --'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-dark-gray/50 shrink-0" />
                </div>
                {isTeamDropdownOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-dark-gray/15 rounded-lg shadow-lg overflow-hidden max-h-44 flex flex-col">
                    <div className="p-2 border-b border-dark-gray/10 bg-slate-50">
                      <input type="text" placeholder="Cari anggota..." value={catTeamSearch}
                        onChange={e => setCatTeamSearch(e.target.value)}
                        onClick={e => e.stopPropagation()}
                        className="w-full text-[10px] font-medium border border-dark-gray/20 px-2 py-1.5 rounded bg-white focus:outline-none focus:border-peach-accent" />
                    </div>
                    <div className="overflow-y-auto p-1 space-y-0.5">
                      {userProfiles
                        .filter(p => ANGGOTA_TIM_ROLES.includes(p.role))
                        .filter(p => (p.full_name || p.email).toLowerCase().includes(catTeamSearch.toLowerCase()))
                        .sort(byNipAge)
                        .map(p => {
                        const name = p.full_name || p.email;
                        const isSel = catTeamMembers.includes(name);
                        return (
                          <button key={p.id} onClick={e => { e.stopPropagation(); setCatTeamMembers(prev => isSel ? prev.filter(n => n !== name) : [...prev, name]); }}
                            className={`w-full text-left px-3 py-1.5 rounded text-[10px] font-bold flex items-center gap-2 cursor-pointer transition-colors ${isSel ? 'bg-peach-accent text-dark-gray' : 'hover:bg-slate-50 text-dark-gray'}`}>
                            {isSel ? <Check className="w-3 h-3 shrink-0" /> : <Users className="w-3 h-3 shrink-0 text-dark-gray/40" />}
                            {name}
                            <span className="ml-auto text-[9px] text-dark-gray/40 font-normal">{p.role}</span>
                          </button>
                        );
                      })}
                      {userProfiles.length === 0 && (
                        <p className="px-3 py-2 text-[10px] text-dark-gray/40 italic">Belum ada data pengguna.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={() => setIsAddingCat(false)} className="flex-1 py-2 text-xs font-bold bg-white border border-dark-gray/15 rounded-xl text-dark-gray hover:bg-slate-50 cursor-pointer transition">Batal</button>
              <button
                onClick={handleAddCategory}
                disabled={!selCategoryId}
                className="flex-1 py-2 text-xs font-black bg-peach-accent border border-dark-gray/10 rounded-xl text-dark-gray hover:opacity-90 cursor-pointer transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus className="w-3.5 h-3.5 inline mr-1" />Tambahkan
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Section 3: Jadwal Pemeriksaan */}
      <div className="bg-white rounded-2xl border border-dark-gray/10 shadow-sm p-6 space-y-4">
        <h2 className="text-sm font-black text-dark-gray flex items-center gap-2">
          <Clock className="w-4 h-4 text-peach-accent" />
          Jadwal Pemeriksaan
          <span className="text-[10px] font-normal text-dark-gray/50 ml-1">Atur tanggal mulai & selesai setiap tahap</span>
        </h2>

        <div className="space-y-3">
          {schedule.map((m, idx) => {
            const dayCount = getDayCount(m.startDate, m.targetDate);
            return (
              <div key={m.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white flex-shrink-0 ${
                    idx === 0 ? 'bg-blue-500' : idx === 1 ? 'bg-amber-500' : idx === 2 ? 'bg-purple-500' : 'bg-emerald-500'
                  }`}>{idx + 1}</div>
                  <p className="text-xs font-black text-slate-800">{m.name}</p>
                  {dayCount !== null && (
                    <span className={`ml-auto text-[10px] font-black px-2 py-0.5 rounded-full border ${
                      dayCount === 0 ? 'bg-rose-50 text-rose-600 border-rose-200' :
                      dayCount <= 7 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      'bg-blue-50 text-blue-700 border-blue-200'
                    }`}>
                      {dayCount} hari
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Tanggal Mulai</label>
                    <input
                      type="date"
                      value={m.startDate || ''}
                      onChange={e => updateMilestone(m.id, 'startDate', e.target.value)}
                      className="w-full text-xs font-bold border border-slate-200 px-2.5 py-1.5 rounded-lg bg-white text-slate-800 outline-none focus:border-peach-accent focus:ring-1 focus:ring-peach-accent/20"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Tanggal Selesai</label>
                    <input
                      type="date"
                      value={m.targetDate || ''}
                      onChange={e => updateMilestone(m.id, 'targetDate', e.target.value)}
                      className="w-full text-xs font-bold border border-slate-200 px-2.5 py-1.5 rounded-lg bg-white text-slate-800 outline-none focus:border-peach-accent focus:ring-1 focus:ring-peach-accent/20"
                    />
                  </div>
                </div>
                {m.notes && (
                  <p className="mt-2 text-[10px] text-slate-400 italic">{m.notes}</p>
                )}
              </div>
            );
          })}
        </div>

        {/* Ringkasan total durasi */}
        {(() => {
          const first = schedule[0]?.startDate;
          const last = schedule[schedule.length - 1]?.targetDate;
          const total = getDayCount(first, last);
          return first && last && total !== null ? (
            <div className="flex items-center justify-between bg-peach-accent/10 border border-peach-accent/20 rounded-xl px-4 py-3">
              <span className="text-xs font-bold text-dark-gray/70">Total durasi pemeriksaan</span>
              <span className="text-sm font-black text-dark-gray">{total} hari</span>
            </div>
          ) : null;
        })()}
      </div>

      {/* Submit */}
      <div className="flex gap-3 pb-6">
        <button onClick={onBack} className="flex-1 py-3 text-sm font-bold bg-white border border-dark-gray/15 rounded-2xl text-dark-gray hover:bg-slate-50 cursor-pointer transition">
          Batal
        </button>
        <button
          onClick={handleSubmit}
          disabled={!isValid}
          className="flex-2 px-8 py-3 text-sm font-black bg-dark-gray text-white rounded-2xl hover:bg-dark-gray/85 cursor-pointer transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg"
        >
          <Sparkles className="w-4 h-4" />
          Buat Berkas Audit
        </button>
      </div>
    </div>
  );
}
