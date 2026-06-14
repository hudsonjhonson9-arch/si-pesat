/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { OpdAudit, AuditStatus, KKATemplate, UserProfile, AuditType, TargetEntity } from '../types';
import {
  Plus,
  Search,
  Filter,
  Trash2,
  CloudCheck, // Wait, Lucide check for cloud check - we'll import Cloud, CloudOff, RefreshCw
  Cloud,
  CloudOff,
  RefreshCw,
  TrendingDown,
  Building,
  Calendar,
  User,
  ArrowRight,
  Calculator,
  X,
  ChevronDown
} from 'lucide-react';

interface AuditListViewProps {
  audits: OpdAudit[];
  templates: KKATemplate[];
  targetEntities: TargetEntity[];
  onSelectAudit: (audit: OpdAudit) => void;
  onCreateAudit: (
    opdName: string,
    opdType: OpdAudit['opdType'],
    auditType: AuditType,
    fiscalYear: string,
    auditorName: string,
    teamMembers: string[],
    templateId: string
  ) => void;
  onDeleteAudit: (auditId: string) => void;
  onSyncToDrive: (audit: OpdAudit) => void;
  isDriveConnected: boolean;
  userRole?: 'Auditor' | 'Inspektur Pembantu' | 'Inspektur';
  defaultAuditorName?: string;
  userProfiles: UserProfile[];
}

export default function AuditListView({
  audits,
  templates,
  targetEntities,
  onSelectAudit,
  onCreateAudit,
  onDeleteAudit,
  onSyncToDrive,
  isDriveConnected,
  userRole = 'Auditor',
  defaultAuditorName = '',
  userProfiles = []
}: AuditListViewProps) {

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isTeamDropdownOpen, setIsTeamDropdownOpen] = useState(false);

  // Form states for creating new audit
  const [newSchoolName, setNewSchoolName] = useState('');
  const [newSchoolType, setNewSchoolType] = useState<'SD' | 'SMP' | 'SMA' | 'SMK' | 'SLB' | 'Dinas' | 'Badan' | 'Kecamatan' | 'Puskesmas' | 'Lainnya'>('SD');
  const [newFiscalYear, setNewFiscalYear] = useState('2026');
  const [newAuditorName, setNewAuditorName] = useState(defaultAuditorName);
  const [newTeamMembers, setNewTeamMembers] = useState<string[]>([]);
  const [newTemplateId, setNewTemplateId] = useState<string>(templates.length > 0 ? templates[0].id : '');

  // Prefill auditor name when context is ready or modal is launched
  React.useEffect(() => {
    if (isCreateModalOpen && !newAuditorName && defaultAuditorName) {
      setNewAuditorName(defaultAuditorName);
    }
  }, [isCreateModalOpen, defaultAuditorName, newAuditorName]);

  // Format currency helper
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(num);
  };

  // Get total financial findings for audit
  const calculateTotalFindings = (audit: OpdAudit) => {
    let total = 0;
    audit.categories.forEach(cat => {
      cat.items.forEach(item => {
        if (item.status === 'Temuan') {
          total += item.nilaiTemuan || 0;
        }
      });
    });
    return total;
  };

  // Get count of KKA finding elements
  const calculateFindingCount = (audit: OpdAudit) => {
    let count = 0;
    audit.categories.forEach(cat => {
      cat.items.forEach(item => {
        if (item.status === 'Temuan') {
          count++;
        }
      });
    });
    return count;
  };

  const calculateProgress = (audit: OpdAudit) => {
    let evaluatedItems = 0;
    let totalItems = 0;
    audit.categories.forEach(cat => {
      cat.items.forEach(item => {
        totalItems++;
        if (item.status !== 'N/A') evaluatedItems++;
      });
    });
    if (totalItems === 0) return 0;
    return Math.round((evaluatedItems / totalItems) * 100);
  };

  // Dynamic status configurations
  const statusConfig: Record<AuditStatus, { bg: string; text: string; label: string }> = {
    'Draft': { bg: 'bg-slate-50 border-slate-200 text-slate-700', text: 'slate', label: 'Draft KKA' },
    'Sedang Berjalan': { bg: 'bg-amber-50 border-amber-200 text-amber-700', text: 'amber', label: 'Audit Lapangan' },
    'Direview': { bg: 'bg-sky-50 border-sky-200 text-sky-700', text: 'sky', label: 'Review Pengendali' },
    'Selesai': { bg: 'bg-emerald-50 border-emerald-200 text-emerald-700', text: 'emerald', label: 'LHP Diterbitkan' }
  };

  // Filter computations
  const filteredAudits = useMemo(() => {
    return audits.filter(audit => {
      const matchSearch = audit.opdName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        audit.auditorName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === 'all' || audit.status === statusFilter;
      const matchType = typeFilter === 'all' || audit.opdType === typeFilter;
      const matchYear = yearFilter === 'all' || audit.fiscalYear === yearFilter;

      return matchSearch && matchStatus && matchType && matchYear;
    });
  }, [audits, searchQuery, statusFilter, typeFilter, yearFilter]);

  // Unique fiscal years
  const availableYears = useMemo(() => {
    const years = audits.map(a => a.fiscalYear);
    return Array.from(new Set(years)).sort().reverse();
  }, [audits]);

  const handleSubmitNewAudit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchoolName || !newTemplateId) return;

    onCreateAudit(
      newSchoolName,
      newSchoolType,
      'Audit Keuangan',
      newFiscalYear,
      'Sistem (Auto-Generated)',
      [],
      newTemplateId
    );

    // Reset and close
    setNewSchoolName('');
    setNewAuditorName('');
    setNewTeamMembers([]);
    setIsCreateModalOpen(false);
  };

  return (
    <div className="space-y-6 text-dark-gray" id="audit-list-view">
      {/* Search and Filters panel */}
      <div className="bg-baby-blue rounded-xl border border-dark-gray/10 p-4 shadow-xs space-y-4 text-dark-gray">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-dark-gray/50 pointer-events-none">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Cari nama instansi, OPD, OPD, atau auditor..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-dark-gray/15 rounded-lg text-sm bg-white/70 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-peach-accent/30 focus:border-peach-accent outline-none transition text-dark-gray placeholder-dark-gray/50 font-medium"
            />
          </div>

          {/* New Audit Trigger Button (Restricted to Auditor Only) */}
          {userRole === 'Auditor' ? (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-peach-accent hover:opacity-90 text-dark-gray text-sm font-extrabold px-4 py-2 rounded-lg inline-flex items-center justify-center gap-1.5 shadow-sm transition-all h-[38px] cursor-pointer border border-dark-gray/10"
            >
              <Plus className="w-4 h-4" /> Mulai Audit Baru
            </button>
          ) : (
            <div
              className="bg-white/40 border border-dark-gray/10 text-dark-gray/60 rounded-lg py-2 px-3.5 text-xs font-bold flex items-center justify-center gap-1.5 h-[38px] select-none cursor-not-allowed"
              title="Khusus Auditor yang berwenang memulai instrumen KKA baru"
            >
              🔒 Pengisian KKA (Khusus Auditor)
            </div>
          )}
        </div>

        {/* Extended drop-downs for filtering */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-dark-gray/10 font-semibold">
          <div>
            <label className="text-[10px] font-bold text-dark-gray/70 uppercase tracking-wider block mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full text-xs font-bold border border-dark-gray/15 p-1.5 rounded-md bg-white/70 text-dark-gray focus:bg-white focus:outline-hidden focus:border-peach-accent"
            >
              <option value="all">Semua Status</option>
              <option value="Draft">Draft KKA</option>
              <option value="Sedang Berjalan">Audit Lapangan</option>
              <option value="Direview">Review Pengendali</option>
              <option value="Selesai">LHP Selesai</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-dark-gray/70 uppercase tracking-wider block mb-1">Tipe Objek</label>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="w-full text-xs font-bold border border-dark-gray/15 p-1.5 rounded-md bg-white/70 text-dark-gray focus:bg-white focus:outline-hidden focus:border-peach-accent"
            >
              <option value="all">Semua Tipe</option>
              <option value="SD">SD</option>
              <option value="SMP">SMP</option>
              <option value="Dinas">Dinas</option>
              <option value="Badan">Badan</option>
              <option value="Kecamatan">Kecamatan</option>
              <option value="Desa">Desa</option>
              <option value="Kelurahan">Kelurahan</option>
              <option value="Puskesmas">Puskesmas</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-dark-gray/70 uppercase tracking-wider block mb-1">Tahun Anggaran</label>
            <select
              value={yearFilter}
              onChange={e => setYearFilter(e.target.value)}
              className="w-full text-xs font-bold border border-dark-gray/15 p-1.5 rounded-md bg-white/70 text-dark-gray focus:bg-white focus:outline-hidden focus:border-peach-accent"
            >
              <option value="all">Semua TA</option>
              {availableYears.map(yr => (
                <option key={yr} value={yr}>TA {yr}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main interactive school lists cards (Mobile-first focused, expands to tablet/desktop grids) */}
      {filteredAudits.length === 0 ? (
        <div className="bg-baby-blue rounded-xl border border-dashed border-dark-gray/25 p-12 text-center select-none">
          <Building className="w-12 h-12 text-dark-gray/30 mx-auto mb-3" />
          <p className="text-dark-gray font-bold text-sm">Tidak ditemukan agenda audit</p>
          <p className="text-xs text-dark-gray/70 mt-1 max-w-sm mx-auto">
            Silakan sesuaikan filter pencarian Anda atau buat aktivitas Kertas Kerja Audit (KKA) baru menggunakan tombol di atas.
          </p>
        </div>
      ) : (
        <div className="space-y-6" id="audit-grid">
          {Object.entries(
            filteredAudits.reduce((acc, audit) => {
              const groupKey = `${audit.opdName}_${audit.fiscalYear}`;
              if (!acc[groupKey]) {
                acc[groupKey] = {
                  opdName: audit.opdName,
                  opdType: audit.opdType,
                  fiscalYear: audit.fiscalYear,
                  audits: []
                };
              }
              acc[groupKey].audits.push(audit);
              return acc;
            }, {} as Record<string, { opdName: string, opdType: string, fiscalYear: string, audits: OpdAudit[] }>)
          ).map(([key, group]: [string, { opdName: string, opdType: string, fiscalYear: string, audits: OpdAudit[] }]) => (
            <div key={key} className="bg-white rounded-2xl border border-dark-gray/15 overflow-hidden shadow-sm">
              <div className="bg-dark-gray/5 border-b border-dark-gray/10 px-5 py-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-dark-gray flex items-center gap-2">
                    <Building className="w-4 h-4 text-dark-gray/50" />
                    {group.opdName}
                  </h3>
                  <p className="text-[10px] font-semibold text-dark-gray/60 uppercase tracking-widest mt-0.5">
                    Jenjang {group.opdType} • Tahun Anggaran {group.fiscalYear}
                  </p>
                </div>
                <div className="bg-white border border-dark-gray/10 px-2.5 py-1 rounded-full text-[10px] font-black text-dark-gray shadow-xs">
                  {group.audits.length} Audit
                </div>
              </div>
              <div className="divide-y divide-dark-gray/5">
                {group.audits.map((audit) => {
                  const itemsCount = calculateFindingCount(audit);
                  const progress = calculateProgress(audit);

                  return (
                    <div
                      key={audit.id}
                      onClick={() => onSelectAudit(audit)}
                      className="px-5 py-3.5 hover:bg-baby-blue/40 transition cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                    >
                      {/* Left side info */}
                      <div className="flex-1 min-w-0 flex flex-col gap-3 py-1">
                        {audit.categories && audit.categories.length > 0 ? (
                          audit.categories.map((cat, idx) => (
                            <div key={cat.id || idx} className="flex items-center gap-4">
                              <div className="w-[140px] shrink-0">
                                <span className="text-[10px] bg-peach-accent/30 border border-peach-accent/50 text-dark-gray px-2.5 py-1 rounded-full font-bold uppercase tracking-wider block text-center truncate" title={cat.name}>
                                  {cat.name}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0 space-y-0.5">
                                <div className="flex items-center gap-2 text-[11px] text-dark-gray">
                                  <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold uppercase tracking-wider ${
                                    cat.status === 'Selesai' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                                    cat.status === 'Direview' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                                    cat.status === 'Sedang Berjalan' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                    'bg-slate-100 text-slate-500 border-slate-200'
                                  }`}>
                                    {cat.status || 'Draft'}
                                  </span>
                                  <User className="w-3 h-3 text-dark-gray/40 shrink-0" />
                                  <span className="font-bold truncate" title={cat.auditorName || 'Belum Ditugaskan'}>
                                    {cat.auditorName || 'Belum Ditugaskan'}
                                  </span>
                                </div>
                                {cat.teamMembers && cat.teamMembers.length > 0 && (
                                  <p className="text-[9px] text-dark-gray/60 font-medium truncate pl-5">
                                    + {cat.teamMembers.join(', ')}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="flex items-center gap-4 text-dark-gray/50">
                            <span className="text-[10px] bg-dark-gray/10 text-dark-gray/50 px-2.5 py-1 rounded-full font-bold uppercase w-[140px] text-center shrink-0">
                              Belum Ada Jenis
                            </span>
                            <span className="text-[11px] font-medium">Masuk untuk menambahkan Jenis Audit</span>
                          </div>
                        )}
                      </div>

                      {/* Right side status & action */}
                      <div className="flex items-center gap-6 shrink-0 justify-between md:justify-end">
                        <div className="flex items-center gap-3 w-[180px]">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${statusConfig[audit.status]?.bg || 'bg-white/50 border-dark-gray/10 text-dark-gray'} font-semibold shrink-0`}>
                            {statusConfig[audit.status]?.label || audit.status}
                          </span>
                          <div className="flex-1 h-1.5 bg-dark-gray/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-peach-accent rounded-full transition-all duration-500"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-bold text-dark-gray/60 w-8 text-right">{progress}%</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {userRole === 'Auditor' && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const confirmed = window.confirm(`Apakah Anda yakin ingin menghapus kertas kerja pemeriksaan untuk ${audit.opdName}?`);
                                if (confirmed) {
                                  onDeleteAudit(audit.id);
                                }
                              }}
                              className="p-1.5 text-rose-700 hover:text-rose-900 hover:bg-rose-100/50 border border-transparent hover:border-rose-200/55 rounded-md transition cursor-pointer opacity-100 md:opacity-0 md:group-hover:opacity-100"
                              title="Hapus KKA"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                          <div className="bg-dark-gray/5 group-hover:bg-dark-gray group-hover:text-white text-dark-gray font-bold p-1.5 rounded-lg transition shadow-xs">
                            <ArrowRight className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Slide-in Modal for Launching a New Audit */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="modal-backdrop">
          <div className="bg-baby-blue rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-dark-gray/20 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="bg-dark-gray text-white px-5 py-4 flex items-center justify-between border-b border-white/10">
              <div>
                <h3 className="font-bold text-base">Inisiasi KKA Audit Baru</h3>
                <p className="text-peach-accent text-[10px] uppercase tracking-wider font-extrabold leading-none mt-1">Tingkatan Inspektorat Pengawas Daerah</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-white/80 hover:text-white p-1 hover:bg-white/10 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitNewAudit} className="p-5 space-y-4 overflow-y-auto text-dark-gray">
              {/* Nama OPD */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-dark-gray/70 uppercase tracking-wider block">Nama Instansi / OPD / OPD</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Dinas Kesehatan, SDN 04 Palmerah, Kecamatan Palmerah"
                  value={newSchoolName}
                  onChange={e => setNewSchoolName(e.target.value)}
                  className="w-full text-xs font-bold border border-dark-gray/15 p-2 rounded-lg bg-white/70 hover:bg-white focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-peach-accent/30 focus:border-peach-accent text-dark-gray"
                />
              </div>

              {/* Jenjang Dan TA */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-dark-gray/70 uppercase tracking-wider block">Tipe Objek Audit</label>
                  <select
                    value={newSchoolType}
                    onChange={e => setNewSchoolType(e.target.value as any)}
                    className="w-full text-xs font-bold border border-dark-gray/15 p-2 rounded-lg bg-white text-dark-gray focus:outline-hidden focus:border-peach-accent"
                  >
                    <option value="SD">SD</option>
                    <option value="SMP">SMP</option>
                    <option value="Dinas">Dinas</option>
                    <option value="Badan">Badan</option>
                    <option value="Kecamatan">Kecamatan</option>
                    <option value="Desa">Desa</option>
                    <option value="Kelurahan">Kelurahan</option>
                    <option value="Puskesmas">Puskesmas</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-dark-gray/70 uppercase tracking-wider block">Tahun Anggaran</label>
                  <select
                    value={newFiscalYear}
                    onChange={e => setNewFiscalYear(e.target.value)}
                    className="w-full text-xs font-bold border border-dark-gray/15 p-2 rounded-lg bg-white text-dark-gray focus:outline-hidden focus:border-peach-accent"
                  >
                    <option value="2026">2026</option>
                    <option value="2025">2025</option>
                    <option value="2024">2024</option>
                  </select>
                </div>
              </div>

              {/* Template dan Tipe KKA */}
              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-dark-gray/70 uppercase tracking-wider block">Kelompok Audit</label>
                  <select
                    value={newTemplateId}
                    onChange={e => setNewTemplateId(e.target.value)}
                    className="w-full text-xs font-bold border border-dark-gray/15 p-2 rounded-lg bg-white text-dark-gray focus:outline-hidden focus:border-peach-accent"
                  >
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>




              {/* Action buttons */}
              <div className="flex items-center gap-3 pt-3 border-t border-dark-gray/10">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 bg-white hover:bg-white/80 text-dark-gray text-xs font-extrabold py-2.5 rounded-lg border border-dark-gray/10 transition cursor-pointer shadow-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-peach-accent hover:opacity-90 text-dark-gray text-xs font-extrabold py-2.5 rounded-lg transition shadow-md cursor-pointer border border-dark-gray/5"
                >
                  Mulai Pemeriksaan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
