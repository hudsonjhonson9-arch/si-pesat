import React, { useMemo, useState } from 'react';
import { TargetEntity, OpdAudit, Bidang } from '../types';
import { Map as MapIcon, Building, FileText, ChevronDown, ChevronUp, FolderOpen } from 'lucide-react';

const OPD_TYPE_FILTERS = ['Semua', 'Dinas', 'Badan', 'Kecamatan', 'Desa', 'Kelurahan', 'SD', 'SMP', 'Puskesmas', 'Sekretariat Daerah', 'Lainnya'] as const;

const OPD_TYPE_COLORS: Record<string, string> = {
  Dinas: 'bg-blue-100 text-blue-800 border-blue-200',
  Badan: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  Kecamatan: 'bg-purple-100 text-purple-800 border-purple-200',
  Desa: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Kelurahan: 'bg-teal-100 text-teal-800 border-teal-200',
  SD: 'bg-amber-100 text-amber-800 border-amber-200',
  SMP: 'bg-orange-100 text-orange-800 border-orange-200',
  Puskesmas: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  Lainnya: 'bg-slate-100 text-slate-800 border-slate-200',
};

interface WilayahPenugasanViewProps {
  targetEntities: TargetEntity[];
  audits?: OpdAudit[];
  onSelectAudit?: (audit: OpdAudit, categoryId?: string) => void;
  userRole?: string;
  isAdmin?: boolean;
  userBidangId?: number | null;
  bidangList?: Bidang[];
  isSuperadmin?: boolean;
}

export default function WilayahPenugasanView({ targetEntities, audits = [], onSelectAudit, userRole, isAdmin = false, userBidangId, bidangList = [], isSuperadmin }: WilayahPenugasanViewProps) {
  const [typeFilter, setTypeFilter] = useState<string>('Semua');
  const [yearFilter, setYearFilter] = useState<string>('Semua');
  const [expandedEntityId, setExpandedEntityId] = useState<string | null>(null);

  const hasSuperAccess = isSuperadmin || isAdmin || userRole === 'Inspektur' || userRole === 'Sekretaris';
  const isIrban = userRole === 'Inspektur Pembantu';

  const KABUPATEN_WILAYAH = 'Kabupaten Sumba Barat';

  const userBidang = useMemo(() => {
    if (!userBidangId) return null;
    return bidangList.find(b => b.id === userBidangId) || null;
  }, [userBidangId, bidangList]);

  const userBidangName = userBidang?.name || (hasSuperAccess ? KABUPATEN_WILAYAH : null);
  const userBidangWilayah = userBidang?.wilayah || (hasSuperAccess ? KABUPATEN_WILAYAH : null);

  const mapSrc = useMemo(() => {
    const q = userBidangWilayah || userBidangName || 'Kecamatan Loli, Sumba Barat';
    return `https://www.google.com/maps?q=${encodeURIComponent(q)}&output=embed`;
  }, [userBidangWilayah, userBidangName]);

  const bidangFilteredEntities = useMemo(() => {
    if (hasSuperAccess || !userBidangId) return targetEntities;
    return targetEntities.filter(e => e.bidang_id === userBidangId);
  }, [targetEntities, userBidangId, isAdmin, isSuperadmin]);

  const availableYears = useMemo(() => {
    const years = Array.from(new Set(audits.map(a => a.fiscalYear))).sort().reverse();
    return ['Semua', ...years];
  }, [audits]);

  const filteredEntities = useMemo(() => {
    let result = bidangFilteredEntities;
    if (typeFilter !== 'Semua') {
      result = result.filter(e => e.type === typeFilter);
    }
    return [...result].sort((a, b) => a.name.localeCompare(b.name));
  }, [bidangFilteredEntities, typeFilter]);

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { Semua: bidangFilteredEntities.length };
    OPD_TYPE_FILTERS.slice(1).forEach(t => {
      counts[t] = bidangFilteredEntities.filter(e => e.type === t).length;
    });
    return counts;
  }, [bidangFilteredEntities]);

  return (
    <div className="space-y-5 animate-fade-in" id="wilayah-penugasan-view">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-black text-dark-gray text-lg">Wilayah Penugasan</h2>
          <p className="text-xs text-dark-gray/60 mt-0.5">
            {userBidangName
              ? `Objek pemeriksaan ${userBidangWilayah ? `${userBidangWilayah} (` : ''}${userBidangName}${userBidangWilayah ? ')' : ''} — Inspektorat Kabupaten Sumba Barat`
              : 'Daftar objek pemeriksaan Inspektorat Kabupaten Sumba Barat'}
          </p>
        </div>
        <span className="text-[10px] bg-peach-accent text-dark-gray border border-dark-gray/10 px-2.5 py-1 rounded font-bold font-mono uppercase">
          {filteredEntities.length} Objek
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Map */}
        <div className="lg:col-span-1 bg-white rounded-3xl p-4 border border-dark-gray/10 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold text-dark-gray text-sm flex items-center gap-1.5">
                  <MapIcon className="w-4 h-4 text-peach-accent" />
                  Peta Wilayah
                </h3>
                <p className="text-[10px] text-dark-gray/60 mt-0.5">
                  {userBidangWilayah || userBidangName || 'Kecamatan Loli, Sumba Barat'}
                </p>
              </div>
            </div>

            <div className="w-full bg-slate-50 border border-slate-100 overflow-hidden relative rounded-xl flex-1 min-h-[300px]">
              <iframe
                src={mapSrc}
                className="absolute inset-0 w-full h-full border-0"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
          </div>
        </div>

        {/* Right: Filters + Table */}
        <div className="lg:col-span-2 space-y-4">
          {/* Type Filter Chips */}
          <div className="flex flex-wrap gap-1.5">
            {OPD_TYPE_FILTERS.map(type => {
              const count = typeCounts[type] ?? 0;
              if (type !== 'Semua' && count === 0) return null;
              return (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                    OPD_TYPE_COLORS[type] || 'bg-slate-100 text-slate-800 border-slate-200'
                  } ${
                    typeFilter === type
                      ? 'shadow-md scale-105 ring-2 ring-offset-1 ring-slate-400 opacity-100'
                      : 'opacity-70 hover:opacity-100 hover:shadow-sm'
                  }`}
                >
                  {type}
                  {type !== 'Semua' && count > 0 && (
                    <span className={`ml-1 ${typeFilter === type ? 'opacity-100' : 'opacity-60'}`}>
                      ({count})
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Year Filter */}
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-bold text-dark-gray/70 uppercase tracking-wider">Tahun</label>
            <select
              value={yearFilter}
              onChange={e => setYearFilter(e.target.value)}
              className="text-xs font-bold border border-dark-gray/15 px-2 py-1 rounded-lg bg-white text-dark-gray outline-none focus:border-peach-accent"
            >
              {availableYears.map(y => (
                <option key={y} value={y}>{y === 'Semua' ? 'Semua Tahun' : `TA ${y}`}</option>
              ))}
            </select>
          </div>

          {/* Entities Table */}
          <div className="overflow-y-auto border border-slate-150 rounded-xl bg-white max-h-[500px]">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 bg-slate-50 z-10 shadow-xs">
                <tr className="border-b border-slate-150 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-3.5">Nama Objek</th>
                  <th className="p-3.5 w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEntities.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="p-8 text-center text-slate-400">
                      <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      Tidak ada entitas untuk tipe "{typeFilter}".
                    </td>
                  </tr>
                ) : (
                  filteredEntities.map((entity) => {
                    const isExpanded = expandedEntityId === entity.id;
                    let entityAudits = audits.filter(a => a.opdName === entity.name);
                    if (yearFilter !== 'Semua') {
                      entityAudits = entityAudits.filter(a => a.fiscalYear === yearFilter);
                    }
                    const hasAudits = entityAudits.length > 0;

                    return (
                      <React.Fragment key={entity.id}>
                        <tr
                          className={`transition-colors cursor-pointer ${isExpanded ? 'bg-slate-50' : 'hover:bg-slate-50/50'}`}
                          onClick={() => setExpandedEntityId(isExpanded ? null : entity.id)}
                        >
                          <td className="p-3.5">
                            <div className="font-bold text-slate-800">{entity.name}</div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {entity.type && (
                                <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold uppercase tracking-wider ${OPD_TYPE_COLORS[entity.type] || 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                  {entity.type}
                                </span>
                              )}
                              <span className="text-[10px] text-slate-500 font-medium ml-1">
                                {hasAudits ? `${entityAudits.length} Pemeriksaan` : 'Tidak ada KKA'}
                              </span>
                            </div>
                          </td>
                          <td className="p-3.5 text-right">
                            <button className="p-1.5 text-slate-400 hover:bg-slate-200 rounded-lg transition-colors inline-flex items-center">
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr>
                            <td colSpan={2} className="p-0 border-b border-slate-150">
                              <div className="bg-slate-50/80 px-4 py-3 shadow-inner">
                                {hasAudits ? (
                                  <div className="space-y-2">
                                    {entityAudits.map(audit => (
                                      <div key={audit.id} className="flex items-start justify-between p-3 bg-white border border-slate-200 rounded-xl shadow-xs gap-3">
                                        <div className="flex-1 min-w-0">
                                          <div className="font-bold text-dark-gray text-xs">{audit.auditType || 'Audit Reguler'}</div>
                                          <div className="text-[10px] text-slate-500 mt-0.5">TA. {audit.fiscalYear} • Tim: {audit.auditorName || 'Belum diatur'}</div>
                                          {audit.schedule && audit.schedule.length > 0 && (() => {
                                            const activeMilestone = audit.schedule.find(m => m.status === 'Sedang Berjalan') || audit.schedule.find(m => m.status === 'Belum Mulai');
                                            const completedCount = audit.schedule.filter(m => m.status === 'Selesai').length;
                                            const totalCount = audit.schedule.length;
                                            return (
                                              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                                {activeMilestone && (
                                                  <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                                                    activeMilestone.status === 'Sedang Berjalan' 
                                                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                                                      : 'bg-slate-50 text-slate-500 border-slate-200'
                                                  }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${activeMilestone.status === 'Sedang Berjalan' ? 'bg-blue-500 animate-pulse' : 'bg-slate-300'}`}></span>
                                                    {activeMilestone.name.split(' (')[0]}
                                                  </span>
                                                )}
                                                <span className="text-[9px] text-slate-400 font-medium">{completedCount}/{totalCount} tahap selesai</span>
                                              </div>
                                            );
                                          })()}
                                          <span className={`inline-block mt-1 text-[8.5px] px-1.5 py-0.5 rounded font-black uppercase border ${
                                            audit.status === 'Selesai' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                            audit.status === 'Direview' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                            audit.status === 'Sedang Berjalan' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                            'bg-slate-50 text-slate-500 border-slate-200'
                                          }`}>{audit.status}</span>
                                        </div>
                                        <button 
                                          onClick={(e) => { e.stopPropagation(); onSelectAudit && onSelectAudit(audit); }}
                                          className="px-3 py-1.5 bg-peach-accent text-dark-gray text-[10px] font-bold rounded-lg hover:opacity-90 transition inline-flex items-center gap-1.5 shadow-sm border border-dark-gray/10"
                                        >
                                          <FolderOpen className="w-3.5 h-3.5" /> Buka
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-center py-4 text-slate-400 text-xs font-bold italic border-2 border-dashed border-slate-200 rounded-xl bg-white/50">
                                    Belum mempunyai KKA
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
