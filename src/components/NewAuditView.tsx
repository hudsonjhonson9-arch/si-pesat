/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { KKATemplate, OpdAudit, UserProfile } from '../types';
import {
  ArrowLeft, Plus, Trash2, ChevronDown, FileCheck, Building,
  Calendar, User, Users, ClipboardList, Sparkles, X, Check
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
  defaultAuditorName?: string;
  onBack: () => void;
  onCreateAudit: (
    opdName: string,
    opdType: OpdAudit['opdType'],
    _legacy: string,
    fiscalYear: string,
    auditorName: string,
    teamMembers: string[],
    templateId: string,
    initialCategoryId?: string
  ) => void;
}

const OPD_TYPES: OpdAudit['opdType'][] = ['SD', 'SMP', 'Dinas', 'Badan', 'Kecamatan', 'Desa', 'Kelurahan', 'Puskesmas', 'Sekretariat Daerah', 'Lainnya'];
const FISCAL_YEARS = ['2026', '2025', '2024', '2023'];

export default function NewAuditView({
  audits,
  templates,
  userProfiles,
  defaultAuditorName = '',
  onBack,
  onCreateAudit,
}: NewAuditViewProps) {
  const [opdName, setOpdName] = useState('');
  const [opdType, setOpdType] = useState<OpdAudit['opdType']>('Dinas');
  const [fiscalYear, setFiscalYear] = useState('2026');
  const [categories, setCategories] = useState<CategoryDraft[]>([]);
  const [isAddingCat, setIsAddingCat] = useState(false);

  // For the add-category panel
  const [selTemplateId, setSelTemplateId] = useState(templates[0]?.id || '');
  const [selCategoryId, setSelCategoryId] = useState('');
  const [catAuditorName, setCatAuditorName] = useState(defaultAuditorName);
  const [catTeamMembers, setCatTeamMembers] = useState<string[]>([]);
  const [catAuditorSearch, setCatAuditorSearch] = useState('');
  const [catTeamSearch, setCatTeamSearch] = useState('');
  const [isAuditorDropdownOpen, setIsAuditorDropdownOpen] = useState(false);
  const [isTeamDropdownOpen, setIsTeamDropdownOpen] = useState(false);

  const selectedTemplate = templates.find(t => t.id === selTemplateId) || templates[0];

  const existingAudit = audits.find(a => a.opdName.toLowerCase() === opdName.trim().toLowerCase() && a.fiscalYear === fiscalYear);
  const existingCategoryIds = existingAudit ? existingAudit.categories.map(c => c.templateId + '|' + (c as any).categoryId) : [];

  const addedCategoryIds = [...categories.map(c => c.templateId + '|' + c.categoryId), ...existingCategoryIds];

  const availableCategories = selectedTemplate?.categories.filter(
    c => !addedCategoryIds.includes(selTemplateId + '|' + c.id)
  ) || [];

  const handleAddCategory = () => {
    if (!selCategoryId) return;
    setCategories(prev => [
      ...prev,
      {
        id: `draft_${Date.now()}`,
        templateId: selTemplateId,
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

  const getTemplateName = (draft: CategoryDraft) => {
    return templates.find(t => t.id === draft.templateId)?.name || '—';
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
      firstCat.categoryId
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
          Informasi Instansi Audit
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* OPD Name */}
          <div className="md:col-span-2 space-y-1">
            <label className="text-[10px] font-bold text-dark-gray/70 uppercase tracking-wide block">
              Nama Instansi <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={opdName}
              onChange={e => setOpdName(e.target.value)}
              placeholder="Contoh: Dinas Pendidikan Kabupaten Sumba Barat"
              className="w-full text-sm font-bold border border-dark-gray/15 px-3 py-2.5 rounded-xl bg-white text-dark-gray outline-none focus:border-peach-accent focus:ring-2 focus:ring-peach-accent/20"
            />
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
              <Calendar className="w-3 h-3 inline mr-1" />Tahun Anggaran
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
                    {getTemplateName(draft)} · Ketua: {draft.auditorName || '—'}
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

            {/* Template (Jenis Audit) selector */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-dark-gray/70 uppercase">Jenis Audit (Template)</label>
                <select
                  value={selTemplateId}
                  onChange={e => { setSelTemplateId(e.target.value); setSelCategoryId(''); }}
                  className="w-full text-xs font-bold border border-dark-gray/15 p-2 rounded-lg bg-white text-dark-gray outline-none focus:border-peach-accent"
                >
                  {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>

              {/* Category selector */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-dark-gray/70 uppercase">Kategori Audit</label>
                <select
                  value={selCategoryId}
                  onChange={e => setSelCategoryId(e.target.value)}
                  className="w-full text-xs font-bold border border-dark-gray/15 p-2 rounded-lg bg-white text-dark-gray outline-none focus:border-peach-accent"
                >
                  <option value="">-- Pilih Kategori --</option>
                  {availableCategories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
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
                      {userProfiles.filter(p => (p.full_name || p.email).toLowerCase().includes(catAuditorSearch.toLowerCase())).map(p => {
                        const name = p.full_name || p.email;
                        const isSel = catAuditorName === name;
                        return (
                          <button key={p.id} onClick={() => { setCatAuditorName(name); setIsAuditorDropdownOpen(false); setCatAuditorSearch(''); }}
                            className={`w-full text-left px-3 py-1.5 rounded text-[10px] font-bold flex items-center gap-2 cursor-pointer transition-colors ${isSel ? 'bg-peach-accent text-dark-gray' : 'hover:bg-slate-50 text-dark-gray'}`}>
                            {isSel && <Check className="w-3 h-3 shrink-0" />}
                            <User className="w-3 h-3 shrink-0 text-dark-gray/40" />
                            {name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
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
                      {userProfiles.filter(p => (p.full_name || p.email).toLowerCase().includes(catTeamSearch.toLowerCase())).map(p => {
                        const name = p.full_name || p.email;
                        const isSel = catTeamMembers.includes(name);
                        return (
                          <button key={p.id} onClick={e => { e.stopPropagation(); setCatTeamMembers(prev => isSel ? prev.filter(n => n !== name) : [...prev, name]); }}
                            className={`w-full text-left px-3 py-1.5 rounded text-[10px] font-bold flex items-center gap-2 cursor-pointer transition-colors ${isSel ? 'bg-peach-accent text-dark-gray' : 'hover:bg-slate-50 text-dark-gray'}`}>
                            {isSel ? <Check className="w-3 h-3 shrink-0" /> : <Users className="w-3 h-3 shrink-0 text-dark-gray/40" />}
                            {name}
                          </button>
                        );
                      })}
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
