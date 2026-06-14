/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { OpdAudit, FindingStatus } from '../types';
import { 
  TrendingUp, 
  ShieldCheck, 
  AlertTriangle, 
  DollarSign, 
  Layers, 
  School,
  ArrowUpRight,
  CheckCircle,
  FileText,
  Search,
  Filter,
  Eye
} from 'lucide-react';

interface DashboardViewProps {
  audits: OpdAudit[];
  onSelectAudit: (audit: OpdAudit) => void;
  userRole?: 'Auditor' | 'Inspektur Pembantu' | 'Inspektur';
}

export default function DashboardView({ audits, onSelectAudit, userRole = 'Auditor' }: DashboardViewProps) {
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [opdTypeFilter, setSchoolTypeFilter] = useState<string>('Semua');
  const [statusFilter, setStatusFilter] = useState<string>('Semua');

  // Format currency helper
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(num);
  };

  // Compute school-specific data (findings counts & values) along with filters
  const processedAudits = useMemo(() => {
    return audits.map(audit => {
      let findingsCount = 0;
      let findingsVal = 0;
      
      audit.categories.forEach(cat => {
        cat.items.forEach(item => {
          if (item.status === 'Temuan') {
            findingsCount++;
            findingsVal += (item.nilaiTemuan || 0);
          }
        });
      });

      return {
        ...audit,
        findingsCount,
        findingsVal
      };
    }).filter(audit => {
      // Search matches school name or auditor name
      const matchesSearch = audit.opdName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            audit.auditorName.toLowerCase().includes(searchTerm.toLowerCase());
      
      // School type matches
      const matchesType = opdTypeFilter === 'Semua' || audit.opdType === opdTypeFilter;
      
      // Status matches
      const matchesStatus = statusFilter === 'Semua' || audit.status === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [audits, searchTerm, opdTypeFilter, statusFilter]);

  // Compute stats
  const stats = useMemo(() => {
    let totalAudited = audits.length;
    let totalFindingsVal = 0;
    let totalItemsChecked = 0;
    let totalTemuanItems = 0;
    let pendingAudits = 0;
    let completedAudits = 0;

    const findingsByType: Record<string, number> = {
      'Kelebihan Pembayaran': 0,
      'Belanja Fiktif': 0,
      'Pemborosan': 0,
      'Pajak Belum Disetor': 0,
      'Tidak Sesuai Juknis': 0,
      'Lainnya': 0
    };

    const findingsByCategory: Record<string, number> = {};
    const topFindingsList: {
      opdName: string;
      categoryName: string;
      findingTitle: string;
      value: number;
      type: string;
      audit: OpdAudit;
    }[] = [];

    audits.forEach(audit => {
      if (audit.status === 'Selesai') {
        completedAudits++;
      } else {
        pendingAudits++;
      }

      audit.categories.forEach(cat => {
        cat.items.forEach(item => {
          totalItemsChecked++;
          if (item.status === 'Temuan') {
            totalTemuanItems++;
            const val = item.nilaiTemuan || 0;
            totalFindingsVal += val;

            if (val > 0) {
              const jenis = item.jenisTemuan || 'Lainnya';
              findingsByType[jenis] = (findingsByType[jenis] || 0) + val;
              findingsByCategory[cat.name] = (findingsByCategory[cat.name] || 0) + val;

              topFindingsList.push({
                opdName: audit.opdName,
                categoryName: cat.name,
                findingTitle: item.title,
                value: val,
                type: jenis,
                audit: audit
              });
            }
          }
        });
      });
    });

    // Sort top findings descending
    topFindingsList.sort((a, b) => b.value - a.value);

    return {
      totalAudited,
      totalFindingsVal,
      totalItemsChecked,
      totalTemuanItems,
      pendingAudits,
      completedAudits,
      findingsByType,
      findingsByCategory,
      topFindings: topFindingsList.slice(0, 5)
    };
  }, [audits]);

  // Color mappings for finding types
  const typeColors: Record<string, string> = {
    'Kelebihan Pembayaran': 'bg-rose-50 border-rose-200 text-rose-700',
    'Belanja Fiktif': 'bg-red-50 border-red-200 text-red-700',
    'Pemborosan': 'bg-amber-50 border-amber-200 text-amber-700',
    'Pajak Belum Disetor': 'bg-orange-50 border-orange-200 text-orange-700',
    'Tidak Sesuai Juknis': 'bg-purple-50 border-purple-200 text-purple-700',
    'Lainnya': 'bg-slate-50 border-slate-200 text-slate-700'
  };

  const typeHexColors: Record<string, string> = {
    'Belanja Fiktif': '#ef4444',
    'Kelebihan Pembayaran': '#f43f5e',
    'Pajak Belum Disetor': '#f97316',
    'Tidak Sesuai Juknis': '#a855f7',
    'Pemborosan': '#eab308',
    'Lainnya': '#64748b'
  };

  // Pie chart metrics calculation
  const totalFindingsSum = (Object.values(stats.findingsByType) as number[]).reduce((a: number, b: number) => a + b, 0) || 1;
  const pieSectors = useMemo(() => {
    let accumulatedPercent = 0;
    return (Object.entries(stats.findingsByType) as [string, number][]).map(([type, val]) => {
      const pct = (val / totalFindingsSum) * 100;
      const startPct = accumulatedPercent;
      accumulatedPercent += pct;
      return {
        type,
        val,
        startPct,
        endPct: accumulatedPercent,
        color: typeHexColors[type] || '#64748b'
      };
    }).filter(s => s.val > 0);
  }, [stats.findingsByType, totalFindingsSum]);

  // SVG pie chart path builder
  const getCoordinatesForPercent = (percent: number) => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  };

  return (
    <div className="space-y-4" id="dashboard-container">
      {/* Welcome Banner */}
      <div className="bg-white rounded-3xl p-4 md:p-5 text-dark-gray border border-dark-gray/10 shadow-sm relative overflow-hidden" id="dashboard-banner">
        <div className="absolute right-0 top-0 -mr-6 -mt-6 w-32 h-32 bg-baby-blue/30 rounded-full blur-xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 -mb-10 w-48 h-48 bg-peach-accent/20 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="bg-baby-blue/60 text-dark-gray border border-dark-gray/10 text-[10px] px-3 py-1 rounded-full font-extrabold inline-flex items-center gap-1 uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" /> Pengawasan Internal Inspektorat
            </span>
            <h1 className="text-xl md:text-2xl font-black tracking-tight mt-2 text-dark-gray">
              SI-PESAT Audit
            </h1>
            <p className="text-dark-gray/70 text-[11px] mt-1 max-w-xl leading-relaxed">
              Sistem Informasi Kertas Kerja Audit (KKA) Google Drive. Pantau kesesuaian administrasi keuangan, unggah bukti fisik langsung, dan validasi temuan kas secara real-time.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-3 bg-cream-bg/60 border border-dark-gray/10 p-3 rounded-2xl self-start md:self-auto w-full md:w-auto">
            <div className="text-center">
              <div className="text-base md:text-lg font-mono font-black text-dark-gray">{stats.completedAudits}</div>
              <div className="text-[9px] uppercase tracking-wider font-extrabold text-dark-gray/60">Selesai (LHP)</div>
            </div>
            <div className="text-center border-l border-dark-gray/10 pl-3">
              <div className="text-base md:text-lg font-mono font-black text-dark-gray">{stats.pendingAudits}</div>
              <div className="text-[9px] uppercase tracking-wider font-extrabold text-dark-gray/60">Draft / Berjalan</div>
            </div>
          </div>
        </div>
      </div>

      {/* Aggregate KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="dashboard-kpis">


        {/* Card 2: Total Temuan Keuangan */}
        <div className="bg-white rounded-3xl p-4 border border-dark-gray/10 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">Total Temuan Keuangan</span>
            <span className="text-lg md:text-xl font-mono font-black text-rose-800 block mt-0.5">
              {formatIDR(stats.totalFindingsVal)}
            </span>
            <span className="text-[10px] text-rose-700/80 font-bold inline-flex items-center gap-1 mt-0.5">
              <AlertTriangle className="w-3 h-3 inline animate-bounce" /> {stats.totalTemuanItems} Kriteria Temuan
            </span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center border border-rose-100">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Efisiensi Kepatuhan */}
        <div className="bg-white rounded-3xl p-4 border border-dark-gray/10 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-dark-gray/60 uppercase tracking-wider block">Rasio Kepatuhan</span>
            <span className="text-lg md:text-xl font-mono font-black text-dark-gray block mt-0.5">
              {stats.totalItemsChecked > 0 
                ? (Math.max(0, 100 - (stats.totalTemuanItems / stats.totalItemsChecked) * 100)).toFixed(1)
                : '100'}%
            </span>
            <span className="text-[10px] text-dark-gray/80 font-bold inline-flex items-center gap-0.5 mt-0.5">
              Dari total <span className="font-semibold mx-0.5">{stats.totalItemsChecked}</span> kriteria diuji
            </span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-peach-accent/40 text-dark-gray flex items-center justify-center border border-dark-gray/10">
            <Layers className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Visual Analytics Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="dashboard-charts">
        {/* Left: Temuan Keuangan Berdasarkan Klasifikasi */}
        <div className="bg-white rounded-3xl p-5 border border-dark-gray/10 shadow-sm flex flex-col justify-start text-dark-gray">
          <div className="mb-4">
            <h3 className="font-bold text-dark-gray text-base">Sebaran Klasifikasi Temuan Keuangan</h3>
            <p className="text-xs text-dark-gray/70 mt-0.5">Analisis dominasi penyimpangan kas & administrasi</p>
          </div>

          {pieSectors.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-10 text-center select-none">
              <CheckCircle className="w-12 h-12 text-dark-gray/25 mb-2" />
              <p className="text-sm font-bold text-dark-gray">Tidak Ada Temuan Keuangan</p>
              <p className="text-xs text-dark-gray/60 max-w-xs mt-0.5">Semua kriteria pemeriksaan pada berkas KKA dinyatakan sesuai standar.</p>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 py-2">
              {/* Graphic Component (Donut Chart) */}
              <div className="relative w-44 h-44 flex-shrink-0 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="-1.25 -1.25 2.5 2.5">
                  {pieSectors.map((sector, idx) => {
                    // Draw clean pie slices
                    const [startX, startY] = getCoordinatesForPercent(sector.startPct / 100);
                    const [endX, endY] = getCoordinatesForPercent(sector.endPct / 100);
                    const largeArcFlag = sector.endPct - sector.startPct > 50 ? 1 : 0;
                    
                    const pathData = [
                      `M ${startX} ${startY}`,
                      `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
                      `L 0 0`
                    ].join(' ');

                    return (
                      <path
                        key={idx}
                        d={pathData}
                        fill={sector.color}
                        stroke="#FFFFFF"
                        strokeWidth="0.04"
                        className="transition-all duration-300 hover:opacity-90"
                      />
                    );
                  })}
                  {/* Mask for Donut - matches White Card background */}
                  <circle cx="0" cy="0" r="0.6" fill="#FFFFFF" />
                </svg>
                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] font-bold text-dark-gray/60 tracking-wider uppercase block">Total</span>
                  <span className="text-xs font-bold text-dark-gray font-mono block">
                    {formatIDR(stats.totalFindingsVal).replace('Rp', '').trim()}
                  </span>
                </div>
              </div>

              {/* Legends with detail and percentage */}
              <div className="flex-1 space-y-2.5 w-full font-semibold">
                {pieSectors.map((sector, idx) => {
                  const percentage = (((sector.val as number) / totalFindingsSum) * 100).toFixed(1);
                  return (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span 
                           className="w-3 h-3 rounded-md flex-shrink-0" 
                           style={{ backgroundColor: sector.color }} 
                        />
                        <span className="text-dark-gray/85 font-semibold">{sector.type}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-dark-gray">{formatIDR(sector.val as number)}</span>
                        <span className="text-[10px] text-dark-gray/60 font-mono block leading-none">{percentage}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right: Dampak Kerugian Berdasarkan Kategori KKA */}
        <div className="bg-white rounded-3xl p-5 border border-dark-gray/10 shadow-sm flex flex-col justify-start text-dark-gray">
          <div className="mb-4">
            <h3 className="font-bold text-dark-gray text-base">Nilai Temuan per Kategori KKA</h3>
            <p className="text-xs text-dark-gray/70 mt-0.5">Nilai kerugian finansial yang teridentifikasi di setiap bagian instrumen</p>
          </div>

          <div className="max-h-[220px] overflow-y-auto pr-1 space-y-4 flex-1 flex flex-col justify-start scrollbar-thin scrollbar-thumb-dark-gray/20 scrollbar-track-transparent">
            {Object.keys(stats.findingsByCategory).length === 0 ? (
              <div className="text-center py-10 select-none">
                <CheckCircle className="w-12 h-12 text-dark-gray/30 mx-auto mb-2" />
                <p className="text-sm font-bold text-dark-gray">Kinerja Anggaran Bagus</p>
                <p className="text-xs text-dark-gray/60 max-w-xs mx-auto mt-0.5">Belum dilaporkan penyimpangan nominal di lintas objek audit.</p>
              </div>
            ) : (
              (Object.entries(stats.findingsByCategory) as [string, number][]).map(([catName, val], idx) => {
                const maxVal = Math.max(...(Object.values(stats.findingsByCategory) as number[]), 1);
                const widthPercent = ((val as number) / maxVal) * 100;
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-dark-gray/90 font-bold truncate max-w-[220px] md:max-w-xs">{catName}</span>
                      <span className="font-mono font-bold text-dark-gray">{formatIDR(val as number)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-cream-bg overflow-hidden border border-dark-gray/5">
                      <div 
                        className="h-full bg-rose-400 rounded-full transition-all duration-500" 
                        style={{ width: `${widthPercent}%` }} 
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Top 5 Financial Findings Board */}
      <div className="bg-white rounded-3xl p-5 border border-dark-gray/10 shadow-sm text-dark-gray" id="top-findings-board">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-dark-gray text-base">Temuan Keuangan Terbesar</h3>
            <p className="text-xs text-dark-gray/70 mt-0.5">Daftar kejadian materiil audit yang memerlukan tindak lanjut pengembalian dana</p>
          </div>
          <span className="text-[10px] bg-peach-accent text-dark-gray border border-dark-gray/15 px-2 py-1 rounded-md font-mono uppercase font-black">
            Tinggi Ke Rendah
          </span>
        </div>

        {stats.topFindings.length === 0 ? (
          <div className="text-center py-8 bg-cream-bg/30 rounded-xl border border-dashed border-dark-gray/20">
            <span className="text-xs text-dark-gray/60 block font-bold">Belum terdeteksi adanya temuan keuangan materiil.</span>
          </div>
        ) : (
          <div className="max-h-[240px] overflow-y-auto pr-1 divide-y divide-dark-gray/10 scrollbar-thin scrollbar-thumb-dark-gray/20 scrollbar-track-transparent">
            {stats.topFindings.map((finding, idx) => (
              <div 
                key={idx} 
                onClick={() => onSelectAudit(finding.audit)}
                className="py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-cream-bg/40 p-2.5 rounded-lg transition-all cursor-pointer group"
              >
                <div className="space-y-1">
                  <div className="flex items-center flex-wrap gap-2">
                    <span className="text-xs font-bold text-dark-gray group-hover:text-amber-900 transition font-black">
                      {finding.opdName}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${typeColors[finding.type] || 'bg-white/50 border-dark-gray/10'}`}>
                      {finding.type}
                    </span>
                  </div>
                  <h4 className="text-xs text-dark-gray/80 font-bold">{finding.findingTitle}</h4>
                  <p className="text-[11px] text-dark-gray/60 line-clamp-1 italic">
                    "{finding.categoryName}"
                  </p>
                </div>

                <div className="flex items-center justify-between md:text-right md:justify-end gap-3 flex-shrink-0">
                  <div className="text-left md:text-right">
                    <span className="text-xs font-mono font-bold text-rose-700 block">
                      {formatIDR(finding.value)}
                    </span>
                    <span className="text-[10px] text-dark-gray/60 block font-medium">Nilai Kerugian</span>
                  </div>
                  <button className="p-1 px-1.5 bg-white hover:bg-peach-accent bg-cream-bg/50 rounded-md border border-dark-gray/10 text-dark-gray transition shadow-xs cursor-pointer">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* List of Inspected OPDs/Schools */}
      <div className="bg-white rounded-3xl p-5 md:p-6 border border-dark-gray/10 shadow-sm space-y-5" id="schools-budgets-registry">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-dark-gray/10">
          <div>
            <h3 className="font-bold text-dark-gray text-base">Daftar Objek Audit</h3>
            <p className="text-xs text-dark-gray/70 mt-0.5">
              Rincian objek audit dan progres kertas kerja pemeriksaan (KKA).
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-peach-accent text-dark-gray border border-dark-gray/10 px-2 py-1 rounded font-bold font-mono uppercase">
              {processedAudits.length} Instansi Terfilter
            </span>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-dark-gray/50 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama instansi, OPD, OPD, atau auditor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-dark-gray/15 rounded-xl text-xs bg-white/70 focus:bg-white focus:ring-2 focus:ring-peach-accent/30 focus:border-peach-accent outline-none transition text-dark-gray placeholder-dark-gray/50 font-medium"
            />
          </div>

          {/* School/OPD type filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 text-xs text-dark-gray mr-1">
              <Filter className="w-3.5 h-3.5 text-dark-gray" />
              <span>Tipe Objek:</span>
            </div>
            {['Semua', 'SD', 'SMP', 'Dinas', 'Badan', 'Kecamatan', 'Puskesmas', 'Lainnya'].map((type) => {
              const isActive = opdTypeFilter === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSchoolTypeFilter(type)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer border transition-all ${
                    isActive
                      ? 'bg-dark-gray border-dark-gray text-white shadow-xs'
                      : 'bg-white/60 border-dark-gray/15 text-dark-gray hover:bg-white'
                  }`}
                >
                  {type}
                </button>
              );
            })}
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 text-xs text-dark-gray mr-1">
              <span>Status:</span>
            </div>
            {['Semua', 'Draft', 'Sedang Berjalan', 'Direview', 'Selesai'].map((status) => {
              const isActive = statusFilter === status;
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer border transition-all ${
                    isActive
                      ? 'bg-peach-accent border-dark-gray/25 text-dark-gray shadow-xs'
                      : 'bg-white/60 border-dark-gray/15 text-dark-gray hover:bg-white'
                  }`}
                >
                  {status}
                </button>
              );
            })}
          </div>
        </div>

        {/* Schools Table & Collapsible Cards Grid */}
        {processedAudits.length === 0 ? (
          <div className="text-center py-10 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            <School className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-500">Hasil pencarian tidak ditemukan</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Silakan sesuaikan filter pencarian atau kata kunci Anda.</p>
          </div>
        ) : (
          <div className="max-h-[300px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-dark-gray/20 scrollbar-track-transparent">
            <div className="hidden md:block overflow-x-auto border border-slate-150 rounded-xl bg-white">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-150 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-3.5">Nama Instansi / Objek</th>
                    <th className="p-3.5">T.A & Auditor</th>
                    <th className="p-3.5 text-center">Status KKA</th>
                    <th className="p-3.5 text-right">Temuan Keuangan</th>
                    <th className="p-3.5 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {processedAudits.map((audit) => {
                    // Status Badge Styling
                    const statusStyles: Record<string, string> = {
                      'Draft': 'bg-slate-100 text-slate-700 border-slate-200',
                      'Sedang Berjalan': 'bg-sky-50 text-sky-700 border-sky-100',
                      'Direview': 'bg-amber-50 text-amber-700 border-amber-100',
                      'Selesai': 'bg-emerald-50 text-emerald-700 border-emerald-100'
                    };

                    const typeBadgeColors: Record<string, string> = {
                      'SD': 'bg-cyan-50 text-cyan-700 border-cyan-150',
                      'SMP': 'bg-blue-50 text-blue-700 border-blue-150',
                      'SMA': 'bg-indigo-50 text-indigo-700 border-indigo-150',
                      'SMK': 'bg-purple-50 text-purple-700 border-purple-150',
                      'SLB': 'bg-slate-50 text-slate-700 border-slate-150',
                      'Dinas': 'bg-rose-50 text-rose-700 border-rose-150',
                      'Badan': 'bg-amber-50 text-amber-700 border-amber-150',
                      'Kecamatan': 'bg-emerald-50 text-emerald-700 border-emerald-150',
                      'Puskesmas': 'bg-teal-50 text-teal-700 border-teal-150',
                      'Lainnya': 'bg-stone-50 text-stone-700 border-stone-150'
                    };

                    return (
                      <tr 
                        key={audit.id} 
                        className="hover:bg-slate-50/50 transition-colors group"
                      >
                        <td className="p-3.5">
                          <div className="flex items-center gap-2">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold border ${typeBadgeColors[audit.opdType] || 'bg-slate-100'}`}>
                              {audit.opdType}
                            </span>
                            <span className="font-bold text-slate-800 text-xs">
                              {audit.opdName}
                            </span>
                          </div>
                        </td>
                        <td className="p-3.5">
                          <div className="space-y-0.5">
                            <span className="text-slate-500 font-mono">T.A {audit.fiscalYear}</span>
                            <span className="text-[10px] text-slate-400 block font-medium">Auditor: {audit.auditorName}</span>
                          </div>
                        </td>
                        <td className="p-3.5 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${statusStyles[audit.status] || 'bg-slate-150'}`}>
                            {audit.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          {audit.findingsCount > 0 ? (
                            <div className="space-y-0.5">
                              <span className="text-rose-600 font-mono font-bold">{formatIDR(audit.findingsVal)}</span>
                              <span className="text-[10px] text-rose-500 block font-semibold">{audit.findingsCount} temuan</span>
                            </div>
                          ) : (
                            <span className="text-emerald-700 font-medium inline-flex items-center gap-0.5">
                              <CheckCircle className="w-3.5 h-3.5" /> Sesuai
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-center">
                          <button
                            type="button"
                            onClick={() => onSelectAudit(audit)}
                            className="p-1.5 px-2.5 bg-slate-100 hover:bg-emerald-700 hover:text-white rounded-lg border border-slate-200 hover:border-transparent text-slate-600 inline-flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span className="font-semibold text-[11px]">Buka KKA</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards Grid View */}
            <div className="grid grid-cols-1 gap-3.5 md:hidden">
              {processedAudits.map((audit) => {
                const statusStyles: Record<string, string> = {
                  'Draft': 'bg-slate-100 text-slate-700 border-slate-200',
                  'Sedang Berjalan': 'bg-sky-50 text-sky-700 border-sky-100',
                  'Direview': 'bg-amber-50 text-amber-700 border-amber-100',
                  'Selesai': 'bg-emerald-50 text-emerald-700 border-emerald-100'
                };

                const typeBadgeColors: Record<string, string> = {
                  'SD': 'bg-cyan-50 text-cyan-700 border-cyan-150',
                  'SMP': 'bg-blue-50 text-blue-700 border-blue-150',
                  'SMA': 'bg-indigo-50 text-indigo-700 border-indigo-150',
                  'SMK': 'bg-purple-50 text-purple-700 border-purple-150',
                  'SLB': 'bg-slate-50 text-slate-700 border-slate-150'
                };

                return (
                  <div 
                    key={audit.id} 
                    className="bg-white border border-slate-150 rounded-xl p-4 space-y-3 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-bold border ${typeBadgeColors[audit.opdType] || 'bg-slate-100'}`}>
                            {audit.opdType}
                          </span>
                          <span className="font-bold text-slate-800 text-xs text-left truncate max-w-[150px]">
                            {audit.opdName}
                          </span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${statusStyles[audit.status] || 'bg-slate-150'}`}>
                          {audit.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-2 border-y border-slate-50 py-2">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block font-bold">Progres Temuan</span>
                          {audit.findingsCount > 0 ? (
                            <span className="text-xs font-mono font-bold text-rose-600">
                              {formatIDR(audit.findingsVal)}
                            </span>
                          ) : (
                            <span className="text-xs font-semibold text-emerald-700 inline-flex items-center gap-0.5 justify-end">
                              <CheckCircle className="w-3 h-3" /> Nihil
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span>T.A {audit.fiscalYear}</span>
                        <span>Auditor: {audit.auditorName}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onSelectAudit(audit)}
                      className="w-full py-2 bg-slate-50 hover:bg-emerald-700 hover:text-white rounded-lg border border-slate-200 hover:border-transparent text-slate-700 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-4 h-4" /> Buka Kertas Kerja
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
