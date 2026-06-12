/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { OpdAudit, AuditStatus } from '../types';
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
  X
} from 'lucide-react';

interface AuditListViewProps {
  audits: OpdAudit[];
  onSelectAudit: (audit: OpdAudit) => void;
  onCreateAudit: (
    opdName: string, 
    opdType: 'SD' | 'SMP' | 'SMA' | 'SMK' | 'SLB' | 'Dinas' | 'Badan' | 'Kecamatan' | 'Puskesmas' | 'Lainnya', 
    fiscalYear: string, 
    auditorName: string, 
    budget: number,
    teamMembers: string[]
  ) => void;
  onDeleteAudit: (auditId: string) => void;
  onSyncToDrive: (audit: OpdAudit) => void;
  isDriveConnected: boolean;
  userRole?: 'Auditor' | 'Inspektur Pembantu' | 'Inspektur';
  defaultAuditorName?: string;
}

export default function AuditListView({
  audits,
  onSelectAudit,
  onCreateAudit,
  onDeleteAudit,
  onSyncToDrive,
  isDriveConnected,
  userRole = 'Auditor',
  defaultAuditorName = ''
}: AuditListViewProps) {
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form states for creating new audit
  const [newSchoolName, setNewSchoolName] = useState('');
  const [newSchoolType, setNewSchoolType] = useState<'SD' | 'SMP' | 'SMA' | 'SMK' | 'SLB' | 'Dinas' | 'Badan' | 'Kecamatan' | 'Puskesmas' | 'Lainnya'>('SD');
  const [newFiscalYear, setNewFiscalYear] = useState('2026');
  const [newAuditorName, setNewAuditorName] = useState(defaultAuditorName);
  const [newBosBudget, setNewBosBudget] = useState('150000000');
  const [newTeamMembers, setNewTeamMembers] = useState('');

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
    if (!newSchoolName || !newAuditorName) return;
    
    onCreateAudit(
      newSchoolName,
      newSchoolType,
      newFiscalYear,
      newAuditorName,
      parseFloat(newBosBudget) || 0,
      newTeamMembers.split(',').map(s => s.trim()).filter(Boolean)
    );

    // Reset and close
    setNewSchoolName('');
    setNewAuditorName('');
    setNewTeamMembers('');
    setNewBosBudget('150000000');
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
              <option value="SD">SD (OPD Dasar)</option>
              <option value="SMP">SMP (OPD Menengah)</option>
              <option value="Dinas">Dinas (OPD)</option>
              <option value="Badan">Badan / Kantor</option>
              <option value="Kecamatan">Kecamatan</option>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="audit-grid">
          {filteredAudits.map((audit) => {
            const totalFindingsVal = calculateTotalFindings(audit);
            const itemsCount = calculateFindingCount(audit);

            return (
              <div 
                key={audit.id}
                className="bg-baby-blue border rounded-xl border-dark-gray/10 shadow-sm hover:shadow-md transition-all hover:border-peach-accent flex flex-col justify-between overflow-hidden relative group"
              >
                {/* Header card info */}
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-peach-accent text-dark-gray border border-dark-gray/10 flex-shrink-0">
                      {audit.opdType}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${statusConfig[audit.status]?.bg || 'bg-white/50 border-dark-gray/10 text-dark-gray'} font-semibold flex-shrink-0`}>
                      {statusConfig[audit.status]?.label || audit.status}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h3 
                      onClick={() => onSelectAudit(audit)}
                      className="text-base font-bold text-dark-gray hover:text-dark-gray/80 cursor-pointer transition line-clamp-1 truncate"
                    >
                      {audit.opdName}
                    </h3>
                    <div className="flex items-center gap-1 text-dark-gray/60 text-xs">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Tahun Anggaran {audit.fiscalYear}</span>
                    </div>
                  </div>

                  {/* Auditor in charge info */}
                  <div className="flex flex-col gap-1.5 text-xs text-dark-gray/80 bg-white/40 px-2.5 py-1.5 rounded-lg border border-dark-gray/5">
                    <div className="flex items-center gap-1.5 truncate">
                      <User className="w-3.5 h-3.5 text-dark-gray/50 flex-shrink-0" />
                      <span className="truncate font-bold">Ketua Tim: {audit.auditorName || 'Belum Ditugaskan'}</span>
                    </div>
                    {audit.teamMembers && audit.teamMembers.length > 0 && (
                      <div className="flex items-start gap-1.5 text-[10px] text-dark-gray/60 pl-5">
                        <span className="truncate">Anggota: {audit.teamMembers.join(', ')}</span>
                      </div>
                    )}
                  </div>

                  {/* BOS budget and findings summary */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-dark-gray/10 text-[11px] font-bold">
                    <div>
                      <span className="text-dark-gray/60 uppercase tracking-wide block text-[9px] font-bold">Pagu Anggaran</span>
                      <span className="font-mono text-dark-gray font-bold block">{formatIDR(audit.budget)}</span>
                    </div>
                    <div>
                      <span className="text-rose-700 uppercase tracking-wide block text-[9px] font-bold">Kertas Kerja Temuan</span>
                      <span className="font-mono text-rose-700 font-bold block truncate">
                        {totalFindingsVal > 0 ? formatIDR(totalFindingsVal) : 'Sesuai (Rp 0)'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer interactive bar */}
                <div className="bg-white/30 px-4 py-3 border-t border-dark-gray/10 flex items-center justify-between mt-auto">
                  {/* Google Drive Status Indicator */}
                  <div className="flex items-center gap-1.5">
                    {audit.googleDriveFileId ? (
                      <span className="text-[10px] text-emerald-800 font-extrabold inline-flex items-center gap-1">
                        <Cloud className="w-3.5 h-3.5" /> Terkoneksi Drive
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={!isDriveConnected}
                        onClick={() => onSyncToDrive(audit)}
                        className={`text-[10px] font-bold inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border ${
                          isDriveConnected 
                            ? 'bg-peach-accent text-dark-gray border-dark-gray/10 hover:opacity-90 cursor-pointer' 
                            : 'bg-white/20 border-dark-gray/5 text-dark-gray/40 cursor-not-allowed'
                        }`}
                        title={isDriveConnected ? 'Sinkronisasikan ke Drive' : 'Masuk untuk mengaktifkan Google Drive'}
                      >
                        <CloudOff className="w-3.5 h-3.5" /> {isDriveConnected ? 'Unggah Drive' : 'Drive Off'}
                      </button>
                    )}
                  </div>

                  {/* Actions (Open audit workspace in bottom navigation pattern) */}
                  <div className="flex items-center gap-1.5">
                    {userRole === 'Auditor' && (
                      <button
                        type="button"
                        onClick={() => {
                          const confirmed = window.confirm(`Apakah Anda yakin ingin menghapus kertas kerja pemeriksaan untuk ${audit.opdName}?`);
                          if (confirmed) {
                            onDeleteAudit(audit.id);
                          }
                        }}
                        className="p-1.5 text-rose-700 hover:text-rose-900 hover:bg-rose-100/50 border border-transparent hover:border-rose-200/55 rounded-md transition cursor-pointer"
                        title="Hapus KKA"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onSelectAudit(audit)}
                      className="bg-dark-gray hover:bg-dark-gray/80 text-white font-bold text-xs px-2.5 py-1.5 rounded-lg inline-flex items-center gap-1 transition cursor-pointer shadow-sw"
                    >
                      Buka KKA <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
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
                    <option value="SD">SD (OPD Dasar)</option>
                    <option value="SMP">SMP (OPD Menengah)</option>
                    <option value="Dinas">Dinas (OPD)</option>
                    <option value="Badan">Badan / Kantor</option>
                    <option value="Kecamatan">Kecamatan</option>
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

              {/* Pagu Kemendikbud */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-dark-gray/70 uppercase tracking-wider block">Total Alokasi Pagu Anggaran (IDR)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs text-dark-gray/50 font-mono pointer-events-none font-bold">
                    Rp
                  </span>
                  <input
                    type="number"
                    required
                    placeholder="Contoh: 150000000"
                    value={newBosBudget}
                    onChange={e => setNewBosBudget(e.target.value)}
                    className="w-full text-xs font-mono font-bold border border-dark-gray/15 pl-9 p-2 rounded-lg bg-white/70 hover:bg-white focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-peach-accent/30 focus:border-peach-accent text-dark-gray"
                  />
                </div>
              </div>

              {/* Nama Pemeriksa / Ketua Tim */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-dark-gray/70 uppercase tracking-wider block">Nama Auditor / Ketua Tim Pemeriksa</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Drs. Suhendra, Ak."
                  value={newAuditorName}
                  onChange={e => setNewAuditorName(e.target.value)}
                  className="w-full text-xs font-bold border border-dark-gray/15 p-2 rounded-lg bg-white/70 hover:bg-white focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-peach-accent/30 focus:border-peach-accent text-dark-gray"
                />
              </div>

              {/* Anggota Tim */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-dark-gray/70 uppercase tracking-wider block">Anggota Tim (Pisahkan dengan koma)</label>
                <input
                  type="text"
                  placeholder="Misal: Budi, Cici, Dedi"
                  value={newTeamMembers}
                  onChange={e => setNewTeamMembers(e.target.value)}
                  className="w-full text-xs font-bold border border-dark-gray/15 p-2 rounded-lg bg-white/70 hover:bg-white focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-peach-accent/30 focus:border-peach-accent text-dark-gray"
                />
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
