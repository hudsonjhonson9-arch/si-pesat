import React, { useMemo, useState } from 'react';
import { TargetEntity, OpdAudit } from '../types';
import { Map as MapIcon, Building, Activity, BarChart3, CheckCircle, FileText, AlertTriangle, FolderOpen, ChevronDown, ChevronUp } from 'lucide-react';

interface HomeViewProps {
  targetEntities: TargetEntity[];
  audits?: OpdAudit[];
  onSelectAudit?: (audit: OpdAudit, categoryId?: string) => void;
  userRole?: string;
}

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

export default function HomeView({ targetEntities, audits = [], onSelectAudit, userRole }: HomeViewProps) {
  const [typeFilter, setTypeFilter] = useState<string>('Semua');
  const [yearFilter, setYearFilter] = useState<string>('Semua');
  const [expandedEntityId, setExpandedEntityId] = useState<string | null>(null);

  const availableYears = useMemo(() => {
    const years = Array.from(new Set(audits.map(a => a.fiscalYear))).sort().reverse();
    return ['Semua', ...years];
  }, [audits]);

  // Simple analytics computation
  const stats = useMemo(() => {
    const totalAudits = audits.length;
    const completedAudits = audits.filter(a => a.status === 'Selesai').length;
    const inProgressAudits = totalAudits - completedAudits;
    let totalTemuan = 0;

    audits.forEach(audit => {
      audit.categories.forEach(cat => {
        cat.items.forEach(item => {
          if (item.status === 'Temuan') totalTemuan++;
        });
      });
    });

    return { totalAudits, completedAudits, inProgressAudits, totalTemuan };
  }, [audits]);

  const filteredEntities = useMemo(() => {
    let result = targetEntities;
    if (typeFilter !== 'Semua') {
      result = result.filter(e => e.type === typeFilter);
    }
    // No direct year filter on target entities, year filter will apply to the audits shown inside
    return [...result].sort((a, b) => a.name.localeCompare(b.name));
  }, [targetEntities, typeFilter]);

  // Count per type for filter badges
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { Semua: targetEntities.length };
    OPD_TYPE_FILTERS.slice(1).forEach(t => {
      counts[t] = targetEntities.filter(e => e.type === t).length;
    });
    return counts;
  }, [targetEntities]);

  const categoriesToReview = useMemo(() => {
    return audits.flatMap(a => 
      a.categories
        .filter(c => c.status === 'Direview')
        .map(c => ({ audit: a, category: c }))
    );
  }, [audits]);

  return (
    <div className="space-y-6 animate-fade-in" id="home-view">
      {/* Notifications Banner */}
      {(userRole === 'Inspektur Pembantu' || userRole === 'Inspektur') && categoriesToReview.length > 0 && (
        <div className="bg-amber-100 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-amber-200/50 p-2 rounded-full">
              <AlertTriangle className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <p className="font-bold text-sm">Menunggu Review Anda</p>
              <p className="text-xs text-amber-700/80">
                Terdapat <strong>{categoriesToReview.length} Jenis Audit</strong> yang diajukan oleh Ketua Tim dan membutuhkan review Anda.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {categoriesToReview.map(({ audit, category }) => (
              <button
                key={`${audit.id}-${category.id}`}
                onClick={() => onSelectAudit && onSelectAudit(audit, category.id)}
                className="flex items-center gap-2 bg-white/60 hover:bg-white text-xs font-bold px-3 py-2 rounded-lg border border-amber-200/50 transition-colors cursor-pointer shadow-sm text-left"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>
                <div>
                  <span className="text-dark-gray">{audit.opdName}</span>
                  <span className="text-amber-700/70 ml-1">({category.name})</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div 
        className="rounded-3xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden bg-slate-900 bg-center bg-cover"
        style={{ backgroundImage: "url('/header-bg.jpg')" }}
      >
        {/* Overlay gradient so text is readable over the background image */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-800/70 to-slate-800/40" />
        
        <div className="absolute right-0 top-0 -mr-10 -mt-10 w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/4 bottom-0 -mb-10 w-40 h-40 bg-peach-accent/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10">
          <span className="bg-white/20 backdrop-blur-md border border-white/10 text-[10px] px-3 py-1 rounded-full font-bold inline-flex items-center gap-1.5 uppercase tracking-wider mb-3">
            <Building className="w-3.5 h-3.5" /> Inspektorat Daerah
          </span>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white mb-2">
            SI-PESAT IRBAN IV
          </h1>
          <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
            Sistem Informasi Penatausahaan Kertas Kerja Audit Terintegrasi Inspektur Pembantu Wilayah IV
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Map Section - smaller */}
        <div className="lg:col-span-1 bg-white rounded-3xl p-4 border border-dark-gray/10 shadow-sm relative overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-bold text-dark-gray text-sm flex items-center gap-1.5">
                <MapIcon className="w-4 h-4 text-peach-accent" />
                Peta Wilayah
              </h3>
              <p className="text-[10px] text-dark-gray/60 mt-0.5">
                Kecamatan Loli, Sumba Barat
              </p>
            </div>
          </div>

          <div className="w-full bg-slate-50 border border-slate-100 overflow-hidden relative min-h-[220px] z-10 rounded-xl flex-1">
            <iframe
              src="https://maps.google.com/maps?q=Loli,%20Kabupaten%20Sumba%20Barat&t=&z=11&ie=UTF8&iwloc=&output=embed"
              className="absolute inset-0 w-full h-full border-0"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </div>

        {/* Audit Objects Table - wider */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-dark-gray/10 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-dark-gray text-base">Daftar Objek Audit</h3>
              <p className="text-xs text-dark-gray/60 mt-0.5">
                Pemantauan KKA Irban IV.
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className="text-[10px] bg-peach-accent text-dark-gray border border-dark-gray/10 px-2.5 py-1 rounded font-bold font-mono uppercase">
                {filteredEntities.length} Objek
              </span>
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
          </div>

          {/* Type Filter Chips */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {OPD_TYPE_FILTERS.map(type => {
              const count = typeCounts[type] ?? 0;
              if (type !== 'Semua' && count === 0) return null;
              return (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                    typeFilter === type
                      ? 'bg-dark-gray text-white border-dark-gray shadow-sm'
                      : 'bg-white text-dark-gray/60 border-dark-gray/15 hover:border-dark-gray/30 hover:text-dark-gray'
                  }`}
                >
                  {type}
                  {type !== 'Semua' && count > 0 && (
                    <span className={`ml-1 ${typeFilter === type ? 'text-white/70' : 'text-dark-gray/40'}`}>
                      ({count})
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="overflow-y-auto flex-1 border border-slate-150 rounded-xl bg-white max-h-[400px]">
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
                                      <div key={audit.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl shadow-xs">
                                        <div>
                                          <div className="font-bold text-dark-gray text-xs">{audit.auditType || 'Audit Reguler'}</div>
                                          <div className="text-[10px] text-slate-500 mt-0.5">TA. {audit.fiscalYear} • Tim: {audit.auditorName || 'Belum diatur'}</div>
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

        {/* Analytics Section */}
        <div className="lg:col-span-1 bg-white rounded-3xl p-6 border border-dark-gray/10 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-dark-gray text-base flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-peach-accent" />
                Analitik KKA
              </h3>
              <p className="text-xs text-dark-gray/60 mt-0.5">
                Progres audit wilayah Loli
              </p>
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-4">
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total KKA</p>
                <p className="text-2xl font-black text-slate-800">{stats.totalAudits}</p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">KKA Final</p>
                <p className="text-2xl font-black text-slate-800">{stats.completedAudits}</p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">KKA dalam proses</p>
                <p className="text-2xl font-black text-slate-800">{stats.inProgressAudits}</p>
              </div>
            </div>

            {stats.totalAudits > 0 && (
              <div className="mt-auto bg-peach-accent/10 rounded-xl p-4 border border-peach-accent/20">
                <p className="text-[10px] font-bold text-dark-gray/60 uppercase tracking-wider mb-2">Progres Keseluruhan</p>
                <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-peach-accent h-2.5 rounded-full" style={{ width: `${(stats.completedAudits / stats.totalAudits) * 100}%` }}></div>
                </div>
                <p className="text-xs text-right mt-1.5 font-bold text-dark-gray">
                  {Math.round((stats.completedAudits / stats.totalAudits) * 100)}%
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
