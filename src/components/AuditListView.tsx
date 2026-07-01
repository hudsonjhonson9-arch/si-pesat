/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { OpdAudit, KKATemplate, UserProfile, AuditType, TargetEntity } from '../types';
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

const STRUKTURAL_ROLES = ['Inspektur', 'Inspektur Pembantu'];

interface AuditListViewProps {
  audits: OpdAudit[];
  templates: KKATemplate[];
  targetEntities: TargetEntity[];
  onSelectAudit: (audit: OpdAudit, categoryId?: string) => void;
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
  isAdmin?: boolean;
  defaultAuditorName?: string;
  userProfiles: UserProfile[];
  userBidangId?: number | null;
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
  isAdmin = false,
  defaultAuditorName = '',
  userProfiles = [],
  userBidangId
}: AuditListViewProps) {

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'newest'>('name');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isTeamDropdownOpen, setIsTeamDropdownOpen] = useState(false);
  const [deleteTargetGroup, setDeleteTargetGroup] = useState<{ opdName: string; audits: OpdAudit[] } | null>(null);
  const [deleteSelectedAuditId, setDeleteSelectedAuditId] = useState<string>('');

  // Form states for creating new audit
  const [newSchoolName, setNewSchoolName] = useState('');
  const [newSchoolType, setNewSchoolType] = useState<OpdAudit['opdType']>('SD');
  const [newFiscalYear, setNewFiscalYear] = useState('2026');
  const [selectedCatId, setSelectedCatId] = useState<string>('');
  const [isNewSchoolDropdownOpen, setIsNewSchoolDropdownOpen] = useState(false);
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

  // Filter computations
  const filteredAudits = useMemo(() => {
    let result = audits.filter(audit => {
      const matchSearch = audit.opdName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        audit.auditorName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchType = typeFilter === 'all' || audit.opdType === typeFilter;
      const matchYear = yearFilter === 'all' || audit.fiscalYear === yearFilter;
      const matchBidang = (userRole === 'Inspektur' || userRole === 'Sekretaris') || !userBidangId || audit.bidang_id === userBidangId;

      return matchSearch && matchType && matchYear && matchBidang;
    });

    if (sortBy === 'name') {
      result.sort((a, b) => a.opdName.localeCompare(b.opdName));
    } else if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.auditDate).getTime() - new Date(a.auditDate).getTime());
    }

    return result;
  }, [audits, searchQuery, typeFilter, yearFilter, sortBy]);

  // Unique fiscal years
  const availableYears = useMemo(() => {
    const years = audits.map(a => a.fiscalYear);
    return Array.from(new Set(years)).sort().reverse();
  }, [audits]);

  const handleSubmitNewAudit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchoolName || !newTemplateId) return;

    const selectedTemplate = templates.find(t => t.id === newTemplateId);

    onCreateAudit(
      newSchoolName,
      newSchoolType,
      selectedTemplate?.name || 'Audit Keuangan',
      newFiscalYear,
      defaultAuditorName || 'Auditor',
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
      {/* Title */}
      <div className="flex items-center gap-2">
        <div className="w-1 h-6 bg-peach-accent rounded-full" />
        <h2 className="text-lg font-black text-dark-gray tracking-tight">Kertas Kerja Audit</h2>
      </div>

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
        </div>

        {/* Extended drop-downs for filtering */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pt-2 border-t border-dark-gray/10 font-semibold">
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
              <option value="Sekretariat Daerah">Sekretariat Daerah</option>
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

          <div>
            <label className="text-[10px] font-bold text-dark-gray/70 uppercase tracking-wider block mb-1">Urutkan</label>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as 'name' | 'newest')}
              className="w-full text-xs font-bold border border-dark-gray/15 p-1.5 rounded-md bg-white/70 text-dark-gray focus:bg-white focus:outline-hidden focus:border-peach-accent"
            >
              <option value="name">Nama</option>
              <option value="newest">Terbaru</option>
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
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-peach-accent/20 flex items-center justify-center shrink-0">
                    <Building className="w-4 h-4 text-dark-gray" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-dark-gray">
                      {group.opdName}
                    </h3>
                    <p className="text-[10px] font-bold text-dark-gray/50 uppercase tracking-widest">
                      {group.opdType} • TA {group.fiscalYear}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {(isAdmin || STRUKTURAL_ROLES.includes(userRole)) && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTargetGroup({ opdName: group.opdName, audits: group.audits });
                        setDeleteSelectedAuditId('');
                      }}
                      className="text-[10px] font-extrabold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2.5 py-1 rounded-lg transition cursor-pointer inline-flex items-center gap-1"
                      title="Hapus KKA"
                    >
                      <Trash2 className="w-3 h-3" /> Hapus
                    </button>
                  )}
                  <div className="bg-peach-accent/20 px-3 py-1 rounded-full text-[10px] font-black text-dark-gray">
                    {group.audits.length} KKA
                  </div>
                </div>
              </div>

              <div className="divide-y divide-dark-gray/5">
                {group.audits.map((audit) => {
                  return (
                    <div
                      key={audit.id}
                      onClick={() => onSelectAudit(audit)}
                      className="px-5 py-3 hover:bg-baby-blue/40 transition cursor-pointer flex flex-col md:flex-row md:items-stretch justify-between gap-4 group"
                    >
                      {/* Left side: Categories list with progress */}
                      <div className="flex-1 min-w-0 flex flex-col justify-center gap-1 py-1">
                        <div className="flex items-center gap-2 mb-1 pb-1 border-b border-dark-gray/10">
                          <span className="text-[10px] font-extrabold bg-dark-gray/10 text-dark-gray px-2 py-0.5 rounded tracking-wide">
                            {audit.auditType}
                          </span>
                          <span className="text-[9px] text-dark-gray/50 font-medium">{audit.auditorName}</span>
                        </div>
                        {audit.categories && audit.categories.length > 0 ? (
                          audit.categories.map((cat, idx) => {
                            let evaluatedItems = 0;
                            let totalItems = 0;
                            cat.items.forEach(item => {
                              totalItems++;
                              if (item.status !== 'N/A') evaluatedItems++;
                            });
                            const catProgress = totalItems === 0 ? 0 : Math.round((evaluatedItems / totalItems) * 100);

                            return (
                              <div 
                                key={cat.id || idx} 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelectAudit(audit, cat.id);
                                }}
                                className="flex flex-col sm:flex-row sm:items-center gap-4 py-2 border-b border-dark-gray/5 last:border-0 hover:bg-white/30 hover:shadow-sm rounded px-2 transition-all cursor-pointer"
                              >
                                {/* Cat Name */}
                                <div className="w-[150px] shrink-0">
                                  <span className="text-[10px] bg-peach-accent/30 border border-peach-accent/50 text-dark-gray px-2.5 py-1 rounded-full font-bold uppercase tracking-wider block text-center truncate" title={cat.name}>
                                    {cat.name}
                                  </span>
                                </div>
                                
                                {/* Auditor & Team */}
                                <div className="flex-1 min-w-0 space-y-0.5">
                                  <div className="flex items-center gap-2 text-[11px] text-dark-gray">
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

                                {/* Category Status & Progress */}
                                <div className="flex items-center gap-3 w-[180px] shrink-0">
                                  <span className={`text-[9px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider shrink-0 ${
                                    cat.status === 'Selesai' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                                    cat.status === 'Direview' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                                    cat.status === 'Sedang Berjalan' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                    'bg-slate-100 text-slate-500 border-slate-200'
                                  }`}>
                                    {cat.status || 'Draft'}
                                  </span>
                                  <div className="flex-1 h-1.5 bg-dark-gray/10 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-peach-accent rounded-full transition-all duration-500"
                                      style={{ width: `${catProgress}%` }}
                                    />
                                  </div>
                                  <span className="text-[10px] font-bold text-dark-gray/60 w-8 text-right">{catProgress}%</span>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="flex items-center gap-4 text-dark-gray/50 py-2">
                            <span className="text-[10px] bg-dark-gray/10 text-dark-gray/50 px-2.5 py-1 rounded-full font-bold uppercase w-[150px] text-center shrink-0">
                              Belum Ada Jenis
                            </span>
                            <span className="text-[11px] font-medium">Masuk untuk menambahkan Jenis Audit</span>
                          </div>
                        )}
                      </div>

                      {/* Right side: Actions */}
                      <div className="flex items-center md:flex-col justify-end md:justify-center gap-3 shrink-0 border-t md:border-t-0 md:border-l border-dark-gray/10 pt-3 md:pt-0 md:pl-6">
                        <div className="w-8 h-8 rounded-full bg-dark-gray text-white flex items-center justify-center shadow-md shadow-dark-gray/20 group-hover:scale-110 group-hover:bg-peach-accent transition-all duration-300">
                          <ArrowRight className="w-4 h-4" />
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
              <div className="space-y-1 relative">
                <label className="text-xs font-bold text-dark-gray/70 uppercase tracking-wider block">Nama Instansi / OPD / OPD</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Misal: Dinas Kesehatan, SDN 04 Palmerah, Kecamatan Palmerah"
                    value={newSchoolName}
                    onChange={e => {
                      setNewSchoolName(e.target.value);
                      setIsNewSchoolDropdownOpen(true);
                    }}
                    onFocus={() => setIsNewSchoolDropdownOpen(true)}
                    onBlur={() => setTimeout(() => setIsNewSchoolDropdownOpen(false), 200)}
                    className="w-full text-xs font-bold border border-dark-gray/15 p-2 rounded-lg bg-white/70 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-peach-accent/30 focus:border-peach-accent text-dark-gray"
                  />
                  {isNewSchoolDropdownOpen && targetEntities && targetEntities.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-dark-gray/15 rounded-xl shadow-xl overflow-hidden max-h-48 flex flex-col">
                      <div className="overflow-y-auto p-1 space-y-0.5">
                        {targetEntities.filter(t => t.name.toLowerCase().includes(newSchoolName.toLowerCase())).length > 0 ? (
                          targetEntities.filter(t => t.name.toLowerCase().includes(newSchoolName.toLowerCase())).map(t => (
                            <button
                              key={t.id}
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                setNewSchoolName(t.name);
                                setIsNewSchoolDropdownOpen(false);
                                // Auto map type if matched exactly
                                const mappedType = ['SD', 'SMP', 'Dinas', 'Badan', 'Kecamatan', 'Desa', 'Kelurahan', 'Puskesmas', 'Sekretariat Daerah', 'Lainnya'].find(ot => ot.toLowerCase() === t.type.toLowerCase());
                                if (mappedType) setNewSchoolType(mappedType as any);
                                else if (t.type === 'Sekolah' && t.name.toUpperCase().includes('SD')) setNewSchoolType('SD');
                                else if (t.type === 'Sekolah' && t.name.toUpperCase().includes('SMP')) setNewSchoolType('SMP');
                              }}
                              className="w-full text-left px-3 py-2 rounded text-xs font-bold hover:bg-slate-50 text-dark-gray transition-colors cursor-pointer"
                            >
                              {t.name}
                            </button>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-xs text-dark-gray/50 italic">Tidak ada objek audit yang cocok</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
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
                  Mulai KKA
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal hapus KKA — pilih KKA mana yang akan dihapus */}
      {deleteTargetGroup && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" onClick={() => setDeleteTargetGroup(null)}>
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-dark-gray/10 text-dark-gray overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-dark-gray text-white px-4 py-3 flex items-center justify-between">
              <span className="font-extrabold text-xs tracking-wide">Pilih KKA — {deleteTargetGroup.opdName}</span>
              <button onClick={() => setDeleteTargetGroup(null)} className="text-white/80 hover:text-white font-xs font-bold cursor-pointer">Tutup</button>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-[11px] font-bold text-dark-gray/70">KKA yang tersedia:</p>
              {deleteTargetGroup.audits.length === 0 ? (
                <p className="text-xs text-dark-gray/50 italic">Tidak ada KKA.</p>
              ) : (
                <div className="space-y-1.5 max-h-60 overflow-y-auto">
                  {deleteTargetGroup.audits.map((a) => {
                    const isChecked = deleteSelectedAuditId.split(',').includes(a.id);
                    return (
                      <label
                        key={a.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${
                          isChecked ? 'bg-rose-50 border-rose-300' : 'bg-white border-dark-gray/15 hover:bg-dark-gray/5'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            const ids = deleteSelectedAuditId ? deleteSelectedAuditId.split(',') : [];
                            const next = isChecked ? ids.filter(id => id !== a.id) : [...ids, a.id];
                            setDeleteSelectedAuditId(next.join(','));
                          }}
                          className="accent-rose-600"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold truncate">{a.auditType}</p>
                          <p className="text-[10px] text-dark-gray/50 font-medium truncate">{a.auditorName} • {a.categories?.length || 0} kategori</p>
                        </div>
                        {deleteTargetGroup.audits.length === 1 && (
                          <span className="text-[9px] font-black bg-rose-100 text-rose-700 px-2 py-0.5 rounded">satu-satunya</span>
                        )}
                      </label>
                    );
                  })}
                </div>
              )}
              <div className="flex items-center gap-3 pt-2 border-t border-dark-gray/10">
                <button
                  type="button"
                  onClick={() => setDeleteTargetGroup(null)}
                  className="flex-1 bg-white hover:bg-white/80 text-dark-gray text-xs font-extrabold py-2 rounded-lg border border-dark-gray/10 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={!deleteSelectedAuditId}
                  onClick={() => {
                    if (!deleteSelectedAuditId) return;
                    const ids = deleteSelectedAuditId.split(',');
                    if (window.confirm(`Hapus ${ids.length} KKA yang dipilih untuk ${deleteTargetGroup.opdName}?`)) {
                      ids.forEach(id => onDeleteAudit(id));
                    }
                    setDeleteTargetGroup(null);
                    setDeleteSelectedAuditId('');
                  }}
                  className={`flex-1 text-xs font-extrabold py-2 rounded-lg transition cursor-pointer ${
                    deleteSelectedAuditId
                      ? 'bg-rose-600 text-white hover:bg-rose-700 shadow-md'
                      : 'bg-rose-200 text-rose-400 cursor-not-allowed'
                  }`}
                >
                  {deleteSelectedAuditId ? `Hapus (${deleteSelectedAuditId.split(',').length})` : 'Hapus'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
